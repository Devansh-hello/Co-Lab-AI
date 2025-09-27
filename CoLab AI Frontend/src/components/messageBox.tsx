import React, { useState } from 'react';

interface MessageBoxProps {
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  currentStatus: string;
}

export const MessageBox: React.FC<MessageBoxProps> = ({ 
  onSendMessage, 
  isGenerating, 
  currentStatus 
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isGenerating) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="w-full max-w-4xl items-center justify-center">
      {isGenerating && (
        <div className="mb-2 text-sm text-gray-600 text-center">
          <span className="animate-pulse">{currentStatus}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isGenerating ? "AI is working..." : "Describe your project idea..."}
          disabled={isGenerating}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isGenerating || !message.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <span className="animate-spin">⏳</span>
          ) : (
            'Send'
          )}
        </button>
      </form>
    </div>
  );
};  