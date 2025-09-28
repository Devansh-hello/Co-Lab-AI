import "../index.css";
import { Header } from '../components/header';
import { MessageBox } from "../components/messageBox";
import { MessageCard } from "../components/messageCard";
import { Sidebar } from '../components/sidebar';
import { useWebSocket } from '../hooks/useWebSocket';

function App() {
  const { messages, wsState, sendMessage } = useWebSocket();

  return (
    <div className='flex flex-row grow p-6 gap-3.5 justify-center align-middle  h-screen w-screen bg-[#ECEEDF]'>
      <Sidebar />
      
      <div className='flex flex-col p-3 gap-3.5 h-full w-full'>
        <Header />
        
        
        {!wsState.isConnected && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
            {wsState.error || 'Connecting to AI service...'}
          </div>
        )}
        
       
        <div className='flex flex-col overflow-y-auto gap-3 w-auto items-end flex-1'>
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-center w-full">
              <div className="flex flex-col items-center justify-center" >
                <h3 className="text-lg font-semibold mb-2">AI Project Generator</h3>
                <p>Describe your project idea and I'll generate complete code, documentation, and deployment guides!</p>
                <p className="text-sm mt-2">Example: "Create a todo app with user authentication"</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))
          )}
        </div>
        
        {/* Message Input */}
        <div className='flex mt-auto justify-center'>
          <MessageBox
            onSendMessage={sendMessage}
            isGenerating={wsState.isGenerating}
            currentStatus={wsState.currentStatus}
          />
        </div>
      </div>
    </div>
  );
}

export default App;