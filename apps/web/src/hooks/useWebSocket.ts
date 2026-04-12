import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../functions/send';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  username: string;
  content: string;
  timestamp: Date;
  type?: 'text' | 'orchestrator' | 'frontend' | 'backend' | 'review' | 'test' | 'status' | 'error' | 'streaming' | 'understanding' | 'qa_question' | 'qa_answer' | 'qa_summary' | 'final_plan' | 'env_setup' | 'quality_score' | 'feedback_iteration' | 'retry_prompt' | 'cancelled';
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
  | 'completed'
  | 'permission_prompt';

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

export interface PendingPermission {
  requestId: string;
  resource: string;
  message: string;
  options: string[];
}

export interface PRDData {
  projectName: string;
  vision: string;
  targetUsers: string;
  features: Array<{
    name: string;
    description: string;
    priority: 'P0' | 'P1' | 'P2';
    userStories: string[];
    acceptanceCriteria: string[];
  }>;
  technicalConstraints: string[];
  successMetrics: string[];
  outOfScope: string[];
  mvpDefinition: string;
}

export interface FeatureData {
  _id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  qualityScore?: { grade: string; overall: number };
  acceptanceCriteria?: string[];
  statusHistory?: Array<{ from: string; to: string; changedAt: string; reason: string }>;
}

export interface GuardrailReportData {
  passed: boolean;
  results: Array<{
    name: string;
    pass: boolean;
    score: number;
    reason: string;
    severity: string;
  }>;
  overallScore: number;
  criticalFailures: string[];
}

export interface CheckpointData {
  checkpointId: string;
  phase: string;
  label: string;
}

export interface ToolCallData {
  call: {
    serverName: string;
    toolName: string;
    args: Record<string, any>;
  };
  result: {
    success: boolean;
    preview: string;
    durationMs: number;
  };
  phase: string;
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
  pendingPermission?: PendingPermission;
  transportMode: 'websocket' | 'sse';
  prdData?: PRDData;
  features?: FeatureData[];
  featureSummary?: Record<string, number>;
  checkpoints?: CheckpointData[];
  guardrailReports?: { frontend?: GuardrailReportData; backend?: GuardrailReportData };
  toolCalls?: ToolCallData[];
}

// ─── Constants ──────────────────────────────────────────────────

