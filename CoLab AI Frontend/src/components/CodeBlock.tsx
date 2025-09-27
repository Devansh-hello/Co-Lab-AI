import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript', filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden my-2">
      {filename && (
        <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
          {filename}
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <pre className="p-4 text-sm text-green-400 overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

