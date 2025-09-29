import { useState, useRef, useCallback, useEffect } from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  username: string;
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'frontend' | 'backend' | 'documentation' | 'status' | 'error' | 'streaming';
  data?: any;
  isStreaming?: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  isGenerating: boolean;
  currentStatus: string;
  error: string | null;
}

export const useWebSocket = (projectId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wsState, setWsState] = useState<WebSocketState>({
    isConnected: false,
    isGenerating: false,
    currentStatus: '',
    error: null
  });
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const currentStreamingMessageRef = useRef<string | null>(null);

  // Load chat history from API
  useEffect(() => {
    const loadHistory = async () => {
      if (!projectId) {
        console.error('No projectId provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No auth token found');
          setWsState(prev => ({ ...prev, error: 'Please log in to continue' }));
          setIsLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/v1/projects/${projectId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
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
        
        // Convert DB messages to UI format
        const formattedMessages: Message[] = [];
        
        data.messages.forEach((msg: any) => {
          // User message
          formattedMessages.push({
            id: msg._id,
            sender: 'user',
            username: 'You',
            content: msg.userMessage,
            timestamp: new Date(msg.timestamp),
            type: 'text'
          });
          
          // Coordinator/Analysis response
          if (msg.coordinatorResponse) {
            const coord = msg.coordinatorResponse.content;
            formattedMessages.push({
              id: `${msg._id}-coord`,
              sender: 'agent',
              username: 'AI Generator',
              content: `✅ Project analysis completed!\n\n**Project:** ${coord.project.name}\n**Description:** ${coord.project.description}\n**Features:** ${coord.features.join(', ')}`,
              timestamp: new Date(msg.coordinatorResponse.timestamp),
              type: 'analysis',
              data: coord
            });
          }
          
          // Frontend response
          if (msg.frontendResponse) {
            const frontend = msg.frontendResponse.content;
            formattedMessages.push({
              id: `${msg._id}-frontend`,
              sender: 'agent',
              username: 'AI Generator',
              content: `🎨 Frontend code generated!\n\n**Components:** ${frontend.components.length} component(s)\n**Framework:** ${frontend.styling.framework}\n**State Management:** ${frontend.state_management.approach}`,
              timestamp: new Date(msg.frontendResponse.timestamp),
              type: 'frontend',
              data: frontend
            });
          }
          
          // Backend response
          if (msg.backendResponse) {
            const backend = msg.backendResponse.content;
            formattedMessages.push({
              id: `${msg._id}-backend`,
              sender: 'agent',
              username: 'AI Generator',
              content: `⚙️ Backend code generated!\n\n**API Endpoints:** ${backend.api_endpoints.length} endpoint(s)\n**Database:** ${backend.database.type}\n**Authentication:** ${backend.authentication.method}`,
              timestamp: new Date(msg.backendResponse.timestamp),
              type: 'backend',
              data: backend
            });
          }
          
          // Documentation response
          if (msg.documentationResponse) {
            const docs = msg.documentationResponse.content;
            formattedMessages.push({
              id: `${msg._id}-docs`,
              sender: 'agent',
              username: 'AI Generator',
              content: `📚 Documentation generated!\n\n**README:** ${docs.readme.title}\n**Setup Guide:** ${docs.setup_guide.prerequisites.length} prerequisites\n**Code Documentation:** ${docs.code_documentation.length} file(s)`,
              timestamp: new Date(msg.documentationResponse.timestamp),
              type: 'documentation',
              data: docs
            });
          }
          
          // Error status
          if (msg.status === 'error') {
            formattedMessages.push({
              id: `${msg._id}-error`,
              sender: 'agent',
              username: 'AI Generator',
              content: '❌ An error occurred while processing this request',
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
          currentStatus: data.message 
        }));
        // Don't show status messages as chat messages anymore
        break;

      case 'frontend_stream':
      case 'backend_stream':
      case 'documentation_stream':
        // Ignore streaming chunks - we'll only show the final result
        break;

      case 'frontend_complete':
        // Remove any streaming message if exists
        if (currentStreamingMessageRef.current) {
          removeMessage(currentStreamingMessageRef.current);
          currentStreamingMessageRef.current = null;
        }
        
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `🎨 Frontend code generated!\n\n**Components:** ${data.content.components.length} component(s)\n**Framework:** ${data.content.styling.framework}\n**State Management:** ${data.content.state_management.approach}`,
          type: 'frontend',
          data: data.content
        });
        break;

      case 'backend_complete':
        if (currentStreamingMessageRef.current) {
          removeMessage(currentStreamingMessageRef.current);
          currentStreamingMessageRef.current = null;
        }
        
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `⚙️ Backend code generated!\n\n**API Endpoints:** ${data.content.api_endpoints.length} endpoint(s)\n**Database:** ${data.content.database.type}\n**Authentication:** ${data.content.authentication.method}`,
          type: 'backend',
          data: data.content
        });
        break;

      case 'analysis_complete':
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `✅ Project analysis completed!\n\n**Project:** ${data.content.project.name}\n**Description:** ${data.content.project.description}\n**Features:** ${data.content.features.join(', ')}`,
          type: 'analysis',
          data: data.content
        });
        break;

      case 'documentation_complete':
        if (currentStreamingMessageRef.current) {
          removeMessage(currentStreamingMessageRef.current);
          currentStreamingMessageRef.current = null;
        }
        
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `📚 Documentation generated!\n\n**README:** ${data.content.readme.title}\n**Setup Guide:** ${data.content.setup_guide.prerequisites.length} prerequisites\n**Code Documentation:** ${data.content.code_documentation.length} file(s)`,
          type: 'documentation',
          data: data.content
        });
        break;

      case 'all_complete':
        currentStreamingMessageRef.current = null;
        setWsState(prev => ({ 
          ...prev, 
          isGenerating: false, 
          currentStatus: '' 
        }));
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `🎉 **Project generation completed successfully!**\n\nYour full-stack project is ready with:\n• Project analysis\n• Frontend code (React)\n• Backend code (Node.js)\n• Complete documentation`,
          type: 'text'
        });
        break;

      case 'error':
        currentStreamingMessageRef.current = null;
        setWsState(prev => ({ 
          ...prev, 
          isGenerating: false, 
          currentStatus: '',
          error: data.message 
        }));
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `❌ Error: ${data.message}`,
          type: 'error'
        });
        break;
    }
  }, [addMessage, updateMessage, removeMessage]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket('ws://localhost:8080');
      
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
          currentStatus: ''
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

  const sendMessage = useCallback((message: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setWsState(prev => ({ ...prev, error: 'Not connected to server' }));
      return;
    }

    if (!projectId) {
      setWsState(prev => ({ ...prev, error: 'No project selected' }));
      return;
    }

    addMessage({
      sender: 'user',
      username: 'You',
      content: message,
      type: 'text'
    });

    ws.current.send(JSON.stringify({
      message,
      projectId
    }));
    
    setWsState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      currentStatus: 'Processing your request...',
      error: null 
    }));
  }, [addMessage, projectId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      ws.current?.close();
    };
  }, [connect]);

  return {
    messages,
    isLoading,
    wsState,
    sendMessage,
    connect,
    addMessage,
    updateMessage
  };
};