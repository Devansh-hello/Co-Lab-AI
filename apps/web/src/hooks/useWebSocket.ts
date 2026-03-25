import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../functions/send';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  username: string;
  content: string;
  timestamp: Date;
  type?: 'text' | 'orchestrator' | 'frontend' | 'backend' | 'review' | 'test' | 'status' | 'error' | 'streaming' | 'understanding' | 'qa_question' | 'qa_answer' | 'qa_summary' | 'final_plan' | 'env_setup' | 'quality_score' | 'feedback_iteration' | 'retry_prompt';
  data?: any;
  intent?: 'build' | 'iterate' | 'debug';
  isStreaming?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenUsageState {
  frontend?: TokenUsage;
  backend?: TokenUsage;
  review?: TokenUsage;
  test?: TokenUsage;
  currentEstimate: number;
}

export interface StreamingState {
  frontendStream: string;
  backendStream: string;
  reviewStream: string;
  testStream: string;
  activeAgent: string | null;
}

export type FlowStage =
  | 'idle'
  | 'understanding'
  | 'waiting_understanding'
  | 'qa'
  | 'planning'
  | 'waiting_plan_review'
  | 'generating'
  | 'reviewing'
  | 'testing'
  | 'feedback'
  | 'completed';

export interface UnderstandingData {
  summary: string;
  projectName: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
  }>;
}

export interface QualityScoreData {
  grade: string;
  metrics: Record<string, number>;
  overall: number;
  needsFeedback: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  isGenerating: boolean;
  currentStatus: string;
  currentAgent?: string;
  currentProvider?: string;
  currentModel?: string;
  error: string | null;
  streaming: StreamingState;
  tokenUsage: TokenUsageState;
  flowStage: FlowStage;
  completedAgents: string[];
  currentIntent?: 'build' | 'iterate' | 'debug';
  understandingData?: UnderstandingData;
  featureReviewData?: any;
  complexityScore?: number;
  qualityScore?: QualityScoreData;
  feedbackIteration: number;
}

