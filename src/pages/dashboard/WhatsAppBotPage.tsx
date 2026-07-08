import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCheck, Loader2 } from 'lucide-react';
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
          text: `WELCOME TO KUDI ASSISTANT! 👋\n\nI am your automated financial companion. You can log sales, submit expenses, or query your credit health by sending me natural messages here.`,
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
    <div className="flex flex-col h-[calc(100vh-136px)] md:h-[calc(100vh-64px)] max-w-md mx-auto border-[4px] border-black bg-[#FDFBF7] relative font-sans shadow-[8px_8px_0px_rgba(0,0,0,1)] my-4">
      {/* Header */}
      <header className="bg-[#4D9DE0] border-b-[4px] border-black text-white p-4 flex items-center gap-4 shrink-0 select-none shadow-[0px_4px_0px_rgba(0,0,0,1)] z-20">
        <div className="w-12 h-12 bg-black text-[#E0FF4F] flex items-center justify-center font-black text-xl border-[3px] border-black shadow-[2px_2px_0px_rgba(224,255,79,1)]">
          KD
        </div>
        <div className="flex-1">
          <div className="font-black text-lg uppercase tracking-widest text-black">KUDI ASSISTANT</div>
          <div className="text-xs font-bold text-black uppercase flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 bg-[#E0FF4F] border-[2px] border-black rounded-full inline-block animate-pulse shadow-[1px_1px_0px_rgba(0,0,0,1)]"></span>
            Online
          </div>
        </div>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZmZmZiIvPgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIgZmlsbD0iI2YwZjBmMCIvPgo8L3N2Zz4=')] relative">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] border-[3px] border-black p-3 text-sm font-bold uppercase leading-relaxed relative whitespace-pre-line shadow-[4px_4px_0px_rgba(0,0,0,1)]
                  ${isUser 
                    ? 'bg-[#E0FF4F] text-black rounded-xl rounded-tr-none' 
                    : 'bg-white text-black rounded-xl rounded-tl-none'
                  }
                `}
              >
                {msg.text}
                
                <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-600 mt-2 select-none border-t-[2px] border-black/10 pt-1">
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-4 h-4 text-black" strokeWidth={3} />}
                </div>
              </div>
            </div>
          );
        })}

        {isBotTyping && (
          <div className="flex justify-start">
            <div className="bg-white border-[3px] border-black rounded-xl rounded-tl-none p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] text-xs font-black uppercase text-black flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />
              <span>TYPING...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Toolbar with Preset Command Quick-buttons */}
      <div className="absolute bottom-20 left-0 right-0 p-3 flex flex-wrap gap-2 bg-white/90 backdrop-blur-sm justify-center z-10 border-t-[4px] border-black">
        {PRESET_COMMANDS.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(cmd.text)}
            className="text-[10px] font-black uppercase bg-[#FDFBF7] border-[2px] border-black text-black px-3 py-2 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-[#E0FF4F] active:translate-y-0.5 active:shadow-none transition-all max-w-[210px] truncate"
            title={cmd.text}
          >
            {cmd.label}
          </button>
        ))}
      </div>

      {/* Footer Text Input Bar */}
      <footer className="bg-white p-3 border-t-[4px] border-black flex items-center gap-3 shrink-0 z-20 shadow-[0px_-4px_0px_rgba(0,0,0,1)]">
        <input
          type="text"
          placeholder="TYPE COMMAND..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage(inputText);
          }}
          className="flex-1 bg-[#FDFBF7] border-[3px] border-black px-4 py-3 text-sm font-black uppercase placeholder-gray-500 focus:outline-none focus:bg-[#E0FF4F] transition-colors shadow-inner"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          className="w-12 h-12 bg-black text-[#E0FF4F] border-[3px] border-black flex items-center justify-center hover:bg-[#E0FF4F] hover:text-black active:translate-y-1 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0"
        >
          <Send className="w-5 h-5 -ml-1" strokeWidth={2.5} />
        </button>
      </footer>
    </div>
  );
}

// Custom parser to map text commands directly to ledger actions
async function parseWhatsAppCommand(msg: string, bId: string): Promise<string> {
  const norm = msg.toLowerCase().trim();

  // Match sale patterns
  if (norm.startsWith('sold ') || norm.includes('for ')) {
    const match = norm.match(/\b\d{4,7}\b/);
    if (match) {
      const amount = parseFloat(match[0]);
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
        
        return `✅ TRANSACTION LOGGED!\n\nREVENUE: +${formatNaira(amount)}\nNOTE: ${desc}\n\nYOUR SCORE IMPROVED (+5 PTS)! 🚀`;
      } catch (err) {
        return `❌ ERROR SAVING TRANSACTION. PLEASE TRY AGAIN.`;
      }
    }
  }

  // Match expense patterns
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
        
        return `✅ EXPENSE LOGGED!\n\nAMOUNT: -${formatNaira(amount)}\nNOTE: ${desc}\n\nLOGGED IN OPERATIONS (+10 PTS).`;
      } catch (err) {
        return `❌ ERROR SAVING TRANSACTION.`;
      }
    }
  }

  // Match profit query
  if (norm.includes('profit') || norm.includes('how much') || norm.includes('revenue')) {
    try {
      const stats = await ledgerService.getStats(bId);
      return `📊 WEEKLY REPORT:\n\n• REVENUE: ${formatNaira(stats.revenue)}\n• EXPENSES: ${formatNaira(stats.expenses)}\n\n📈 NET PROFIT: ${formatNaira(stats.profit)}`;
    } catch (err) {
      return `❌ ERROR LOADING STATS.`;
    }
  }

  // Match trust score query
  if (norm.includes('score') || norm.includes('trust') || norm.includes('readiness')) {
    const pts = localStorage.getItem(`aza_trust_points_${bId}`) || "350";
    return `⭐️ CREDIT STATUS:\n\n• RATING: 640 / 1000\n• CAPITAL READINESS: ${pts} / 500 PTS\n\nQUALIFIES FOR TIER 1 & 2 LOANS! TYPE "APPLY LOAN" TO VIEW FUNDING.`;
  }

  // Fallback / instructions
  return `ℹ️ KUDI ASSISTANT COMMANDS:\n\n1. *"SOLD [ITEM] FOR [AMOUNT]"*\n2. *"PAID [RECIPIENT] [AMOUNT] FOR [REASON]"*\n3. *"WHAT IS MY PROFIT THIS WEEK?"*\n4. *"WHAT IS MY TRUST SCORE?"*`;
}
