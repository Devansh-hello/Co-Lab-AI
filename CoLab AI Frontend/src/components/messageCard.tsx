"use client"

import type React from "react"
import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  User,
  Bot,
  Search,
  Palette,
  Settings,
  BookOpen,
  AlertCircle,
  Loader2,
  Folder,
  Server,
} from "lucide-react"
import type { Message } from "../hooks/useWebSocket"

// Code syntax highlighting helper
const SyntaxHighlighter: React.FC<{ code: string; language?: string; filename?: string }> = ({
  code,
  language = "javascript",
  filename,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden my-3 shadow-lg border border-gray-700">
      {filename && (
        <div className="bg-[#CFAB8D]/10 backdrop-blur-sm px-4 py-2 text-sm text-gray-300 border-b border-gray-700 flex justify-between items-center">
          <span className="font-mono font-medium">{filename}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{language}</span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1.5 text-xs bg-[#CFAB8D]/20 hover:bg-[#CFAB8D]/30 text-white rounded-md transition-all duration-200 backdrop-blur-sm border border-gray-600 flex items-center gap-1.5 font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
        <pre className="p-4 text-sm overflow-x-auto leading-relaxed">
          <code className="font-mono text-gray-100">{code}</code>
        </pre>
      </div>
    </div>
  )
}

// Format analysis data nicely
const AnalysisDisplay: React.FC<{ data: any }> = ({ data }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-purple-700" />
          <h4 className="font-semibold text-purple-900">Project Overview</h4>
        </div>
        <p className="text-sm text-gray-700 mb-2">
          <strong>Name:</strong> {data.project.name}
        </p>
        <p className="text-sm text-gray-700">
          <strong>Description:</strong> {data.project.description}
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-4 backdrop-blur-sm">
        <button
          onClick={() => toggleSection("features")}
          className="w-full flex justify-between items-center font-semibold text-blue-900 hover:text-blue-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <span>Features ({data.features.length})</span>
          </div>
          {expanded.features ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {expanded.features && (
          <ul className="mt-3 space-y-2">
            {data.features.map((feature: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-lg p-4 backdrop-blur-sm">
        <button
          onClick={() => toggleSection("structure")}
          className="w-full flex justify-between items-center font-semibold text-green-900 hover:text-green-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            <span>Architecture</span>
          </div>
          {expanded.structure ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {expanded.structure && (
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <p>
              <strong>Type:</strong> {data.overall_structure.architecture}
            </p>
            <p>
              <strong>Files:</strong> {data.overall_structure.file_structure.root.join(", ")}
            </p>
            <p>
              <strong>User Flow:</strong> {data.overall_structure.user_flow}
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg p-4 backdrop-blur-sm">
        <button
          onClick={() => toggleSection("tech")}
          className="w-full flex justify-between items-center font-semibold text-orange-900 hover:text-orange-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span>Technologies</span>
          </div>
          {expanded.tech ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {expanded.tech && (
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <p>
              <strong>Frontend:</strong> {data.frontend.technologies.join(", ")}
            </p>
            <p>
              <strong>Backend Needed:</strong> {data.backend.needed ? "Yes" : "No"}
            </p>
            {data.backend.needed && (
              <p>
                <strong>Backend:</strong> {data.backend.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Format frontend data nicely
const FrontendDisplay: React.FC<{ data: any }> = ({ data }) => {
  const [selectedComponent, setSelectedComponent] = useState<number>(0)

  return (
    <div className="space-y-3 mt-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">Frontend Components</h4>

        {/* Component tabs */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {data.components.map((comp: any, i: number) => (
            <button
              key={i}
              onClick={() => setSelectedComponent(i)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedComponent === i ? "bg-blue-600 text-white" : "bg-white text-blue-900 hover:bg-blue-100"
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>

        {/* Selected component details */}
        {data.components[selectedComponent] && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{data.components[selectedComponent].description}</p>
            <SyntaxHighlighter
              code={data.components[selectedComponent].code}
              language="javascript"
              filename={`${data.components[selectedComponent].name}.jsx`}
            />
            <div className="text-xs text-gray-600">
              <strong>Dependencies:</strong> {data.components[selectedComponent].dependencies.join(", ")}
            </div>
          </div>
        )}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-semibold text-indigo-900 mb-2">Styling</h4>
        <p className="text-sm text-gray-700">
          <strong>Framework:</strong> {data.styling.framework}
        </p>
        <p className="text-sm text-gray-700 mt-1">
          <strong>Approach:</strong> {data.styling.responsive_design}
        </p>
        {data.styling.custom_css && (
          <SyntaxHighlighter code={data.styling.custom_css} language="css" filename="styles.css" />
        )}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">State Management</h4>
        <p className="text-sm text-gray-700">
          <strong>Approach:</strong> {data.state_management.approach}
        </p>
        <p className="text-sm text-gray-700 mt-1">{data.state_management.implementation}</p>
      </div>
    </div>
  )
}

// Format backend data nicely
const BackendDisplay: React.FC<{ data: any }> = ({ data }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<number>(0)

  return (
    <div className="space-y-3 mt-3">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">API Endpoints</h4>

        {/* Endpoint tabs */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {data.api_endpoints.map((endpoint: any, i: number) => (
            <button
              key={i}
              onClick={() => setSelectedEndpoint(i)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedEndpoint === i ? "bg-green-600 text-white" : "bg-white text-green-900 hover:bg-green-100"
              }`}
            >
              {endpoint.method} {endpoint.path}
            </button>
          ))}
        </div>

        {/* Selected endpoint details */}
        {data.api_endpoints[selectedEndpoint] && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{data.api_endpoints[selectedEndpoint].description}</p>
            <SyntaxHighlighter
              code={data.api_endpoints[selectedEndpoint].code}
              language="javascript"
              filename={`${data.api_endpoints[selectedEndpoint].method.toLowerCase()}-endpoint.js`}
            />
          </div>
        )}
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h4 className="font-semibold text-teal-900 mb-2">Database</h4>
        <p className="text-sm text-gray-700">
          <strong>Type:</strong> {data.database.type}
        </p>
        <p className="text-sm text-gray-700 mt-1">
          <strong>Schema:</strong> {data.database.schema}
        </p>
        <SyntaxHighlighter code={data.database.connection_code} language="javascript" filename="db-connection.js" />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">Authentication</h4>
        <p className="text-sm text-gray-700">
          <strong>Method:</strong> {data.authentication.method}
        </p>
        <p className="text-sm text-gray-700 mt-1">{data.authentication.implementation}</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Server Setup</h4>
        <SyntaxHighlighter code={data.server_setup} language="javascript" filename="server.js" />
      </div>
    </div>
  )
}

// Format documentation data nicely
const DocumentationDisplay: React.FC<{ data: any }> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<"readme" | "setup" | "code" | "deploy">("readme")

  return (
    <div className="space-y-3 mt-3">
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "readme", label: "README", icon: "📖" },
          { key: "setup", label: "Setup", icon: "⚙️" },
          { key: "code", label: "Code Docs", icon: "💻" },
          { key: "deploy", label: "Deploy", icon: "🚀" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "readme" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-xl font-bold mb-2">{data.readme.title}</h3>
          <p className="text-gray-700 mb-3">{data.readme.description}</p>

          <h4 className="font-semibold mt-4 mb-2">Installation</h4>
          <ul className="list-disc ml-5 space-y-1">
            {data.readme.installation.map((step: string, i: number) => (
              <li key={i} className="text-sm text-gray-700">
                {step}
              </li>
            ))}
          </ul>

          <h4 className="font-semibold mt-4 mb-2">Usage</h4>
          <p className="text-sm text-gray-700">{data.readme.usage}</p>

          <h4 className="font-semibold mt-4 mb-2">API Documentation</h4>
          <p className="text-sm text-gray-700">{data.readme.api_documentation}</p>
        </div>
      )}

      {activeTab === "setup" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Prerequisites</h4>
            <ul className="list-disc ml-5 space-y-1">
              {data.setup_guide.prerequisites.map((req: string, i: number) => (
                <li key={i} className="text-sm text-gray-700">
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Environment Setup</h4>
            <ol className="list-decimal ml-5 space-y-1">
              {data.setup_guide.environment_setup.map((step: string, i: number) => (
                <li key={i} className="text-sm text-gray-700">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Configuration</h4>
            <p className="text-sm text-gray-700">{data.setup_guide.configuration}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Troubleshooting</h4>
            {data.setup_guide.troubleshooting.map((item: any, i: number) => (
              <div key={i} className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
                <p className="text-sm font-medium text-gray-900">{item.issue}</p>
                <p className="text-sm text-gray-700 mt-1">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "code" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {data.code_documentation.map((doc: any, i: number) => (
            <div key={i} className="mb-4 last:mb-0">
              <h4 className="font-semibold text-lg mb-2">{doc.file}</h4>
              <p className="text-sm text-gray-700 mb-3">{doc.description}</p>

              {doc.functions.map((fn: any, j: number) => (
                <div key={j} className="bg-gray-50 rounded p-3 mb-2">
                  <p className="font-mono text-sm font-semibold text-blue-600">{fn.name}()</p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Purpose:</strong> {fn.purpose}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Parameters:</strong> {fn.parameters}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Returns:</strong> {fn.returns}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === "deploy" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Deployment Guide</h4>
          <p className="text-sm text-gray-700 whitespace-pre-line">{data.deployment_guide}</p>
        </div>
      )}
    </div>
  )
}

// Format markdown-style text (bold, inline code, etc.)
const formatMessageText = (text: string) => {
  if (!text) return null

  // Split by lines to process each line
  const lines = text.split("\n")

  return lines.map((line, lineIndex) => {
    // Process the line for inline formatting
    const processedLine = line

    // Bold text **text**
    const boldRegex = /\*\*([^*]+)\*\*/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match

    while ((match = boldRegex.exec(processedLine)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(processedLine.substring(lastIndex, match.index))
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${lineIndex}-${match.index}`} className="font-semibold">
          {match[1]}
        </strong>,
      )
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < processedLine.length) {
      parts.push(processedLine.substring(lastIndex))
    }

    return (
      <span key={lineIndex}>
        {parts.length > 0 ? parts : processedLine}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })
}

// Main message card component
export const MessageCard: React.FC<{ message: Message }> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getMessageStyle = () => {
    const baseStyle = "rounded-lg p-4 shadow-md transition-all duration-200 backdrop-blur-sm"

    if (message.sender === "user") {
      return `${baseStyle} bg-[#CFAB8D] text-amber-900 ml-auto max-w-[70%] border border-[#C19B7A]`
    }

    switch (message.type) {
      case "error":
        return `${baseStyle} bg-red-50/90 border border-red-200 text-red-800 max-w-[90%]`
      case "status":
        return `${baseStyle} bg-[#D9C4B0]/60 border border-[#CFAB8D]/50 text-amber-800 max-w-[70%]`
      case "analysis":
        return `${baseStyle} bg-white/90 border border-purple-200 text-gray-800 max-w-[90%]`
      case "frontend":
        return `${baseStyle} bg-white/90 border border-blue-200 text-gray-800 max-w-[90%]`
      case "backend":
        return `${baseStyle} bg-white/90 border border-green-200 text-gray-800 max-w-[90%]`
      case "documentation":
        return `${baseStyle} bg-white/90 border border-indigo-200 text-gray-800 max-w-[90%]`
      default:
        return `${baseStyle} bg-white/90 border border-gray-200 text-gray-800 max-w-[85%]`
    }
  }

  const getIcon = (type?: string, sender?: string) => {
    switch (type) {
      case "analysis":
        return <Search className="w-5 h-5 text-purple-600" />
      case "frontend":
        return <Palette className="w-5 h-5 text-blue-600" />
      case "backend":
        return <Server className="w-5 h-5 text-green-600" />
      case "documentation":
        return <BookOpen className="w-5 h-5 text-indigo-600" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case "status":
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
      default:
        return sender === "user" ? (
          <User className="w-5 h-5 text-blue-600" />
        ) : (
          <Bot className="w-5 h-5 text-gray-600" />
        )
    }
  }

  return (
    <div className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} w-full`}>
      <div className={getMessageStyle()}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">{getIcon(message.type, message.sender)}</div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm">{message.username}</span>
              <span className="text-xs opacity-60">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Content - Format markdown */}
        <div className={`text-sm leading-relaxed ${message.sender === "user" ? "text-amber-900" : "text-gray-800"}`}>
          {formatMessageText(message.content)}
        </div>

        {/* Structured data display based on type */}
        {message.data && message.type === "analysis" && <AnalysisDisplay data={message.data} />}

        {message.data && message.type === "frontend" && <FrontendDisplay data={message.data} />}

        {message.data && message.type === "backend" && <BackendDisplay data={message.data} />}

        {message.data && message.type === "documentation" && <DocumentationDisplay data={message.data} />}

        {/* Raw JSON toggle for debugging/advanced users */}
        {message.data && (
          <div className="mt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-medium transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              View Raw JSON
            </button>

            {isExpanded && (
              <SyntaxHighlighter
                code={JSON.stringify(message.data, null, 2)}
                language="json"
                filename="response-data.json"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
