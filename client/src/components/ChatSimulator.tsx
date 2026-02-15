import { useState } from 'react';
import { Send, FileText } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: string;
  type: 'incoming' | 'outgoing';
}

interface ChatSimulatorProps {
  onExtract: (messages: { sender: string; text: string }[]) => void;
  // Key change: Accepts status string instead of boolean
  extractionStatus: string | null;
}

// Parsed from your demo_chat_hinglish.txt
const DEMO_CHAT: Message[] = [
  { id: 1, sender: 'Rajesh Kumar', text: 'Bhaiya suno', type: 'incoming' },
  { id: 2, sender: 'Rajesh Kumar', text: 'Wo jo last time yellow wala kurti bheja tha na', type: 'incoming' },
  { id: 3, sender: 'Rajesh Kumar', text: 'Waise hi 10 piece chahiye', type: 'incoming' },
  { id: 4, sender: 'You', text: 'Yellow cotton kurti?', type: 'outgoing' },
  { id: 5, sender: 'Rajesh Kumar', text: 'Haan wohi', type: 'incoming' },
  { id: 6, sender: 'Rajesh Kumar', text: 'Aur bhi sarees bhi dikhao kuch', type: 'incoming' },
  { id: 7, sender: 'You', text: 'Saree ka photo send kar rahi hoon', type: 'outgoing' },
  { id: 8, sender: 'Rajesh Kumar', text: 'Isme se red wala 5 piece', type: 'incoming' },
  { id: 9, sender: 'Rajesh Kumar', text: 'Green wala 3 piece', type: 'incoming' },
  { id: 10, sender: 'You', text: 'Ok total 10 kurti + 8 saree', type: 'outgoing' },
  { id: 11, sender: 'Rajesh Kumar', text: 'Haan sahi hai. Rate kya hai?', type: 'incoming' },
  { id: 12, sender: 'You', text: 'Kurti 550 each. Saree 1200 each', type: 'outgoing' },
  { id: 13, sender: 'Rajesh Kumar', text: 'Thoda kam karo na bhaiya. Regular customer hoon', type: 'incoming' },
  { id: 14, sender: 'You', text: 'Acha ok. Kurti 525. Saree 1150', type: 'outgoing' },
  { id: 15, sender: 'Rajesh Kumar', text: 'Done confirm karo. Delivery Friday tak chahiye', type: 'incoming' },
];

export function ChatSimulator({ onExtract, extractionStatus }: ChatSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Helper to determine if we are currently busy
  const isExtracting = extractionStatus !== null;

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages([
        ...messages, 
        { id: Date.now(), text: inputValue, sender: 'Rajesh Kumar', type: 'incoming' }
      ]);
      setInputValue('');
    }
  };

  const loadDemo = () => {
    setMessages(DEMO_CHAT);
  };

  return (
    <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-4 w-full max-w-[450px] flex flex-col h-[700px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">WhatsApp Simulator</h2>
        <button 
          onClick={loadDemo}
          className="text-xs flex items-center gap-1 text-[#00a884] font-medium hover:underline"
        >
          <FileText className="w-3 h-3" /> Load Demo Chat
        </button>
      </div>
      
      {/* Chat messages area */}
      <div className="bg-[#efeae2] rounded-lg p-4 flex-1 overflow-y-auto space-y-2.5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
            <p>No messages yet.</p>
            <p className="text-sm">Click "Load Demo Chat" to test</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-lg shadow-sm relative ${
                message.type === 'outgoing'
                  ? 'bg-[#dcf8c6] text-gray-900 rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-xs font-bold text-gray-500 mb-0.5">{message.sender}</p>
              <p className="text-sm leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] text-sm"
        />
        <button
          onClick={handleSend}
          className="px-4 py-3 bg-[#00a884] hover:bg-[#008069] text-white rounded-lg transition-colors shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Extract Order CTA */}
      <button
        onClick={() => onExtract(messages.map(m => ({ sender: m.sender, text: m.text })))}
        disabled={messages.length === 0 || isExtracting}
        className={`w-full mt-4 py-4 font-semibold rounded-lg shadow-[0_2px_8px_rgba(0,168,132,0.3)] transition-all flex justify-center items-center gap-2 ${
          messages.length === 0 || isExtracting
            ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
            : 'bg-gradient-to-r from-[#00a884] to-[#008069] hover:from-[#008069] hover:to-[#00a884] text-white hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        {isExtracting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="animate-pulse">{extractionStatus}</span>
          </>
        ) : (
          'Extract Order with Claude'
        )}
      </button>
    </div>
  );
}