import React, { useState, useEffect, useRef } from 'react';
import { Send, User, ChevronLeft, Check, CheckCheck, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { ledgerService } from '../../lib/services/ledgerService';
import { formatNaira } from '../../lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isRead?: boolean;
}

const PRESET_COMMANDS = [
  { label: 'Log 2x Ankara sales (30k)', text: 'Sold 2x Ankara fabrics for 30000' },
  { label: 'Query weekly profit', text: 'What is my profit this week?' },
  { label: 'Log generator fuel (12k)', text: 'Paid Oando fuel station 12000 for generator fuel' },
  { label: 'Check trust score', text: 'What is my trust score?' }
];

function getFormattedTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function WhatsAppBotPage() {
  const [businessId] = useState<string>(() => {
    const str = localStorage.getItem('coda_businesses');
    const phone = localStorage.getItem('coda_session_phone');
    if (str && phone) {
      const businesses = JSON.parse(str);
      const b = businesses.find((b: any) => b.ownerPhone === phone);
      return b ? b.id : '';
    }
    return '';
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const str = localStorage.getItem('coda_businesses');
    const phone = localStorage.getItem('coda_session_phone');
    if (str && phone) {
      const businesses = JSON.parse(str);
      const b = businesses.find((b: any) => b.ownerPhone === phone);
      if (b) {
        const cache = localStorage.getItem(`kudi_chat_history_${b.id}`);
        if (cache) {
          try {
            return JSON.parse(cache);
          } catch (e) {
            console.error('Failed to parse cached chat history', e);
          }
        }
      }
    }
    return [];
  });

  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize bot greeting and load from cache if empty
  useEffect(() => {
    if (businessId && messages.length === 0) {
      const initialMsgs: ChatMessage[] = [
        {
          id: 'init-1',
          sender: 'bot',
          text: `Welcome to Kudi Assistant! 👋\n\nI am your automated financial companion. You can log sales, submit expenses, or query your credit health by sending me natural messages here.`,
          timestamp: getFormattedTime()
        },
        {
          id: 'init-2',
          sender: 'bot',
          text: `Try typing one of the commands below or click the quick-tap buttons to see it in action:`,
          timestamp: getFormattedTime()
        }
      ];
      setMessages(initialMsgs);
      localStorage.setItem(`kudi_chat_history_${businessId}`, JSON.stringify(initialMsgs));
    }
  }, [businessId, messages.length]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (businessId && messages.length > 0) {
      localStorage.setItem(`kudi_chat_history_${businessId}`, JSON.stringify(messages));
    }
  }, [messages, businessId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !businessId) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: getFormattedTime(),
      isRead: true
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsBotTyping(true);

    // Simulate bot parsing after 1.5 seconds
    setTimeout(async () => {
      const reply = await parseWhatsAppCommand(textToSend, businessId);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: getFormattedTime()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsBotTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-136px)] md:h-screen max-w-md mx-auto border-x border-gray-200 bg-[#E5DDD5] relative font-sans shadow-lg overflow-hidden">
      {/* WhatsApp Header */}
      <header className="bg-[#075E54] text-white p-3.5 flex items-center gap-3 shrink-0 select-none">
        <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-base border border-emerald-500 shadow-inner">
          KD
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm tracking-wide">Kudi Assistant</div>
          <div className="text-[10px] text-emerald-100 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full inline-block animate-pulse"></span>
            Online
          </div>
        </div>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-32">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-lg p-2.5 shadow-sm text-[13px] leading-relaxed relative whitespace-pre-line
                  ${isUser 
                    ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none'
                  }
                `}
              >
                {msg.text}
                
                <div className="flex items-center justify-end gap-1 text-[9px] text-gray-400 mt-1 select-none">
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                </div>
              </div>
            </div>
          );
        })}

        {isBotTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-3 shadow-sm text-xs text-gray-500 rounded-tl-none flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#075E54]" />
              <span>Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Toolbar with Preset Command Quick-buttons */}
      <div className="absolute bottom-16 left-0 right-0 p-2 flex flex-wrap gap-1.5 bg-[#F0F0F0]/90 backdrop-blur-sm border-t border-gray-200/50 justify-center">
        {PRESET_COMMANDS.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(cmd.text)}
            className="text-[11px] font-semibold bg-white border border-gray-300 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-full cursor-pointer transition-all shadow-sm max-w-[210px] truncate"
            title={cmd.text}
          >
            {cmd.label}
          </button>
        ))}
      </div>

      {/* Footer Text Input Bar */}
      <footer className="bg-[#F0F0F0] p-2.5 border-t border-gray-200 flex items-center gap-2 shrink-0 z-10">
        <input
          type="text"
          placeholder="Type message command..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage(inputText);
          }}
          className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#075E54] shadow-inner"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          className="w-9 h-9 rounded-full bg-[#075E54] text-white flex items-center justify-center hover:bg-[#054c44] active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </footer>
    </div>
  );
}

// Custom parser to map text commands directly to ledger actions
async function parseWhatsAppCommand(msg: string, bId: string): Promise<string> {
  const norm = msg.toLowerCase().trim();

  // Match sale patterns (e.g. "Sold 2x Ankara fabrics for 30000", "sold bags of rice for 20000")
  if (norm.startsWith('sold ') || norm.includes('for ')) {
    // Attempt amount extraction
    const match = norm.match(/\b\d{4,7}\b/); // Matches 4 to 7 digit numbers
    if (match) {
      const amount = parseFloat(match[0]);
      // Extract descriptions if any
      const descMatch = msg.match(/sold\s+(.*?)\s+for/i);
      const desc = descMatch ? descMatch[1] : 'Sales via WhatsApp';
      
      try {
        await ledgerService.addEntry({
          businessId: bId,
          type: 'revenue',
          amount,
          source: 'sale',
          metadata: { description: `WhatsApp: ${desc}` }
        });
        
        return `✅ Transaction Logged Successfully!\n\nRevenue: +${formatNaira(amount)}\nNote: ${desc}\n\nYour Kudi credit score has improved (+5 points)! 🚀`;
      } catch (err) {
        return `❌ Error saving transaction. Please try again.`;
      }
    }
  }

  // Match expense patterns (e.g. "Paid 12000 for fuel", "paid supplier 50000")
  if (norm.startsWith('paid ') || norm.startsWith('expense ') || norm.includes('bought ')) {
    const match = norm.match(/\b\d{4,7}\b/);
    if (match) {
      const amount = parseFloat(match[0]);
      const desc = msg.replace(/\b\d{4,7}\b/g, '').replace(/(paid|bought|expense)/gi, '').trim() || 'Business Expense';
      
      try {
        await ledgerService.addEntry({
          businessId: bId,
          type: 'expense',
          amount,
          source: 'receipt_ocr',
          metadata: { vendor: 'WhatsApp Log', description: desc, category: 'Operations' }
        });
        
        return `✅ Expense Logged successfully!\n\nAmount: -${formatNaira(amount)}\nNote: ${desc}\n\nLogged in Operations Ledger (+10 points).`;
      } catch (err) {
        return `❌ Error saving transaction.`;
      }
    }
  }

  // Match profit query
  if (norm.includes('profit') || norm.includes('how much') || norm.includes('revenue')) {
    try {
      const stats = await ledgerService.getStats(bId);
      return `📊 Weekly Profit Report:\n\n• Revenue: ${formatNaira(stats.revenue)}\n• Expenses: ${formatNaira(stats.expenses)}\n\n📈 Net Profit: ${formatNaira(stats.profit)}`;
    } catch (err) {
      return `❌ Error loading stats.`;
    }
  }

  // Match trust score query
  if (norm.includes('score') || norm.includes('trust') || norm.includes('readiness')) {
    const pts = localStorage.getItem(`aza_trust_points_${bId}`) || "350";
    return `⭐️ Credit Score Status:\n\n• Trust Rating: 640 / 1000\n• Capital Readiness: ${pts} / 500 points\n\nQualifies for Tier 1 & 2 business lending! Type "apply loan" to view funding.`;
  }

  // Fallback / instructions
  return `ℹ️ Kudi Assistant commands list:\n\n1. *"Sold [item] for [amount]"* — Log revenue\n2. *"Paid [recipient] [amount] for [reason]"* — Log expenses\n3. *"What is my profit this week?"* — Review balance sheet\n4. *"What is my trust score?"* — Check credit eligibility`;
}