const MAX_RECONNECT_DELAY = 30_000;
const BASE_RECONNECT_DELAY = 1_000;
const SLEEP_DETECTION_INTERVAL = 15_000;
const SLEEP_THRESHOLD = 120_000;
const MAX_WS_FAILURES_BEFORE_SSE = 3;

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
    pendingPermission: undefined,
    transportMode: 'websocket',
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const intentRef = useRef<string | undefined>(undefined);
  const prevProjectIdRef = useRef(projectId);

  // ── Activity tracker callback ────────────────────────────────
  const rawMessageCallbackRef = useRef<((data: any) => void) | null>(null);

  // ── Transport resilience refs ─────────────────────────────────
  const sessionIdRef = useRef<string | null>(null);
  const lastSeqRef = useRef(0);
  const reconnectAttemptRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  const messageBufferRef = useRef<string[]>([]);
  const lastEventTimeRef = useRef(Date.now());

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
          }

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

  // ── Reset pipeline state when project changes ────────────────
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      prevProjectIdRef.current = projectId;
      sessionIdRef.current = null;
      lastSeqRef.current = 0;
      setWsState(prev => ({
        ...prev,
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
        pendingPermission: undefined,
      }));
    }
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
    // Track sequence number for resume
    if (data.seq !== undefined) {
      lastSeqRef.current = data.seq;
    }
    lastEventTimeRef.current = Date.now();

    // Forward to activity tracker (if subscribed)
    rawMessageCallbackRef.current?.(data);

    switch (data.type) {
      // ── Session (transport layer) ───────────────────────────
      case 'session':
        sessionIdRef.current = data.sessionId;
        break;

      // ── Resume failed ───────────────────────────────────────
      case 'resume_failed':
        // State is stale — reload from REST API
        setWsState(prev => ({
          ...prev,
          isGenerating: false,
          flowStage: 'idle',
          currentStatus: '',
        }));
        break;

      // ── Permission request ──────────────────────────────────
      case 'permission_request':
        setWsState(prev => ({
          ...prev,
          flowStage: 'permission_prompt',
          pendingPermission: {
            requestId: data.requestId,
            resource: data.resource,
            message: data.message,
            options: data.options,
          },
        }));
        break;

      // ── Understanding phase ────────────────────────────────
      case 'understanding':
        setWsState(prev => ({
          ...prev,
          isGenerating: false,
          flowStage: 'waiting_understanding',
          currentStatus: '',
          currentAgent: undefined,
          completedAgents: [],
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
          isGenerating: false,
          flowStage: 'waiting_plan_review',
          currentStatus: '',
          currentAgent: undefined,
          featureReviewData: data.content,
          completedAgents: [],
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
          pendingPermission: undefined,
          toolCalls: undefined,
          guardrailReports: undefined,
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

      case 'prd':
        setWsState(prev => ({ ...prev, prdData: data.content }));
        addMessage({
          sender: 'agent',
          username: 'Product Manager',
          content: `**Product Requirements Document** generated for **${data.content?.projectName || 'Project'}**`,
          type: 'text',
          data: { prd: data.content },
        });
        break;

      case 'feature_update':
        setWsState(prev => ({
          ...prev,
          features: data.features,
          featureSummary: data.summary,
        }));
        break;

      case 'checkpoint_saved':
        setWsState(prev => ({
          ...prev,
          checkpoints: [...(prev.checkpoints || []), { checkpointId: data.checkpointId, phase: data.phase, label: data.label }],
        }));
        break;

      case 'tool_call':
        setWsState(prev => ({
          ...prev,
          toolCalls: [...(prev.toolCalls || []), {
            call: data.call,
            result: data.result,
            phase: data.phase,
          }],
        }));
        addMessage({
          sender: 'agent',
          username: data.call.serverName,
          content: `Used **${data.call.toolName}**`,
          type: 'status',
          data: { toolCall: data },
        });
        break;

      case 'guardrail_report':
        setWsState(prev => ({
          ...prev,
          guardrailReports: {
            ...prev.guardrailReports,
            [data.side]: data.report,
          },
        }));
        if (!data.report.passed) {
          addMessage({
            sender: 'agent',
            username: 'Guardrails',
            content: `**${data.side} guardrail failures:** ${data.report.criticalFailures.join('; ')}`,
            type: 'status',
          });
        }
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

  // ── Reconnect with exponential backoff ──────────────────────
  const scheduleReconnect = useCallback(() => {
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
      MAX_RECONNECT_DELAY
    ) + Math.random() * 500; // Jitter

    reconnectAttemptRef.current++;
    reconnectTimeoutRef.current = setTimeout(connect, delay);
  }, []);

  // ── Flush buffered messages ─────────────────────────────────
  const flushMessageBuffer = useCallback(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const buffer = messageBufferRef.current;
    messageBufferRef.current = [];
    for (const msg of buffer) {
      ws.current.send(msg);
    }
  }, []);

  // ── Safe send (buffers when disconnected) ───────────────────
  const safeSend = useCallback((data: any) => {
    const serialized = JSON.stringify(data);
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(serialized);
    } else {
      messageBufferRef.current.push(serialized);
    }
  }, []);

  // ── WebSocket connection ─────────────────────────────────────
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL
        ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        reconnectAttemptRef.current = 0;
        consecutiveFailuresRef.current = 0;

        if (sessionIdRef.current) {
          // Resume existing session — keep pipeline state until server confirms
          setWsState(prev => ({ ...prev, isConnected: true, error: null, transportMode: 'websocket' }));
          ws.current?.send(JSON.stringify({
            type: 'resume',
            sessionId: sessionIdRef.current,
            lastSeq: lastSeqRef.current,
            projectId,
          }));
        } else {
          // Fresh connection — no active session, reset generation state
          setWsState(prev => ({
            ...prev,
            isConnected: true,
            error: null,
            transportMode: 'websocket',
            isGenerating: false,
            currentStatus: '',
            currentAgent: undefined,
          }));
        }

        // Flush any buffered messages
        flushMessageBuffer();
      };

      ws.current.onmessage = (event) => {
        if (typeof event.data !== 'string' || (event.data[0] !== '{' && event.data[0] !== '[')) return;
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch {
          // Non-JSON frame (ping/status) — ignore silently
        }
      };

      ws.current.onclose = () => {
        setWsState(prev => ({
          ...prev,
          isConnected: false,
          // Keep pipeline state across reconnects (don't reset flowStage/isGenerating)
        }));
        scheduleReconnect();
      };

      ws.current.onerror = () => {
        consecutiveFailuresRef.current++;
        console.warn(`[ws] Connection failed (attempt ${consecutiveFailuresRef.current}) — will retry with backoff`);
        setWsState(prev => ({ ...prev, error: 'Connection error' }));
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      consecutiveFailuresRef.current++;
      setWsState(prev => ({ ...prev, error: 'Failed to connect' }));
      scheduleReconnect();
    }
  }, [handleWebSocketMessage, flushMessageBuffer, scheduleReconnect]);

  // ── Sleep/wake detection ────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const gap = Date.now() - lastEventTimeRef.current;
      if (gap > SLEEP_THRESHOLD && wsState.isGenerating) {
        console.warn(`[ws] Sleep detected (${Math.round(gap / 1000)}s gap) — resetting generation state`);
        // Generation is certainly stale after 2+ minutes of silence — reset
        sessionIdRef.current = null;
        setWsState(prev => ({
          ...prev,
          isGenerating: false,
          currentStatus: '',
          currentAgent: undefined,
        }));
        ws.current?.close();
        // onclose handler will trigger reconnect with backoff
      }
    }, SLEEP_DETECTION_INTERVAL);

    return () => clearInterval(interval);
  }, [wsState.isGenerating]);

  // ── Send functions ───────────────────────────────────────────
  const sendMessage = useCallback((message: string) => {
    if (!projectId) {
      setWsState(prev => ({ ...prev, error: 'No project selected' }));
      return;
    }

    addMessage({ sender: 'user', username: 'You', content: message, type: 'text' });

    safeSend({ type: 'message', message, projectId });

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
      pendingPermission: undefined,
    }));
  }, [addMessage, safeSend, projectId]);

  const sendUnderstandingResponse = useCallback((confirmed: boolean) => {
    safeSend({ type: 'understanding_response', confirmed, projectId });

    if (confirmed) {
      const hasQuestions = (wsState.understandingData?.questions?.length ?? 0) > 0;
      setWsState(prev => ({
        ...prev,
        flowStage: hasQuestions ? 'qa' : 'planning',
        currentStatus: hasQuestions ? '' : 'Creating your project plan...',
        currentAgent: hasQuestions ? undefined : 'Orchestrator Agent',
      }));
    }
  }, [safeSend, projectId, wsState.understandingData]);

  const sendQAComplete = useCallback((answers: Array<{ questionId: string; answer: string }>) => {
    safeSend({ type: 'qa_complete', answers, projectId });

    setWsState(prev => ({
      ...prev,
      flowStage: 'planning',
      currentStatus: 'Creating your project plan...',
      currentAgent: 'Orchestrator Agent',
    }));
  }, [safeSend, projectId]);

  const sendProceed = useCallback((proceed: boolean) => {
    safeSend({ type: 'proceed', proceed, projectId });

    if (proceed) {
      setWsState(prev => ({
        ...prev,
        flowStage: 'generating',
        currentStatus: 'Starting code generation...',
      }));
    }
  }, [safeSend, projectId]);

  const sendPermissionResponse = useCallback((requestId: string, decision: 'allow' | 'deny' | 'allow_always') => {
    safeSend({ type: 'permission_response', requestId, decision });

    setWsState(prev => ({
      ...prev,
      flowStage: prev.flowStage === 'permission_prompt' ? 'generating' : prev.flowStage,
      pendingPermission: undefined,
    }));
  }, [safeSend]);

  const resumeCheckpoint = useCallback((checkpointId: string) => {
    safeSend({ type: 'resume_checkpoint', checkpointId, projectId });
    setWsState(prev => ({
      ...prev,
      isGenerating: true,
      flowStage: 'generating',
      currentStatus: 'Resuming from checkpoint...',
      currentAgent: 'System',
    }));
  }, [safeSend, projectId]);

  const cancelPipeline = useCallback(() => {
    safeSend({ type: 'cancel' });
    setWsState(prev => ({
      ...prev,
      isGenerating: false,
      flowStage: 'idle',
      currentStatus: '',
      currentAgent: undefined,
      streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
      completedAgents: [],
    }));
  }, [safeSend]);

  useEffect(() => {
    const delay = setTimeout(connect, 500);
    return () => {
      clearTimeout(delay);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      ws.current?.close();
    };
  }, [connect]);

  /** Subscribe to raw WebSocket messages for activity tracking */
  const setRawMessageCallback = useCallback((cb: ((data: any) => void) | null) => {
    rawMessageCallbackRef.current = cb;
  }, []);

  return {
    messages,
    isLoading,
    wsState,
    sendMessage,
    sendUnderstandingResponse,
    sendQAComplete,
    sendProceed,
    sendPermissionResponse,
    resumeCheckpoint,
    cancelPipeline,
    setRawMessageCallback,
    connect,
    addMessage,
    updateMessage,
  };
};
