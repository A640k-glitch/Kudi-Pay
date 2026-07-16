import React, { useState, useEffect, useRef } from 'react';
import { PaperPlaneRight, Checks, CircleNotch } from '@phosphor-icons/react';
import { ledgerService } from '../../lib/services/ledgerService';
import { bankAccountService } from '../../lib/services/bankAccountService';
import { trustScoreService } from '../../lib/services/trustScoreService';
import { dashboardAgentService } from '../../lib/services/aiAgentService';
import { productService } from '../../lib/services/productService';
import { orderService } from '../../lib/services/orderService';
import { authService } from '../../lib/services/authService';
import { formatNaira } from '../../lib/utils';
import { api } from '../../lib/api';
import { Logo } from '../../components/Logo';
import LoadingProgress from '../../components/ui/LoadingProgress';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isRead?: boolean;
  type?: 'text' | 'commands';
}

const PRESET_COMMANDS = [
  { label: 'Business overview', text: 'Give me a full summary of my business.' },
  { label: 'Trust score', text: 'What is my current trust score and rating?' },
  { label: 'Weekly profit', text: 'What is my profit this week?' },
];

const ALL_COMMANDS_BUTTONS = [
  { label: 'Profit', text: 'What is my profit this week?' },
  { label: 'Revenue', text: 'What is my revenue this month?' },
  { label: 'Transactions', text: 'Show my recent transactions' },
  { label: 'Trust score', text: 'What is my trust score?' },
  { label: 'Loan', text: 'Am I eligible for a loan?' },
  { label: 'Bank sync', text: 'Sync my bank transactions' },
  { label: 'Balance', text: 'What is my bank balance?' },
  { label: 'Bank account', text: 'What bank account do I have linked?' },
  { label: 'Products', text: 'How many products do I have?' },
  { label: 'Orders', text: 'How many orders have I received?' },
  { label: 'Store link', text: 'What is my storefront link?' },
  { label: 'KYC', text: 'What is my KYC status?' },
  { label: 'Overview', text: 'Give me a business overview' },
];

const WELCOME_COMMANDS_TEXT = `Hey there! 👋 Welcome to Kudi — your AI business assistant.

I can help you understand your finances, trust score, products, orders, and more — all from your live dashboard data.

Here's everything I can do:`; // buttons shown below

const ALL_COMMANDS_TEXT = `📋 Here's everything I can help you with:`; // buttons shown below

const UNRELATED_TEXT = `I'm a business assistant and can only help with questions about your dashboard data. Type /commands to see what I can do.`;

function getFormattedTime() {
  return String(Date.now());
}

