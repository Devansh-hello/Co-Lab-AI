import React, { useState } from 'react';
import { CodeBlock } from './CodeBlock';

interface Component {
  name: string;
  code: string;
  description: string;
  dependencies: string[];
}

interface ComponentDisplayProps {
  components: Component[];
}

export const ComponentDisplay: React.FC<ComponentDisplayProps> = ({ components }) => {
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const toggleComponent = (componentName: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentName)) {
      newExpanded.delete(componentName);
    } else {
      newExpanded.add(componentName);
    }
    setExpandedComponents(newExpanded);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-800 mb-2">Generated Components:</h4>
      {components.map((component) => (
        <div key={component.name} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleComponent(component.name)}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left flex items-center justify-between transition-colors"
          >
            <div>
              <span className="font-medium text-gray-800">{component.name}</span>
              <p className="text-sm text-gray-600 mt-1">{component.description}</p>
            </div>
            <span className="text-gray-500">
              {expandedComponents.has(component.name) ? '−' : '+'}
            </span>
          </button>
          
          {expandedComponents.has(component.name) && (
            <div className="p-4 bg-white">
              <div className="mb-3">
                <span className="text-sm text-gray-600">Dependencies: </span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {component.dependencies.join(', ')}
                </span>
              </div>
              <CodeBlock 
                code={component.code} 
                filename={`${component.name}.jsx`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
