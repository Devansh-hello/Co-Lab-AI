import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../functions/send';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  username: string;
  content: string;
  timestamp: Date;
  type?: 'text' | 'orchestrator' | 'frontend' | 'backend' | 'review' | 'status' | 'error' | 'streaming' | 'confirmation' | 'feature_review';
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
  currentEstimate: number;
}

export interface StreamingState {
  frontendStream: string;
  backendStream: string;
  reviewStream: string;
  activeAgent: string | null;
}

export type FlowStage =
  | 'idle'
  | 'waiting_confirmation'
  | 'confirmed'
  | 'orchestrating'
  | 'waiting_review'
  | 'generating'
  | 'reviewing'
  | 'completed';

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
  confirmationData?: {
    name: string;
    description: string;
    techStack?: any;
  };
  featureReviewData?: any;
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
    streaming: {
      frontendStream: '',
      backendStream: '',
      reviewStream: '',
      activeAgent: null
    },
    tokenUsage: { currentEstimate: 0 },
    flowStage: 'idle',
    completedAgents: [],
    confirmationData: undefined,
    featureReviewData: undefined,
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const intentRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const loadHistory = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

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

          if (msg.coordinatorResponse) {
            const coord = msg.coordinatorResponse.content;
            formattedMessages.push({
              id: `${msg._id}-orchestrator`,
              sender: 'agent',
              username: 'Orchestrator Agent',
              content: `Plan ready for **${coord.projectMeta?.name || 'Project'}**`,
              timestamp: new Date(msg.coordinatorResponse.timestamp),
              type: 'orchestrator',
              data: coord,
              intent: msg.intent || coord.intent
            });
          }

          if (msg.frontendResponse) {
            const codeKeys = typeof msg.frontendResponse.content === 'object'
              ? Object.keys(msg.frontendResponse.content)
              : [];
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
              ? Object.keys(msg.backendResponse.content)
              : [];
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
              content: `Code review complete\n\n**Summary:** ${review.summary || 'Review completed'}\n**Issues:** ${(review.codeReview?.issues || []).length}\n**Setup Steps:** ${(review.setupGuide?.steps || []).length}`,
              timestamp: new Date(msg.reviewResponse.timestamp),
              type: 'review',
              data: review
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

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      // ── New interactive flow messages ──────────────────────
      case 'project_confirmation':
        setWsState(prev => ({
          ...prev,
          isGenerating: true,
          flowStage: 'waiting_confirmation',
          currentStatus: 'Awaiting your confirmation...',
          currentAgent: undefined,
          confirmationData: data.projectInfo,
        }));
        addMessage({
          sender: 'agent',
          username: 'System',
          content: `I've analyzed your project requirements.`,
          type: 'confirmation',
          data: data.projectInfo,
        });
        break;

      case 'feature_review':
        setWsState(prev => ({
          ...prev,
          flowStage: 'waiting_review',
          currentStatus: 'Review the planned features...',
          currentAgent: undefined,
          featureReviewData: data.content,
          completedAgents: [...prev.completedAgents, 'Orchestrator Agent'],
        }));
        addMessage({
          sender: 'agent',
          username: 'Orchestrator Agent',
          content: `Task breakdown created for **${data.content.projectMeta?.name || 'Project'}**`,
          type: 'feature_review',
          data: data.content,
          intent: data.content.intent,
        });
        break;

      // ── Existing messages ──────────────────────────────────
      case 'status':
        setWsState(prev => ({
          ...prev,
          isGenerating: true,
          currentStatus: data.message,
          currentAgent: data.agent,
          currentProvider: data.provider,
          currentModel: data.model,
          streaming: { ...prev.streaming, activeAgent: data.agent },
          flowStage: data.agent === 'Orchestrator Agent' ? 'orchestrating'
            : data.agent === 'Review Agent' ? 'reviewing'
            : 'generating',
        }));
        break;

      case 'frontend_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, frontendStream: data.accumulated, activeAgent: 'Frontend Agent' },
          tokenUsage: { ...prev.tokenUsage, currentEstimate: data.tokenEstimate ?? Math.ceil((data.accumulated?.length ?? 0) / 4) }
        }));
        break;

      case 'backend_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, backendStream: data.accumulated, activeAgent: 'Backend Agent' },
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

      case 'token_usage': {
        const agentKey = data.agent === 'Frontend Agent' ? 'frontend'
          : data.agent === 'Backend Agent' ? 'backend'
          : 'review';
        setWsState(prev => ({
          ...prev,
          tokenUsage: { ...prev.tokenUsage, [agentKey]: data.usage }
        }));
        break;
      }

      case 'orchestrator_complete':
        intentRef.current = data.intent || data.content?.intent;
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, activeAgent: null },
          completedAgents: [...prev.completedAgents, 'Orchestrator Agent'],
          currentIntent: intentRef.current as any,
        }));
        addMessage({
          sender: 'agent',
          username: 'Orchestrator Agent',
          content: `Plan ready for **${data.content.projectMeta?.name || 'Project'}**`,
          type: 'orchestrator',
          data: data.content,
          intent: data.intent
        });
        break;

      case 'frontend_complete':
        setWsState(prev => ({
          ...prev,
          currentStatus: 'Preparing review...',
          currentAgent: undefined,
          streaming: { ...prev.streaming, frontendStream: '', activeAgent: null },
          completedAgents: [...prev.completedAgents, 'Frontend Agent'],
        }));
        {
          const feCodeKeys = typeof data.content === 'object' ? Object.keys(data.content) : [];
          addMessage({
            sender: 'agent',
            username: 'Frontend Agent',
            content: `Frontend code generated\n\n**Files:** ${feCodeKeys.length > 0 ? feCodeKeys.join(', ') : 'Code generated'}`,
            type: 'frontend',
            data: data.content,
            intent: intentRef.current as any
          });
        }
        break;

      case 'backend_complete':
        setWsState(prev => ({
          ...prev,
          currentStatus: 'Preparing review...',
          currentAgent: undefined,
          streaming: { ...prev.streaming, backendStream: '', activeAgent: null },
          completedAgents: [...prev.completedAgents, 'Backend Agent'],
        }));
        {
          const beCodeKeys = typeof data.content === 'object' ? Object.keys(data.content) : [];
          addMessage({
            sender: 'agent',
            username: 'Backend Agent',
            content: `Backend code generated\n\n**Files:** ${beCodeKeys.length > 0 ? beCodeKeys.join(', ') : 'Code generated'}`,
            type: 'backend',
            data: data.content,
            intent: intentRef.current as any
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
          content: `Code review complete\n\n**Summary:** ${data.content.summary || 'Review completed'}\n**Issues:** ${(data.content.codeReview?.issues || []).length}\n**Setup Steps:** ${(data.content.setupGuide?.steps || []).length}`,
          type: 'review',
          data: data.content
        });
        break;

      case 'all_complete':
        setWsState(prev => ({
          ...prev,
          isGenerating: false,
          currentStatus: '',
          currentAgent: undefined,
          currentProvider: undefined,
          currentModel: undefined,
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', activeAgent: null },
          tokenUsage: { currentEstimate: 0 },
          flowStage: 'completed',
          confirmationData: undefined,
          featureReviewData: undefined,
        }));
        addMessage({
          sender: 'agent',
          username: 'System',
          content: `**Project generation completed!**`,
          type: 'text'
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
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', activeAgent: null },
          tokenUsage: { currentEstimate: 0 },
          flowStage: 'idle',
          completedAgents: [],
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

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      const WS_URL = import.meta.env.VITE_WS_URL
        ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
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
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', activeAgent: null },
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

  // Send initial message
  const sendMessage = useCallback((message: string, provider: string, model: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setWsState(prev => ({ ...prev, error: 'Not connected to server' }));
      return;
    }

    if (!projectId) {
      setWsState(prev => ({ ...prev, error: 'No project selected' }));
      return;
    }

    addMessage({ sender: 'user', username: 'You', content: message, type: 'text' });

    ws.current.send(JSON.stringify({ type: 'message', message, projectId, provider, model }));

    setWsState(prev => ({
      ...prev,
      isGenerating: true,
      currentStatus: 'Analyzing your project...',
      currentAgent: undefined,
      error: null,
      streaming: { frontendStream: '', backendStream: '', reviewStream: '', activeAgent: null },
      tokenUsage: { currentEstimate: 0 },
      flowStage: 'idle',
      completedAgents: [],
      confirmationData: undefined,
      featureReviewData: undefined,
    }));
  }, [addMessage, projectId]);

  // Send confirmation response (Yes/No)
  const sendConfirmation = useCallback((proceed: boolean, additionalInput?: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({
      type: 'confirm',
      proceed,
      additionalInput,
      projectId,
    }));

    if (proceed) {
      setWsState(prev => ({
        ...prev,
        flowStage: 'confirmed',
        currentStatus: 'Starting orchestrator...',
        currentAgent: 'Orchestrator Agent',
      }));
    } else {
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
        content: 'Generation stopped by user.',
        type: 'text',
      });
    }
  }, [addMessage, projectId]);

  // Send proceed response after feature review
  const sendProceed = useCallback((proceed: boolean, clarification?: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({
      type: 'proceed',
      proceed,
      clarification,
      projectId,
    }));

    if (proceed) {
      setWsState(prev => ({
        ...prev,
        flowStage: 'generating',
        currentStatus: 'Starting code generation...',
      }));
    } else if (clarification) {
      setWsState(prev => ({
        ...prev,
        flowStage: 'orchestrating',
        currentStatus: 'Re-analyzing with your feedback...',
        currentAgent: 'Orchestrator Agent',
        completedAgents: [],
      }));
    } else {
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
        content: 'Generation stopped by user.',
        type: 'text',
      });
    }
  }, [addMessage, projectId]);

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
    sendConfirmation,
    sendProceed,
    connect,
    addMessage,
    updateMessage,
  };
};