export const useWebSocket = (projectId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wsState, setWsState] = useState<WebSocketState>({
    isConnected: false,
    isGenerating: false,
    currentStatus: '',
    currentAgent: undefined,
    currentProvider: undefined,
    currentModel: undefined,
    error: null,
    streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
    tokenUsage: { currentEstimate: 0 },
    flowStage: 'idle',
    completedAgents: [],
    understandingData: undefined,
    featureReviewData: undefined,
    complexityScore: undefined,
    qualityScore: undefined,
    feedbackIteration: 0,
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const intentRef = useRef<string | undefined>(undefined);

  // ── Load history ─────────────────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      if (!projectId) { setIsLoading(false); return; }

      try {
        setIsLoading(true);
        const response = await api.get(`/projects/${projectId}/messages`);
        const data = response.data;

        if (!data.messages || data.messages.length === 0) {
          setMessages([]);
          setIsLoading(false);
          return;
        }

        const formattedMessages: Message[] = [];

        data.messages.forEach((msg: any) => {
          formattedMessages.push({
            id: msg._id,
            sender: 'user',
            username: 'You',
            content: msg.userMessage,
            timestamp: new Date(msg.timestamp),
            type: 'text'
          });

          // Understanding response from history
          if (msg.understandingResponse?.content) {
            formattedMessages.push({
              id: `${msg._id}-understanding`,
              sender: 'agent',
              username: 'System',
              content: msg.understandingResponse.content.summary,
              timestamp: new Date(msg.understandingResponse.timestamp),
              type: 'understanding',
              data: msg.understandingResponse.content,
            });
          }

          // Q&A answers from history (collapsed summary with questions)
          if (msg.qaAnswers && msg.qaAnswers.length > 0) {
            const questions = msg.understandingResponse?.content?.questions || [];
            formattedMessages.push({
              id: `${msg._id}-qa-summary`,
              sender: 'agent',
              username: 'System',
              content: `Answered ${msg.qaAnswers.length} clarifying questions`,
              timestamp: new Date(msg.timestamp),
              type: 'qa_summary',
              data: { answers: msg.qaAnswers, questions },
            });
          }

          if (msg.coordinatorResponse) {
            const coord = msg.coordinatorResponse.content;
            formattedMessages.push({
              id: `${msg._id}-plan`,
              sender: 'agent',
              username: 'Orchestrator Agent',
              content: `Plan ready for **${coord.projectMeta?.name || 'Project'}**`,
              timestamp: new Date(msg.coordinatorResponse.timestamp),
              type: 'final_plan',
              data: coord,
              intent: msg.intent || coord.intent
            });
          }

          if (msg.frontendResponse) {
            const codeKeys = typeof msg.frontendResponse.content === 'object'
              ? Object.keys(msg.frontendResponse.content) : [];
            formattedMessages.push({
              id: `${msg._id}-frontend`,
              sender: 'agent',
              username: 'Frontend Agent',
              content: `Frontend code generated\n\n**Files:** ${codeKeys.length > 0 ? codeKeys.join(', ') : 'Code generated'}`,
              timestamp: new Date(msg.frontendResponse.timestamp),
              type: 'frontend',
              data: msg.frontendResponse.content
            });
          }

          if (msg.backendResponse) {
            const codeKeys = typeof msg.backendResponse.content === 'object'
              ? Object.keys(msg.backendResponse.content) : [];
            formattedMessages.push({
              id: `${msg._id}-backend`,
              sender: 'agent',
              username: 'Backend Agent',
              content: `Backend code generated\n\n**Files:** ${codeKeys.length > 0 ? codeKeys.join(', ') : 'Code generated'}`,
              timestamp: new Date(msg.backendResponse.timestamp),
              type: 'backend',
              data: msg.backendResponse.content
            });
          }

          if (msg.reviewResponse) {
            const review = msg.reviewResponse.content;
            formattedMessages.push({
              id: `${msg._id}-review`,
              sender: 'agent',
              username: 'Review Agent',
              content: `Code review complete\n\n**Summary:** ${review.summary || 'Review completed'}\n**Issues:** ${(review.codeReview?.issues || review.codeReview?.criticalIssues || []).length}\n**Setup Steps:** ${(review.setupGuide?.steps || []).length}`,
              timestamp: new Date(msg.reviewResponse.timestamp),
              type: 'review',
              data: review
            });
            // Removed env setup history loading (introduced bug)
            // const envVars = review?.setupGuide?.envVariables;
            // if (Array.isArray(envVars) && envVars.length > 0) { ... }
          }

          // Test response from history
          if (msg.testResponse?.content) {
            const testData = msg.testResponse.content;
            const totalTests = testData?.testSuite?.totalTests || 0;
            const coverage = testData?.coverage || {};
            formattedMessages.push({
              id: `${msg._id}-test`,
              sender: 'agent',
              username: 'Test Agent',
              content: `Test suite generated — **${totalTests} tests**\n\n**Coverage:** Endpoints ${coverage.endpointCoverage || 0}% · Features ${coverage.featureCoverage || 0}% · Security ${coverage.securityCoverage || 0}%`,
              timestamp: new Date(msg.testResponse.timestamp),
              type: 'test',
              data: testData,
            });
          }

          // Quality score from history
          if (msg.qualityScore?.grade) {
            formattedMessages.push({
              id: `${msg._id}-quality`,
              sender: 'agent',
              username: 'System',
              content: `Quality Grade: **${msg.qualityScore.grade}** (${msg.qualityScore.metrics?.overall || ''}%)`,
              timestamp: new Date(msg.qualityScore.timestamp || msg.timestamp),
              type: 'quality_score',
              data: msg.qualityScore,
            });
          }

          if (msg.status === 'error') {
            formattedMessages.push({
              id: `${msg._id}-error`,
              sender: 'agent',
              username: 'System',
              content: 'An error occurred while processing this request',
              timestamp: new Date(msg.timestamp),
              type: 'error'
            });
          }
        });

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to load history:', error);
        setWsState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load chat history'
        }));
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [projectId]);

  // ── Message helpers ──────────────────────────────────────────
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, ...updates } : msg));
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  // ── WebSocket message handler ────────────────────────────────
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      // ── Understanding phase ────────────────────────────────
      case 'understanding':
        setWsState(prev => ({
          ...prev,
          isGenerating: true,
          flowStage: 'waiting_understanding',
          currentStatus: '',
          currentAgent: undefined,
          understandingData: {
            summary: data.summary,
            projectName: data.projectName,
            questions: data.questions || [],
          },
        }));
        addMessage({
          sender: 'agent',
          username: 'System',
          content: data.summary,
          type: 'understanding',
          data: { summary: data.summary, projectName: data.projectName, questions: data.questions || [] },
        });
        break;

      // ── Final plan (after Q&A + orchestrator) ──────────────
      case 'final_plan':
        intentRef.current = data.content?.intent;
        setWsState(prev => ({
          ...prev,
          flowStage: 'waiting_plan_review',
          currentStatus: '',
          currentAgent: undefined,
          featureReviewData: data.content,
          completedAgents: [...prev.completedAgents, 'Orchestrator Agent'],
          currentIntent: data.content?.intent,
        }));
        addMessage({
          sender: 'agent',
          username: 'Orchestrator Agent',
          content: `Plan ready for **${data.content?.projectMeta?.name || 'Project'}**`,
          type: 'final_plan',
          data: data.content,
          intent: data.content?.intent,
        });
        break;

      // ── Status updates ─────────────────────────────────────
      case 'status':
        setWsState(prev => ({
          ...prev,
          isGenerating: true,
          currentStatus: data.message,
          currentAgent: data.agent,
          currentProvider: data.provider,
          currentModel: data.model,
          streaming: { ...prev.streaming, activeAgent: data.agent },
          flowStage: data.agent === 'Orchestrator Agent' ? 'planning'
            : data.agent === 'Review Agent' ? 'reviewing'
            : data.agent === 'Test Agent' ? 'testing'
            : prev.flowStage === 'idle' ? 'understanding'
            : prev.flowStage === 'feedback' ? 'feedback'
            : 'generating',
        }));
        break;

      // ── Streaming ──────────────────────────────────────────
      case 'frontend_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, frontendStream: data.accumulated },
          tokenUsage: { ...prev.tokenUsage, currentEstimate: data.tokenEstimate ?? Math.ceil((data.accumulated?.length ?? 0) / 4) }
        }));
        break;

      case 'backend_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, backendStream: data.accumulated },
          tokenUsage: { ...prev.tokenUsage, currentEstimate: data.tokenEstimate ?? Math.ceil((data.accumulated?.length ?? 0) / 4) }
        }));
        break;

      case 'review_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, reviewStream: data.accumulated, activeAgent: 'Review Agent' },
          tokenUsage: { ...prev.tokenUsage, currentEstimate: data.tokenEstimate ?? Math.ceil((data.accumulated?.length ?? 0) / 4) }
        }));
        break;

      case 'test_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, testStream: data.accumulated, activeAgent: 'Test Agent' },
          tokenUsage: { ...prev.tokenUsage, currentEstimate: data.tokenEstimate ?? Math.ceil((data.accumulated?.length ?? 0) / 4) }
        }));
        break;

      case 'complexity_score':
        setWsState(prev => ({
          ...prev,
          complexityScore: data.score,
        }));
        break;

      case 'quality_score':
        setWsState(prev => ({
          ...prev,
          qualityScore: {
            grade: data.grade,
            metrics: data.metrics,
            overall: data.overall,
            needsFeedback: data.needsFeedback,
          },
        }));
        addMessage({
          sender: 'agent',
          username: 'System',
          content: `Quality Grade: **${data.grade}** (${data.overall}/100)`,
          type: 'quality_score',
          data: { grade: data.grade, metrics: data.metrics, overall: data.overall, needsFeedback: data.needsFeedback },
        });
        break;

      case 'feedback_iteration':
        setWsState(prev => ({
          ...prev,
          flowStage: 'feedback',
          feedbackIteration: data.iteration,
        }));
        addMessage({
          sender: 'agent',
          username: 'System',
          content: data.message || `Feedback iteration ${data.iteration}`,
          type: 'feedback_iteration',
          data: { iteration: data.iteration, issues: data.issues },
        });
        break;

      case 'token_usage': {
        const agentKey = data.agent === 'Frontend Agent' ? 'frontend'
          : data.agent === 'Backend Agent' ? 'backend'
          : data.agent === 'Test Agent' ? 'test' : 'review';
        setWsState(prev => ({
          ...prev,
          tokenUsage: { ...prev.tokenUsage, [agentKey]: data.usage }
        }));
        break;
      }

      // ── Agent completions ──────────────────────────────────
      case 'frontend_complete':
        setWsState(prev => {
          const updatedAgents = [...prev.completedAgents, 'Frontend Agent'];
          /* Only show "Preparing review" when the other agent is also done (or was never started) */
          const backendStillRunning = prev.streaming.backendStream && !updatedAgents.includes('Backend Agent');
          return {
            ...prev,
            currentStatus: backendStillRunning ? 'Waiting for backend...' : 'Preparing review...',
            currentAgent: backendStillRunning ? prev.currentAgent : undefined,
            streaming: { ...prev.streaming, frontendStream: '' },
            completedAgents: updatedAgents,
          };
        });
        {
          const feCodeKeys = typeof data.content === 'object' ? Object.keys(data.content) : [];
          const feFailed = feCodeKeys.length === 0;
          addMessage({
            sender: 'agent',
            username: 'Frontend Agent',
            content: feFailed
              ? 'Frontend code generation failed — the output could not be parsed.'
              : `Frontend code generated\n\n**Files:** ${feCodeKeys.join(', ')}`,
            type: feFailed ? 'retry_prompt' : 'frontend',
            data: feFailed ? { target: 'frontend' } : data.content,
            intent: intentRef.current as any
          });
        }
        break;

      case 'backend_complete':
        setWsState(prev => {
          const updatedAgents = [...prev.completedAgents, 'Backend Agent'];
          const frontendStillRunning = prev.streaming.frontendStream && !updatedAgents.includes('Frontend Agent');
          return {
            ...prev,
            currentStatus: frontendStillRunning ? 'Waiting for frontend...' : 'Preparing review...',
            currentAgent: frontendStillRunning ? prev.currentAgent : undefined,
            streaming: { ...prev.streaming, backendStream: '' },
            completedAgents: updatedAgents,
          };
        });
        {
          const beCodeKeys = typeof data.content === 'object' ? Object.keys(data.content) : [];
          const beFailed = beCodeKeys.length === 0;
          addMessage({
            sender: 'agent',
            username: 'Backend Agent',
            content: beFailed
              ? 'Backend code generation failed — the output could not be parsed.'
              : `Backend code generated\n\n**Files:** ${beCodeKeys.join(', ')}`,
            type: beFailed ? 'retry_prompt' : 'backend',
            data: beFailed ? { target: 'backend' } : data.content,
            intent: intentRef.current as any
          });
        }
        break;

      case 'test_complete':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, testStream: '', activeAgent: null },
          completedAgents: [...prev.completedAgents, 'Test Agent'],
        }));
        {
          const testData = data.content;
          const totalTests = testData?.testSuite?.totalTests || 0;
          const coverage = testData?.coverage || {};
          addMessage({
            sender: 'agent',
            username: 'Test Agent',
            content: `Test suite generated — **${totalTests} tests** across ${Object.keys(testData?.testSuite?.categories || {}).length} categories\n\n**Coverage:** Endpoints ${coverage.endpointCoverage || 0}% · Features ${coverage.featureCoverage || 0}% · Security ${coverage.securityCoverage || 0}%`,
            type: 'test',
            data: testData,
          });
        }
        break;

      case 'review_complete':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, reviewStream: '', activeAgent: null },
          completedAgents: [...prev.completedAgents, 'Review Agent'],
        }));
        addMessage({
          sender: 'agent',
          username: 'Review Agent',
          content: `Code review complete\n\n**Summary:** ${data.content.summary || 'Review completed'}\n**Issues:** ${(data.content.codeReview?.issues || data.content.codeReview?.criticalIssues || []).length}\n**Setup Steps:** ${(data.content.setupGuide?.steps || []).length}`,
          type: 'review',
          data: data.content
        });
        // Add env setup card if the review includes env variables
        {
          const envVars = data.content?.setupGuide?.envVariables;
          if (Array.isArray(envVars) && envVars.length > 0) {
            addMessage({
              sender: 'agent',
              username: 'System',
              content: 'Configure your environment variables to run the project.',
              type: 'env_setup',
              data: { envVariables: envVars },
            });
          }
        }
        break;

      case 'all_complete':
        setWsState(prev => ({
          ...prev,
          isGenerating: false,
          currentStatus: '',
          currentAgent: undefined,
          currentProvider: undefined,
          currentModel: undefined,
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
          tokenUsage: { currentEstimate: 0 },
          flowStage: 'completed',
          understandingData: undefined,
          featureReviewData: undefined,
        }));
        {
          const gradeEmoji = data.qualityGrade === 'A' ? '' : data.qualityGrade === 'B' ? '' : '';
          const feedbackNote = data.feedbackIterations > 0 ? ` (${data.feedbackIterations} feedback iteration applied)` : '';
          addMessage({
            sender: 'agent',
            username: 'System',
            content: `**Project generation completed!** ${gradeEmoji}${data.qualityGrade ? ` Quality: **${data.qualityGrade}**` : ''}${feedbackNote}`,
            type: 'text'
          });
        }
        break;

      case 'cancelled':
        setWsState(prev => ({
          ...prev,
          isGenerating: false,
          flowStage: 'idle',
          currentStatus: '',
          currentAgent: undefined,
          completedAgents: [],
        }));
        addMessage({
          sender: 'agent',
          username: 'System',
          content: data.message || 'Generation stopped.',
          type: 'text',
        });
        break;

      case 'error':
        setWsState(prev => ({
          ...prev,
          isGenerating: false,
          currentStatus: '',
          error: data.message,
          currentAgent: undefined,
          currentProvider: undefined,
          currentModel: undefined,
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
          tokenUsage: { currentEstimate: 0 },
          flowStage: 'idle',
          completedAgents: [],
          feedbackIteration: 0,
        }));
        addMessage({
          sender: 'agent',
          username: 'System',
          content: `Error: ${data.message}`,
          type: 'error'
        });
        break;
    }
  }, [addMessage, updateMessage, removeMessage]);

  // ── WebSocket connection ─────────────────────────────────────
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      const WS_URL = import.meta.env.VITE_WS_URL
        ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        setWsState(prev => ({ ...prev, isConnected: true, error: null }));
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        setWsState(prev => ({
          ...prev,
          isConnected: false,
          isGenerating: false,
          currentStatus: '',
          currentAgent: undefined,
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
          flowStage: 'idle',
        }));
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsState(prev => ({ ...prev, error: 'Connection error' }));
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setWsState(prev => ({ ...prev, error: 'Failed to connect' }));
    }
  }, [handleWebSocketMessage]);

  // ── Send functions ───────────────────────────────────────────
  const sendMessage = useCallback((message: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setWsState(prev => ({ ...prev, error: 'Not connected to server' }));
      return;
    }
    if (!projectId) {
      setWsState(prev => ({ ...prev, error: 'No project selected' }));
      return;
    }

    addMessage({ sender: 'user', username: 'You', content: message, type: 'text' });

    ws.current.send(JSON.stringify({ type: 'message', message, projectId }));

    setWsState(prev => ({
      ...prev,
      isGenerating: true,
      currentStatus: 'Understanding your project...',
      currentAgent: undefined,
      error: null,
      streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
      tokenUsage: { currentEstimate: 0 },
      flowStage: 'understanding',
      completedAgents: [],
      understandingData: undefined,
      featureReviewData: undefined,
      complexityScore: undefined,
      qualityScore: undefined,
      feedbackIteration: 0,
    }));
  }, [addMessage, projectId]);

  const sendUnderstandingResponse = useCallback((confirmed: boolean) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({
      type: 'understanding_response',
      confirmed,
      projectId,
    }));

    if (confirmed) {
      const hasQuestions = (wsState.understandingData?.questions?.length ?? 0) > 0;
      setWsState(prev => ({
        ...prev,
        flowStage: hasQuestions ? 'qa' : 'planning',
        currentStatus: hasQuestions ? '' : 'Creating your project plan...',
        currentAgent: hasQuestions ? undefined : 'Orchestrator Agent',
      }));
    }
    // If not confirmed, backend sends 'cancelled' which is handled above
  }, [projectId, wsState.understandingData]);

  const sendQAComplete = useCallback((answers: Array<{ questionId: string; answer: string }>) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({
      type: 'qa_complete',
      answers,
      projectId,
    }));

    setWsState(prev => ({
      ...prev,
      flowStage: 'planning',
      currentStatus: 'Creating your project plan...',
      currentAgent: 'Orchestrator Agent',
    }));
  }, [projectId]);

  const sendProceed = useCallback((proceed: boolean) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({ type: 'proceed', proceed, projectId }));

    if (proceed) {
      setWsState(prev => ({
        ...prev,
        flowStage: 'generating',
        currentStatus: 'Starting code generation...',
      }));
    }
    // If not proceed, backend sends 'cancelled'
  }, [projectId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      ws.current?.close();
    };
  }, [connect]);

  return {
    messages,
    isLoading,
    wsState,
    sendMessage,
    sendUnderstandingResponse,
    sendQAComplete,
    sendProceed,
    connect,
    addMessage,
    updateMessage,
  };
};
