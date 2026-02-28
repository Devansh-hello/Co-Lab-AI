import { useState, useRef, useCallback, useEffect } from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  username: string;
  content: string;
  timestamp: Date;
  type?: 'text' | 'orchestrator' | 'frontend' | 'backend' | 'review' | 'status' | 'error' | 'streaming';
  data?: any;
  intent?: 'build' | 'iterate' | 'debug';
  isStreaming?: boolean;
}

export interface StreamingState {
  frontendStream: string;
  backendStream: string;
  reviewStream: string;
  activeAgent: string | null;
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
    }
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const loadHistory = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5000/api/v1/projects/${projectId}/messages`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to load messages' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

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
              content: `Task breakdown created for **${coord.projectMeta?.name || 'Project'}**\n\n**Features:** ${(coord.features || []).join(', ')}\n**Frontend Tasks:** ${(coord.frontendTasks || []).length}\n**Backend Tasks:** ${(coord.backendTasks || []).length}`,
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
      case 'status':
        setWsState(prev => ({
          ...prev,
          isGenerating: true,
          currentStatus: data.message,
          currentAgent: data.agent,
          currentProvider: data.provider,
          currentModel: data.model,
          streaming: { ...prev.streaming, activeAgent: data.agent }
        }));
        break;

      case 'frontend_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, frontendStream: data.accumulated, activeAgent: 'Frontend Agent' }
        }));
        break;

      case 'backend_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, backendStream: data.accumulated, activeAgent: 'Backend Agent' }
        }));
        break;

      case 'review_stream':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, reviewStream: data.accumulated, activeAgent: 'Review Agent' }
        }));
        break;

      case 'orchestrator_complete':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, activeAgent: null }
        }));
        addMessage({
          sender: 'agent',
          username: 'Orchestrator Agent',
          content: `Task breakdown created for **${data.content.projectMeta?.name || 'Project'}**\n\n**Features:** ${(data.content.features || []).join(', ')}\n**Frontend Tasks:** ${(data.content.frontendTasks || []).length}\n**Backend Tasks:** ${(data.content.backendTasks || []).length}`,
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
          streaming: { ...prev.streaming, frontendStream: '', activeAgent: null }
        }));
        const feCodeKeys = typeof data.content === 'object' ? Object.keys(data.content) : [];
        addMessage({
          sender: 'agent',
          username: 'Frontend Agent',
          content: `Frontend code generated\n\n**Files:** ${feCodeKeys.length > 0 ? feCodeKeys.join(', ') : 'Code generated'}`,
          type: 'frontend',
          data: data.content
        });
        break;

      case 'backend_complete':
        setWsState(prev => ({
          ...prev,
          currentStatus: 'Preparing review...',
          currentAgent: undefined,
          streaming: { ...prev.streaming, backendStream: '', activeAgent: null }
        }));
        const beCodeKeys = typeof data.content === 'object' ? Object.keys(data.content) : [];
        addMessage({
          sender: 'agent',
          username: 'Backend Agent',
          content: `Backend code generated\n\n**Files:** ${beCodeKeys.length > 0 ? beCodeKeys.join(', ') : 'Code generated'}`,
          type: 'backend',
          data: data.content
        });
        break;

      case 'review_complete':
        setWsState(prev => ({
          ...prev,
          streaming: { ...prev.streaming, reviewStream: '', activeAgent: null }
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
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', activeAgent: null }
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
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', activeAgent: null }
        }));
        addMessage({
          sender: 'agent',
          username: 'System',
          content: `❌ Error: ${data.message}`,
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
          streaming: { frontendStream: '', backendStream: '', reviewStream: '', activeAgent: null }
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

    ws.current.send(JSON.stringify({ message, projectId, provider, model }));

    setWsState(prev => ({
      ...prev,
      isGenerating: true,
      currentStatus: 'Processing your request...',
      currentAgent: 'Orchestrator Agent',
      error: null,
      streaming: { frontendStream: '', backendStream: '', reviewStream: '', activeAgent: null }
    }));
  }, [addMessage, projectId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      ws.current?.close();
    };
  }, [connect]);

  return { messages, isLoading, wsState, sendMessage, connect, addMessage, updateMessage };
};