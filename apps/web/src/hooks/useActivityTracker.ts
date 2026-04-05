/**
 * Activity Tracker Hook
 *
 * Parses WebSocket streaming data into granular ActivityEvent objects
 * for the AgentActivityPanel. Extracts file creation, tool calls,
 * thinking states, and validation steps from the pipeline stream.
 */

import { useState, useCallback, useRef } from 'react';
import type { WebSocketState } from './useWebSocket';
import type { ActivityEvent } from '../components/AgentActivityPanel';

export function useActivityTracker() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const seenFiles = useRef(new Set<string>());
  const idCounter = useRef(0);

  const makeId = () => `act-${++idCounter.current}-${Date.now()}`;

  /** Add a new activity event */
  const addActivity = useCallback((
    type: ActivityEvent['type'],
    agent: string,
    title: string,
    detail?: string,
    meta?: Record<string, any>,
  ) => {
    const event: ActivityEvent = {
      id: makeId(),
      timestamp: new Date(),
      type,
      agent,
      title,
      detail,
      status: 'active',
      meta,
    };
    setActivities(prev => [...prev, event]);
    return event.id;
  }, []);

  /** Mark an activity as completed */
  const completeActivity = useCallback((id: string) => {
    setActivities(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'completed' as const } : a)
    );
  }, []);

  /** Mark all active activities for an agent as completed */
  const completeAgent = useCallback((agent: string) => {
    setActivities(prev =>
      prev.map(a => a.agent === agent && a.status === 'active'
        ? { ...a, status: 'completed' as const }
        : a
      )
    );
  }, []);

  /** Extract file paths from streaming JSON content */
  const extractFilesFromStream = useCallback((accumulated: string, agent: string) => {
    // Match JSON keys that look like file paths
    const filePattern = /"([a-zA-Z0-9_\-./]+\.(tsx?|jsx?|css|html|json|md|env[^"]*))"\s*:/g;
    let match;
    while ((match = filePattern.exec(accumulated)) !== null) {
      const filepath = match[1]!;
      if (!seenFiles.current.has(filepath)) {
        seenFiles.current.add(filepath);
        addActivity('file_create', agent, filepath, `Creating ${filepath.split('/').pop()}`);
      }
    }
  }, [addActivity]);

  /**
   * Process a WebSocket message and extract activity events.
   * Call this from the useWebSocket handleWebSocketMessage callback.
   */
  const processMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'status': {
        const agent = data.agent || 'System';
        const msg = (data.message || '').toLowerCase();

        if (msg.includes('understanding')) {
          addActivity('thinking', agent, 'Analyzing request', data.message);
        } else if (msg.includes('architecting') || msg.includes('planning')) {
          addActivity('planning', agent, 'Creating architecture plan', data.message);
        } else if (msg.includes('building frontend') || msg.includes('building backend')) {
          addActivity('thinking', agent, `${agent} starting`, data.message);
        } else if (msg.includes('reviewing')) {
          addActivity('reviewing', agent, 'Code review in progress', data.message);
        } else if (msg.includes('test')) {
          addActivity('testing', agent, 'Generating test cases', data.message);
        } else if (msg.includes('fixing')) {
          addActivity('fixing', agent, 'Applying fixes', data.message);
        } else if (msg.includes('re-evaluating')) {
          addActivity('validation', agent, 'Re-evaluating quality', data.message);
        } else if (msg.includes('retrying')) {
          addActivity('thinking', agent, 'Retrying with existing plan', data.message);
        } else if (data.provider || data.model) {
          addActivity('api_call', agent, `Calling ${data.model || data.provider}`,
            `Provider: ${data.provider || 'unknown'}`);
        }
        break;
      }

      case 'frontend_stream': {
        extractFilesFromStream(data.accumulated || '', 'Frontend');
        break;
      }

      case 'backend_stream': {
        extractFilesFromStream(data.accumulated || '', 'Backend');
        break;
      }

      case 'understanding': {
        // Complete thinking, add understanding result
        completeAgent('Orchestrator');
        if (data.questions?.length > 0) {
          addActivity('thinking', 'System',
            `${data.questions.length} clarifying questions`,
            data.summary
          );
        }
        break;
      }

      case 'final_plan': {
        completeAgent('Orchestrator');
        const plan = data.content;
        const epCount = plan?.apiContract?.endpoints?.length || 0;
        const feTasks = plan?.frontendTasks?.length || 0;
        const beTasks = plan?.backendTasks?.length || 0;
        addActivity('planning', 'Orchestrator',
          `Plan ready — ${epCount} endpoints, ${feTasks + beTasks} tasks`,
          `Complexity: ${plan?.complexity?.overall || '?'}/5`
        );
        break;
      }

      case 'frontend_complete': {
        completeAgent('Frontend');
        const fileCount = typeof data.content === 'object' ? Object.keys(data.content).length : 0;
        addActivity('validation', 'Frontend',
          `Frontend complete — ${fileCount} files generated`
        );
        break;
      }

      case 'backend_complete': {
        completeAgent('Backend');
        const fileCount = typeof data.content === 'object' ? Object.keys(data.content).length : 0;
        addActivity('validation', 'Backend',
          `Backend complete — ${fileCount} files generated`
        );
        break;
      }

      case 'review_complete': {
        completeAgent('Review');
        const review = data.content;
        const grade = review?.qualityScore?.grade || '?';
        const issues = review?.codeReview?.criticalIssues?.length || 0;
        addActivity('security_check', 'Review',
          `Review complete — Grade ${grade}, ${issues} critical issues`,
          review?.summary
        );
        break;
      }

      case 'test_complete': {
        completeAgent('Test');
        const tests = data.content?.testSuite?.totalTests || 0;
        addActivity('testing', 'Test',
          `${tests} test cases generated`
        );
        break;
      }

      case 'quality_score': {
        addActivity('validation', 'System',
          `Quality: ${data.grade} (${data.overall}/100)`,
          data.needsFeedback ? 'Feedback loop triggered' : undefined
        );
        break;
      }

      case 'feedback_iteration': {
        addActivity('fixing', 'System',
          `Feedback round ${data.iteration}`,
          `${data.issues?.length || 0} issues to fix`
        );
        break;
      }

      case 'complexity_score': {
        addActivity('planning', 'System',
          `Complexity: ${data.score}/5`,
          data.reasoning
        );
        break;
      }

      case 'all_complete': {
        // Mark everything done
        setActivities(prev =>
          prev.map(a => a.status === 'active' ? { ...a, status: 'completed' as const } : a)
        );
        break;
      }

      case 'error':
      case 'cancelled': {
        setActivities(prev =>
          prev.map(a => a.status === 'active'
            ? { ...a, status: data.type === 'error' ? 'error' as const : 'completed' as const }
            : a
          )
        );
        break;
      }
    }
  }, [addActivity, completeAgent, extractFilesFromStream]);

  /** Reset all activities (call when starting a new pipeline) */
  const reset = useCallback(() => {
    setActivities([]);
    seenFiles.current.clear();
    idCounter.current = 0;
  }, []);

  return {
    activities,
    processMessage,
    addActivity,
    completeActivity,
    reset,
  };
}