function formatDisplayTime(ts: string | undefined | null) {
  if (!ts || ts === 'NaN' || ts === 'null' || ts === 'undefined') return '';
  const n = Number(ts);
  if (!isNaN(n) && n > 0) {
    return new Date(n).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return ts;
}

/** Strip code blocks, URLs, and embedded instructions from user input. */
function sanitizeInput(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '[code removed]')
    .replace(/`[^`]+`/g, '[code removed]')
    .replace(/https?:\/\/[^\s]+/g, '[link removed]')
    .replace(/(?<=\b)ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|commands|rules)/gi, '')
    .replace(/(?<=\b)you\s+are\s+(now|no longer)/gi, '')
    .replace(/(?<=\b)act\s+as\s+/gi, '')
    .replace(/system\s*(prompt|instruction|message)/gi, 'system directive');
}

/** Simple greeting words */
function isGreeting(text: string): boolean {
  const q = text.toLowerCase().trim();
  const greetings = ['hi', 'hey', 'hello', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo', 'howdy', 'hey there', 'hi there'];
  return greetings.includes(q) || /^(hi|hey|hello)[\s!.,]*$/.test(q);
}

/** Detect if a query is related to the user's business dashboard. */
function isBusinessQuery(text: string): boolean {
  const q = text.toLowerCase().trim();
  const businessKeywords = [
    'product', 'inventory', 'stock', 'item', 'sell', 'order', 'sale',
    'bank', 'account', 'balance', 'transaction', 'history', 'spending', 'income',
    'storefront', 'store link', 'shop link', 'url', 'my link',
    'kyc', 'verification', 'tier', 'cac', 'tin',
    'trust', 'score', 'credit', 'rating', 'health',
    'overview', 'summary', 'full', 'dashboard',
    'loan', 'borrow', 'funding', 'eligib', 'lend',
    'profit', 'revenue', 'weekly', 'monthly',
    'sync', 'help', 'command', 'update', 'refresh',
    'what is my', 'how many', 'give me', 'show me', 'tell me',
    'business', 'finance', 'money', 'naira', 'kyc',
    '/commands', '/help',
    'whats', "what's", 'details', 'about', 'info', 'who am i', 'profile',
    'when', 'join', 'register', 'old', 'age', 'created',
    'yes', 'no', 'ok', 'okay', 'thanks', 'thank you', 'sure'
  ];
  for (const kw of businessKeywords) {
    if (q.includes(kw)) return true;
  }
  return false;
}

export default function WhatsAppBotPage() {
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [isAiActive, setIsAiActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [businessId, setBusinessId] = useState<string>(() => {
    return authService.getCurrentBusinessId() || '';
  });

  // Also resolve businessId from server if not in localStorage
  useEffect(() => {
    if (businessId) return;
    const phone = localStorage.getItem('kudi_session_phone');
    if (!phone) return;
    api.get(`/businesses?phone=${encodeURIComponent(phone)}`).then(data => {
      if (data.business?.id) {
        setBusinessId(data.business.id);
      }
    }).catch(() => {});
  }, [businessId]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load chat history on mount: server first, then local fallback
  useEffect(() => {
    async function loadHistory() {
      if (!businessId) return;
      try {
        const serverMsgs = await dashboardAgentService.getHistory();
        if (serverMsgs.length > 0) {
          setMessages(serverMsgs);
          localStorage.setItem(`kudi_chat_history_${businessId}`, JSON.stringify(serverMsgs));
          setHistoryLoaded(true);
          return;
        }
      } catch {}
      // Fallback to local cache
      try {
        const cache = localStorage.getItem(`kudi_chat_history_${businessId}`);
        if (cache) {
          const parsed = JSON.parse(cache);
          const repaired = parsed.map((m: any) => ({
            ...m,
            type: m.type === 'commands' ? 'commands' : (
              m.text?.includes("Here's everything I can do") || m.text?.includes("📋 Here's everything") ? 'commands' : undefined
            )
          }));
          setMessages(repaired);
          setHistoryLoaded(true);
          return;
        }
      } catch {}
      setHistoryLoaded(true);
    }
    loadHistory();
  }, [businessId]);

  // Initialize bot greeting if still empty after loading
  useEffect(() => {
    if (businessId && historyLoaded && messages.length === 0) {
      const initialMsgs: ChatMessage[] = [
        {
          id: 'init-1',
          sender: 'bot',
          text: WELCOME_COMMANDS_TEXT,
          timestamp: getFormattedTime(),
          type: 'commands'
        }
      ];
      setMessages(initialMsgs);
      dashboardAgentService.saveHistory(initialMsgs);
    }
  }, [businessId, historyLoaded, messages.length]);

  // Save messages to localStorage whenever they change (prune >48h)
  useEffect(() => {
    if (businessId && messages.length > 0) {
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      const pruned = messages.filter(m => {
        const t = Number(m.timestamp);
        return !isNaN(t) ? t > cutoff : true;
      });
      localStorage.setItem(`kudi_chat_history_${businessId}`, JSON.stringify(pruned));
    }
  }, [messages, businessId]);

  // Check AI status
  useEffect(() => {
    async function checkStatus() {
      const active = await dashboardAgentService.checkStatus();
      setIsAiActive(active);
    }
    checkStatus();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSendMessage = async (rawText: string) => {
    if (!rawText.trim() || !businessId) return;

    const textToSend = sanitizeInput(rawText);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: getFormattedTime(),
      isRead: true
    };

    // Rate Limiting — 5 messages per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentMessages = messageTimestamps.filter(t => t > oneMinuteAgo);

    if (recentMessages.length >= 5) {
      const botMsg: ChatMessage = {
        id: `bot-limit-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ Rate Limit Reached\n\nYou have sent too many queries. To keep the service stable, queries are limited to 5 per minute.\n\nPlease wait a moment before sending another query.`,
        timestamp: getFormattedTime()
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      setInputText('');
      return;
    }

    setMessageTimestamps(prev => [...prev.filter(t => t > oneMinuteAgo), now]);
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsBotTyping(true);

    setTimeout(async () => {
      let reply: string;
      let msgType: 'text' | 'commands' | undefined;

      const norm = textToSend.toLowerCase().trim();
      const isSyncCommand = norm.includes('sync') && (norm.includes('bank') || norm.includes('transaction'));

      if (norm === '/commands' || norm === '/help' || norm === 'help') {
        reply = ALL_COMMANDS_TEXT;
        msgType = 'commands';
      } else if (isGreeting(textToSend)) {
        reply = WELCOME_COMMANDS_TEXT;
        msgType = 'commands';
      } else if (isSyncCommand) {
        reply = await handleBankSync(businessId);
      } else if (!isBusinessQuery(textToSend)) {
        reply = UNRELATED_TEXT;
      } else if (isAiActive) {
        reply = await dashboardAgentService.processQuery(businessId, textToSend);
      } else {
        reply = await parseOfflineFallback(textToSend, businessId);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: getFormattedTime(),
        type: msgType
      };
      setMessages(prev => {
        const updated = [...prev, botMsg];
        dashboardAgentService.saveHistory(updated.slice(-100));
        return updated;
      });
      setIsBotTyping(false);
    }, 1200);
  };

  if (!historyLoaded) {
    return <LoadingProgress />;
  }

  return (
    <div className="flex flex-col h-full md:h-[calc(100vh-64px)] w-full md:max-w-md mx-auto bg-slate-50 md:border-2 md:border-slate-200 md:rounded-[24px] overflow-hidden md:shadow-sm relative font-sans md:my-4">
      {/* Header */}
      <header className="hidden md:flex bg-slate-900 border-b-2 border-slate-900 text-white p-4 items-center gap-4 shrink-0 select-none z-20">
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <Logo iconOnly className="h-10" />
        </div>
        <div className="flex-grow">
          <div className="font-display font-bold text-lg text-white flex items-center justify-between">
            <span>Kudi Assistant</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
              isAiActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {isAiActive ? 'Active' : 'Offline'}
            </span>
          </div>
          <div className="text-xs font-medium text-slate-300 flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full inline-block ${isAiActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            {isAiActive ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40 bg-slate-100 relative">
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
                <div className="whitespace-pre-line">{msg.text}</div>

                {!isUser && msg.type === 'commands' && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {ALL_COMMANDS_BUTTONS.map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(cmd.text)}
                        className="text-[11px] font-bold bg-slate-100 border border-slate-300 text-slate-700 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-900 hover:text-white hover:border-slate-900 active:scale-95 transition-all truncate whitespace-nowrap"
                        title={cmd.text}
                      >
                        {cmd.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500 mt-2 select-none border-t border-slate-900/10 pt-1.5 font-bold">
                  <span>{formatDisplayTime(msg.timestamp)}</span>
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
              <span>Kudi is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Text Input Bar */}
      <footer className="p-3 pb-safe bg-transparent shrink-0 z-20 relative">
        {/* Floating Command Quick-buttons directly on top of input */}
        <div className="absolute bottom-full left-0 right-0 px-3 pb-2 flex flex-nowrap overflow-x-auto gap-2 scrollbar-hide">
          {PRESET_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(cmd.text)}
              className="text-xs font-bold bg-slate-900 text-white border-2 border-slate-900 px-3 py-2 rounded-full cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none hover:bg-slate-800 active:translate-y-[2px] active:translate-x-[2px] transition-all whitespace-nowrap shrink-0"
              title={cmd.text}
            >
              {cmd.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 bg-white border-2 border-slate-900 rounded-[20px] p-1.5 shadow-[4px_4px_0px_#0f172a] focus-within:shadow-[2px_2px_0px_#0f172a] focus-within:translate-y-[2px] focus-within:translate-x-[2px] transition-all w-full relative z-10">
          <input
            type="text"
            placeholder="Ask me anything about your business..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputText);
            }}
            className="flex-1 bg-transparent px-4 py-2 text-sm font-medium placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isBotTyping}
            className="w-10 h-10 bg-[#E0FF4F] text-slate-900 border-2 border-slate-900 rounded-full flex items-center justify-center hover:bg-[#d4f542] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shrink-0"
          >
            <PaperPlaneRight className="w-5 h-5" weight="bold" />
          </button>
        </div>
      </footer>
    </div>
  );
}

// Bank sync handler — always runs locally since it triggers a real DB write
async function handleBankSync(bId: string): Promise<string> {
  const hasLinked = await bankAccountService.hasLinkedAccount(bId);
  if (!hasLinked) {
    return `❌ No Linked Bank Account\n\nYou need to link a bank account before you can sync transactions.\n\n📍 How to Link Your Bank:\n1. Tap the profile icon at the top of your dashboard to open the "Account" page\n2. Find the "Bank Connection" card\n3. Tap "Link Bank Account"\n4. Select your bank and enter your account number`;
  }
  try {
    const syncResult = await bankAccountService.syncTransactions(bId);
    const channel = new BroadcastChannel('dashboard_updates');
    channel.postMessage({ type: 'dashboard_sync' });
    channel.close();

    if (syncResult.newCount === 0) {
      return `🔄 Bank Account Synced!\n\nNo new transactions since last sync.\nAll records are up to date.`;
    }

    const lines = syncResult.transactions.map(t =>
      `• ${t.type === 'credit' ? '✅ +' : '❌ -'}${formatNaira(t.amount)} — ${t.narration}`
    ).join('\n');

    return `🔄 Synced ${syncResult.newCount} new transaction(s):\n\n${lines}\n\n✨ Your trust score and dashboard have been updated!`;
  } catch {
    return `❌ Failed to sync bank account. Please try again.`;
  }
}

// Offline fallback — structured local responses when AI is unavailable
async function parseOfflineFallback(msg: string, bId: string): Promise<string> {
  const norm = msg.toLowerCase().trim();

  // ── Finance / Profit / Revenue ──
  if (norm.includes('profit') || norm.includes('revenue') || norm.includes('income') || norm.includes('how much')) {
    try {
      const stats = await ledgerService.getStats(bId);
      return `📊 Financial Summary\n\n• Revenue: ${formatNaira(stats.revenue)}\n• Expenses: ${formatNaira(stats.expenses)}\n• Net Profit: ${formatNaira(stats.profit)}\n\nDo you want me to explain further?`;
    } catch {
      return `❌ Could not load financial stats. Please make sure the server is running.`;
    }
  }

  // ── Trust Score ──
  if (norm.includes('score') || norm.includes('trust') || norm.includes('credit') || norm.includes('rating') || norm.includes('health')) {
    const hasLinked = await bankAccountService.hasLinkedAccount(bId);
    if (!hasLinked) {
      return `⭐ Trust Score: 0 / 1,000\n\nYour trust score isn't active because no bank account is linked.\n\nDo you want me to explain further?`;
    }
    const latest = trustScoreService.getLatestSnapshot(bId);
    if (!latest) {
      return `⭐ Trust Score: 0 / 1,000\n\nYour bank is linked — keep transacting to build your score.\n\nDo you want me to explain further?`;
    }
    
    let rating = 'Needs Improvement';
    if (latest.score >= 700) rating = 'Excellent';
    else if (latest.score >= 500) rating = 'Good';
    else if (latest.score >= 300) rating = 'Fair';
    
    return `⭐ Trust Score: ${latest.score} / 1,000 (${rating})\n\nDo you want me to explain further?`;
  }

  // ── Loan Eligibility ──
  if (norm.includes('loan') || norm.includes('borrow') || norm.includes('funding') || norm.includes('eligib') || norm.includes('lend')) {
    const latest = trustScoreService.getLatestSnapshot(bId);
    const score = latest?.score ?? 0;
    if (score < 300) {
      return `🏦 Loan Eligibility: Not Yet Qualified\n\nYou need a trust score of 300 (Currently ${score}).\n\nDo you want me to explain further?`;
    }
    return `🏦 Loan Eligibility: Qualified ✓\n\nYou qualify with a score of ${score}/1,000. Check the "Loans" tab.\n\nDo you want me to explain further?`;
  }

  // ── Products ──
  if (norm.includes('product') || norm.includes('inventory') || norm.includes('stock') || norm.includes('item') || norm.includes('sell') || norm.includes('add a product') || norm.includes('add product')) {
    try {
      const products = await productService.getProducts(bId);
      if (products.length === 0) {
        return `📦 Products: 0 listed\n\nYou haven't added any products yet.\n\nDo you want me to explain further?`;
      }
      return `📦 Products: ${products.length} listed\n\nDo you want me to explain further?`;
    } catch {
      return `❌ Could not load products. Please make sure the server is running.`;
    }
  }

  // ── Orders / Sales ──
  if (norm.includes('order') || norm.includes('sale') || (norm.includes('how many') && (norm.includes('order') || norm.includes('sale')))) {
    try {
      const orders = await orderService.getOrders(bId);
      if (orders.length === 0) {
        return `🛒 Orders: 0 received\n\nDo you want me to explain further?`;
      }
      const totalSales = orders
        .filter(o => o.status === 'paid' || o.status === 'fulfilled')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      return `🛒 Orders & Sales\n\n• Orders: ${orders.length}\n• Total Sales: ${formatNaira(totalSales)}\n\nDo you want me to explain further?`;
    } catch {
      return `❌ Could not load orders. Please make sure the server is running.`;
    }
  }

  // ── Bank Account / Balance ──
  if ((norm.includes('bank') || norm.includes('account') || norm.includes('balance')) && (norm.includes('link') || norm.includes('balance') || norm.includes('what') || norm.includes('detail') || norm.includes('name'))) {
    try {
      const account = await bankAccountService.getAccount(bId);
      if (!account) {
        return `🏦 Bank Account: Not Linked\n\nWould you like more details?`;
      }
      return `🏦 Bank Account\n\n• Bank: ${account.institution}\n• Balance: ${formatNaira(account.balance)}\n\nWould you like more details?`;
    } catch {
      return `❌ Could not load bank account details. Please make sure the server is running.`;
    }
  }

  // ── Simple balance query ──
  if (norm.includes('balance') && !norm.includes('bank')) {
    try {
      const account = await bankAccountService.getAccount(bId);
      if (!account) {
        return `💵 Balance — No Bank Linked\n\nYou need to link a bank account to view your balance.\n\n📍 Go to the "Account" page (tap the profile icon at the top of your dashboard) → tap "Link Bank Account" to get started.`;
      }
      return `💵 Your current balance is ${formatNaira(account.balance)}.`;
    } catch {
      return `❌ Could not load balance. Please make sure the server is running.`;
    }
  }

  // ── Storefront Link ──
  if (norm.includes('storefront') || norm.includes('store link') || norm.includes('shop link') || norm.includes('url') || norm.includes('my link')) {
    try {
      const data = await api.get(`/businesses/by-id/${bId}`);
      const slug = data.business?.storefrontSlug || data.business?.storefront_slug;
      if (slug) {
        return `🔗 Your Storefront Link:\nhttps://kudipay.com/store/${slug}\n\nWould you like more details?`;
      }
      return `🔗 Storefront Link: Not Set Up\n\nWould you like more details?`;
    } catch {
      return `❌ Could not retrieve storefront link.`;
    }
  }

  // ── KYC / Verification Status ──
  if (norm.includes('kyc') || norm.includes('verification') || norm.includes('tier') || norm.includes('cac') || norm.includes('tin')) {
    try {
      const data = await api.get(`/businesses/by-id/${bId}`);
      const b = data.business;
      if (!b) return `❌ Could not load verification details.`;
      const tier = b.kycTier ?? b.kyc_tier ?? 0;
      
      return `🔐 KYC Status: Tier ${tier}\n\nWould you like more details?`;
    } catch {
      return `❌ Could not load verification details. Please make sure the server is running.`;
    }
  }

  // ── Transactions / History ──
  if (norm.includes('transaction') || norm.includes('history') || norm.includes('recent') || norm.includes('spending') || norm.includes('income')) {
    try {
      const txs = await bankAccountService.getTransactions(bId);
      if (txs.length === 0) {
        return `📋 Transactions: None found.\n\nWould you like more details?`;
      }
      const recent = txs.slice(0, 5);
      const lines = recent.map(t => `${new Date(t.date).toLocaleDateString()}: ${t.type === 'credit' ? '+' : '-'}${formatNaira(t.amount)} ${t.narration ? `— ${t.narration}` : ''}`);
      return `📋 Recent Transactions:\n${lines.join('\n')}\n\nWould you like more details?`;
    } catch {
      return `❌ Could not load transactions. Please make sure the server is running.`;
    }
  }

  // ── Business Overview ──
  if (norm.includes('overview') || norm.includes('summary') || norm.includes('full') || norm.includes('all') || norm.includes('dashboard')) {
    try {
      const [bizData, prods, orders, account, stats] = await Promise.allSettled([
        api.get(`/businesses/by-id/${bId}`),
        productService.getProducts(bId),
        orderService.getOrders(bId),
        bankAccountService.getAccount(bId),
        ledgerService.getStats(bId),
      ]);

      const b = bizData.status === 'fulfilled' ? bizData.value.business : null;
      const products = prods.status === 'fulfilled' ? prods.value : [];
      const ordersList = orders.status === 'fulfilled' ? orders.value : [];
      const bank = account.status === 'fulfilled' ? account.value : null;
      const finance = stats.status === 'fulfilled' ? stats.value : null;

      const lines = [`📊 Business Overview`];
      lines.push(`📦 Products: ${products.length}`);
      if (ordersList.length > 0) {
        const paidSales = ordersList.filter(o => o.status === 'paid' || o.status === 'fulfilled').reduce((s, o) => s + o.totalAmount, 0);
        lines.push(`🛒 Orders: ${ordersList.length} | Sales: ${formatNaira(paidSales)}`);
      } else {
        lines.push(`🛒 Orders: 0`);
      }
      if (bank) lines.push(`🏦 Bank: Linked`);
      else lines.push(`🏦 Bank: Not linked`);

      lines.push(`\nWould you like more details?`);
      return lines.join('\n');
    } catch {
      return `❌ Could not load business overview. Please make sure the server is running.`;
    }
  }

  // ── General Business Info / About ──
  if (norm.includes('about') || norm.includes('details') || norm.includes('who am i') || norm.includes('what is my business') || norm.includes('whats my') || norm.includes('profile') || norm.includes('info')) {
    try {
      const bizData = await api.get(`/businesses/by-id/${bId}`);
      const b = bizData.business;
      if (!b) return `❌ Could not load business details.`;
      
      const lines = [`🏢 Business Name: ${b.businessName || b.name || 'Not set'}`];
      if (b.description) lines.push(`📝 About: ${b.description}`);
      if (b.state || b.lga) lines.push(`📍 Location: ${b.lga ? b.lga + ', ' : ''}${b.state || ''}`);
      if (b.email) lines.push(`📧 Email: ${b.email}`);
      if (b.phoneNumber) lines.push(`📞 Phone: ${b.phoneNumber}`);
      
      lines.push(`\nWould you like more details?`);
      return lines.join('\n');
    } catch {
      // If we fail, just fallback
    }
  }

  // ── Account Age / Join Date ──
  if (norm.includes('when') || norm.includes('join') || norm.includes('register') || norm.includes('old') || norm.includes('created')) {
    try {
      const bizData = await api.get(`/businesses/by-id/${bId}`);
      const b = bizData.business;
      if (!b || !b.createdAt) return `❌ Could not load registration date.`;
      const joinDate = new Date(b.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      return `📅 Account Created: You joined Kudi on ${joinDate}.`;
    } catch {
      // Ignore
    }
  }

  // ── Conversational Acknowledgements ──
  if (norm === 'yes' || norm === 'yep' || norm === 'yeah' || norm === 'sure') {
    return "Great! Type your specific question or use /commands to see options.";
  }
  if (norm === 'no' || norm === 'nope') {
    return "Alright. Let me know if you need anything else.";
  }
  if (norm === 'ok' || norm === 'okay' || norm === 'thanks' || norm === 'thank you') {
    return "You're welcome! Let me know if you need help with anything else.";
  }

  // Generic fallback — redirect to commands
  return "I'm a business assistant and can only help with questions about your dashboard data. Type /commands to see what I can do.";
}

