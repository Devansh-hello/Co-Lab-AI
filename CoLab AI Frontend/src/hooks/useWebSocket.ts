import { useState, useRef, useCallback, useEffect } from 'react';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  username: string;
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'frontend' | 'backend' | 'documentation' | 'status' | 'error';
  data?: any;
}
export interface WebSocketState {
  isConnected: boolean;
  isGenerating: boolean;
  currentStatus: string;
  error: string | null;
}
export const useWebSocket = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [wsState, setWsState] = useState<WebSocketState>({
    isConnected: false,
    isGenerating: false,
    currentStatus: '',
    error: null
  });
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const currentStreamingMessageRef = useRef<string | null>(null);

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

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'status':
        setWsState(prev => ({ 
          ...prev, 
          isGenerating: true, 
          currentStatus: data.message 
        }));
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `🔄 ${data.message}`,
          type: 'status'
        });
        break;

      case 'frontend_stream':
        if (!currentStreamingMessageRef.current) {
          // Start new streaming message
          const messageId = addMessage({
            sender: 'agent',
            username: 'AI Generator',
            content: data.content,
            type: 'text'
          });
          currentStreamingMessageRef.current = messageId;
        } else {
          // Update existing streaming message
          updateMessage(currentStreamingMessageRef.current, {
            content: data.accumulated
          });
        }
        break;

      case 'frontend_complete':
        currentStreamingMessageRef.current = null;
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `🎨 Frontend code generated!\n\n**Components:** ${data.content.components.length} component(s)\n**Framework:** ${data.content.styling.framework}\n**State Management:** ${data.content.state_management.approach}`,
          type: 'frontend',
          data: data.content
        });
        break;

      case 'backend_stream':
        if (!currentStreamingMessageRef.current) {
          const messageId = addMessage({
            sender: 'agent',
            username: 'AI Generator',
            content: data.content,
            type: 'text'
          });
          currentStreamingMessageRef.current = messageId;
        } else {
          updateMessage(currentStreamingMessageRef.current, {
            content: data.accumulated
          });
        }
        break;

      case 'backend_complete':
        currentStreamingMessageRef.current = null;
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
          currentStatus: 'Complete!' 
        }));
        addMessage({
          sender: 'agent',
          username: 'AI Generator',
          content: `🎉 Project generation completed successfully!\n\nYour full-stack project is ready with:\n• Project analysis\n• Frontend code (React)\n• Backend code (Node.js)\n• Complete documentation`,
          type: 'text',
          data: data.summary
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
  }, [addMessage, updateMessage]);

  // ... rest of the hook code remains the same

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

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [handleWebSocketMessage]);

  const sendMessage = useCallback((message: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setWsState(prev => ({ ...prev, error: 'Not connected to server' }));
      return;
    }

    addMessage({
      sender: 'user',
      username: 'DevZero',
      content: message,
      type: 'text'
    });

    ws.current.send(message);
    
    setWsState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      currentStatus: 'Processing your request...',
      error: null 
    }));
  }, [addMessage]);

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
    wsState,
    sendMessage,
    connect,
    addMessage,
    updateMessage
  };
};