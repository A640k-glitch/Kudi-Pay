import React, { useState, useEffect, useRef } from 'react';
import { PaperPlaneRight, Checks, CircleNotch } from '@phosphor-icons/react';
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
    <div className="flex flex-col h-[calc(100vh-136px)] md:h-[calc(100vh-64px)] max-w-md mx-auto bg-slate-50 border-2 border-slate-200 rounded-[24px] overflow-hidden shadow-sm relative font-sans my-4">
      {/* Header */}
      <header className="bg-slate-900 border-b-2 border-slate-900 text-white p-4 flex items-center gap-4 shrink-0 select-none z-20">
        <div className="w-12 h-12 bg-white text-slate-900 flex items-center justify-center font-display font-black text-xl rounded-full shadow-sm">
          KD
        </div>
        <div className="flex-1">
          <div className="font-display font-bold text-lg text-white">Kudi Assistant</div>
          <div className="text-xs font-medium text-slate-300 flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-[#E0FF4F] rounded-full inline-block animate-pulse"></span>
            Online
          </div>
        </div>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZmZmZiIvPgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIgZmlsbD0iI2Y4ZmFmYyIvPgo8L3N2Zz4=')] relative">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3.5 text-sm font-medium leading-relaxed relative whitespace-pre-line shadow-sm border-2 border-slate-900
                  ${isUser 
                    ? 'bg-[#E0FF4F] text-slate-900 rounded-[16px] rounded-tr-[4px]' 
                    : 'bg-white text-slate-900 rounded-[16px] rounded-tl-[4px]'
                  }
                `}
              >
                {msg.text}
                
                <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500 mt-2 select-none border-t border-slate-900/10 pt-1.5 font-bold">
                  <span>{msg.timestamp}</span>
                  {isUser && <Checks className="w-4 h-4 text-slate-900" weight="bold" />}
                </div>
              </div>
            </div>
          );
        })}

        {isBotTyping && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-slate-900 rounded-[16px] rounded-tl-[4px] p-3.5 shadow-sm text-xs font-bold text-slate-500 flex items-center gap-2">
              <CircleNotch className="w-4 h-4 animate-spin text-slate-900" weight="bold" />
              <span>Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Toolbar with Preset Command Quick-buttons */}
      <div className="absolute bottom-[72px] left-0 right-0 p-3 flex flex-wrap gap-2 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-10 justify-center z-10">
        {PRESET_COMMANDS.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(cmd.text)}
            className="text-xs font-bold bg-white border-2 border-slate-900 text-slate-700 px-3 py-2 rounded-full cursor-pointer shadow-[2px_2px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_#0f172a] hover:bg-slate-50 hover:text-slate-900 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all max-w-[210px] truncate"
            title={cmd.text}
          >
            {cmd.label}
          </button>
        ))}
      </div>

      {/* Footer Text Input Bar */}
      <footer className="bg-white p-3 border-t-2 border-slate-200 flex items-center gap-3 shrink-0 z-20 shadow-sm relative">
        <input
          type="text"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage(inputText);
          }}
          className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-[12px] px-4 py-3 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || isBotTyping}
          className="w-12 h-12 bg-slate-900 text-white rounded-[12px] flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          <PaperPlaneRight className="w-5 h-5" weight="fill" />
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
        
        return `✅ Transaction logged!\n\nRevenue: +${formatNaira(amount)}\nNote: ${desc}\n\nYour score improved (+5 PTS)! 🚀`;
      } catch (err) {
        return `❌ Error saving transaction. Please try again.`;
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
        
        return `✅ Expense logged!\n\nAmount: -${formatNaira(amount)}\nNote: ${desc}\n\nLogged in Operations (+10 PTS).`;
      } catch (err) {
        return `❌ Error saving transaction.`;
      }
    }
  }

  // Match profit query
  if (norm.includes('profit') || norm.includes('how much') || norm.includes('revenue')) {
    try {
      const stats = await ledgerService.getStats(bId);
      return `📊 Weekly Report:\n\n• Revenue: ${formatNaira(stats.revenue)}\n• Expenses: ${formatNaira(stats.expenses)}\n\n📈 Net Profit: ${formatNaira(stats.profit)}`;
    } catch (err) {
      return `❌ Error loading stats.`;
    }
  }

  // Match trust score query
  if (norm.includes('score') || norm.includes('trust') || norm.includes('readiness')) {
    const pts = localStorage.getItem(`aza_trust_points_${bId}`) || "350";
    return `⭐️ Credit Status:\n\n• Rating: 640 / 1000\n• Capital Readiness: ${pts} / 500 PTS\n\nQualifies for Tier 1 & 2 Loans! Go to the Lending page to view funding.`;
  }

  // Fallback / instructions
  return `ℹ️ Kudi Assistant Commands:\n\n1. "Sold [item] for [amount]"\n2. "Paid [recipient] [amount] for [reason]"\n3. "What is my profit this week?"\n4. "What is my trust score?"`;
}
