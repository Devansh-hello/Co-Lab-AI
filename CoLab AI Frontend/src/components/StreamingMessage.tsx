import React, { useState, useEffect } from 'react';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
  onStreamComplete?: () => void;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ 
  content, 
  isStreaming,
  onStreamComplete 
}) => {
  const [displayContent, setDisplayContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isStreaming && currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayContent(prev => prev + content[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 10); // Adjust typing speed here

      return () => clearTimeout(timer);
    } else if (!isStreaming && content !== displayContent) {
      // If not streaming, show full content immediately
      setDisplayContent(content);
      setCurrentIndex(content.length);
    } else if (currentIndex >= content.length && isStreaming) {
      onStreamComplete?.();
    }
  }, [content, isStreaming, currentIndex, displayContent, onStreamComplete]);

  return (
    <div className="font-mono text-sm">
      {displayContent}
      {isStreaming && currentIndex < content.length && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
};