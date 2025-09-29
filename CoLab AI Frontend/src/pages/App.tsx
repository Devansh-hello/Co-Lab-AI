"use client"

import "../index.css"
import { useParams } from "react-router-dom"
import { Header } from "../components/header"
import { MessageBox } from "../components/messageBox"
import { MessageCard } from "../components/messageCard"
import { Sidebar } from "../components/sidebar"
import { useWebSocket } from "../hooks/useWebSocket"
import { Loader2, WifiOff, Sparkles } from "lucide-react"

function App() {
  const { projectId } = useParams<{ projectId: string }>()
  const { messages, isLoading, wsState, sendMessage } = useWebSocket(projectId!)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DDD4]">
        <div className="text-center bg-white/50 backdrop-blur-sm rounded-xl border border-[#CFAB8D]/30 p-8 shadow-lg">
          <Loader2 className="animate-spin h-12 w-12 text-[#8B6F47] mx-auto mb-4" />
          <p className="text-[#8B6F47] font-medium">Loading chat history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-row p-6 gap-3.5 justify-center align-middle h-screen w-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DDD4] overflow-hidden">
      <Sidebar />

      <div className="flex flex-col p-3 gap-3.5 h-full w-full overflow-hidden">
        <Header />

        {/* Connection Status */}
        {!wsState.isConnected && (
          <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-center text-sm flex-shrink-0 flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>{wsState.error || "Connecting to AI service..."}</span>
          </div>
        )}

        {/* Messages Container - Fixed scrolling */}
        <div className="flex flex-col overflow-y-auto overflow-x-hidden gap-3 flex-1 px-2">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[#8B6F47] text-center w-full">
              <div className="flex flex-col items-center justify-center max-w-2xl bg-white/30 backdrop-blur-sm rounded-xl border border-[#CFAB8D]/30 p-12 shadow-sm">
                <div className="bg-[#CFAB8D]/20 rounded-full p-4 mb-6">
                  <Sparkles className="w-8 h-8 text-[#8B6F47]" />
                </div>
                <h3 className="text-2xl font-bold text-[#8B6F47] mb-3">AI Project Generator</h3>
                <p className="text-base text-[#8B6F47]/80 mb-4">
                  Describe your project idea and I'll generate complete code, documentation, and deployment guides!
                </p>
                <p className="text-sm text-[#8B6F47]/60 bg-[#CFAB8D]/10 px-4 py-2 rounded-lg">
                  Example: "Create a todo app with user authentication"
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}

              {/* Generation Status Indicator */}
              {wsState.isGenerating && wsState.currentStatus && (
                <div className="w-full flex justify-start">
                  <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-lg px-4 py-3 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800 font-medium">{wsState.currentStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Message Input - Fixed at bottom */}
        <div className="flex mt-auto justify-center flex-shrink-0">
          <MessageBox
            onSendMessage={sendMessage}
            isGenerating={wsState.isGenerating}
            currentStatus={wsState.currentStatus}
          />
        </div>
      </div>
    </div>
  )
}

export default App
