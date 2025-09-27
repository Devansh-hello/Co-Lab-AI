import React, { useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { ComponentDisplay } from './ComponentDisplay';
import { StreamingMessage } from './StreamingMessage';

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  username: string;
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'frontend' | 'backend' | 'documentation' | 'status' | 'error';
  data?: any;
}
interface MessageCardProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, isStreaming = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className={line.startsWith('**') ? 'font-semibold' : ''}>
        {line.replace(/\*\*(.*?)\*\*/g, '$1')}
      </div>
    ));
  };

  const renderMessageContent = () => {
    if (isStreaming && message.type === 'text') {
      return <StreamingMessage content={message.content} isStreaming={true} />;
    }

    if (message.type === 'frontend' && message.data?.components) {
      return (
        <div>
          <div className="mb-3">{formatContent(message.content)}</div>
          <ComponentDisplay components={message.data.components} />
          
          {message.data.styling?.custom_css && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">CSS Styles:</h4>
              <CodeBlock 
                code={message.data.styling.custom_css} 
                language="css"
                filename="styles.css"
              />
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'backend' && message.data?.api_endpoints) {
      return (
        <div>
          <div className="mb-3">{formatContent(message.content)}</div>
          
          <div className="space-y-3">
            <h4 className="font-semibold">API Endpoints:</h4>
            {message.data.api_endpoints.map((endpoint: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded font-mono ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <span className="font-mono text-sm">{endpoint.path}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                <CodeBlock code={endpoint.code} filename={`${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-zA-Z0-9]/g, '-')}.js`} />
              </div>
            ))}
          </div>

          {message.data.server_setup && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Server Setup:</h4>
              <CodeBlock code={message.data.server_setup} filename="server.js" />
            </div>
          )}
        </div>
      );
    }

    return <div className="whitespace-pre-wrap">{formatContent(message.content)}</div>;
  };

  const hasRawData = message.data && (
    message.type === 'analysis' || 
    message.type === 'documentation'
  );

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`max-w-4xl px-4 py-3 rounded-lg ${
        message.sender === 'user' 
          ? 'bg-blue-600 text-white' 
          : message.type === 'error'
          ? 'bg-red-100 text-red-800 border border-red-300'
          : message.type === 'status'
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
          : 'bg-white text-gray-800 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">{message.username}</span>
          <span className="text-xs opacity-60">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        
        {renderMessageContent()}

        {hasRawData && (
          <div className="mt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              {showDetails ? 'Hide Raw Data' : 'Show Raw Data'}
            </button>
            
            {showDetails && (
              <div className="mt-2">
                <CodeBlock code={JSON.stringify(message.data, null, 2)} language="json" filename="raw-data.json" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
