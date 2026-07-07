import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Minimize2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { isToday, startOfWeek, isAfter } from 'date-fns';

const suggestedPrompts = [
  "What's due today?",
  "How many tasks pending?",
  "Meetings today?",
  "Who is on my team?",
];

async function checkAIHealth() {
  try {
    const res = await api.get('/ai/health');
    return res.data?.data?.status === 'online';
  } catch {
    return false;
  }
}

async function buildReply(query, user) {
  try {
    const response = await api.post('/ai/chat/message', {
      message: query,
      sessionId: sessionStorage.getItem('aiChatSessionId') || null,
    });

    if (response.data?.data?.response?.includes('unavailable')) {
      throw new Error('AI Service Offline');
    }

    if (response.data?.data?.sessionId) {
      sessionStorage.setItem('aiChatSessionId', response.data.data.sessionId);
    }

    return response.data?.data?.response || 'Sorry, I encountered an error. Please try again.';
  } catch (error) {
    console.warn('AI Chat Falling back to local data:', error.message);
    
    // Fallback to local logic
    const lower = query.toLowerCase();
    try {
      const [tasksRes, meetingsRes, peersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/meetings'),
        api.get('/user/peers').catch(() => ({ data: { data: [] } })),
      ]);
      const tasks = tasksRes.data?.data || [];
      const meetings = meetingsRes.data?.data || [];
      const peers = peersRes.data?.data || [];

      const mine = tasks.filter((t) => t.assigneeId === user?.id);
      const pending = mine.filter((t) => t.status !== 'done');

      if (lower.includes('pending') || lower.includes('task')) {
        return `You have **${pending.length}** open tasks assigned to you. I'm currently running in **Local Mode** because the AI Service is offline, but I can still see your work!`;
      }

      if (lower.includes('due') && lower.includes('today')) {
        const dueToday = mine.filter((t) => t.dueDate && isToday(new Date(t.dueDate)));
        return `**${dueToday.length}** tasks have a due date today. (Local Mode)`;
      }

      if (lower.includes('meeting')) {
        const todayM = meetings.filter((m) => m.status === 'scheduled' && isToday(new Date(m.scheduledAt)));
        return `**${todayM.length}** meetings scheduled for today. (Local Mode)`;
      }
    } catch {
      return 'I cannot reach my AI brain or the database right now. Please ensure the backend services are running.';
    }

    return `FlowBot is currently in **Offline/Local Mode**. I can answer basic questions about your tasks and meetings, but my advanced AI features are unavailable until the AI Service is started.`;
  }
}

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [text]);
  return <span className="whitespace-pre-line">{displayed}</span>;
}

export default function AIChatBot() {
  const { aiChatOpen, toggleAIChat } = useUIStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm FlowBot, your AI work assistant. How can I help you today?`, isNew: false },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const check = async () => setIsOnline(await checkAIHealth());
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text, isNew: false };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await buildReply(text, user);
    setIsTyping(false);
    setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: response, isNew: true }]);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!aiChatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={toggleAIChat}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 0 30px rgba(99,102,241,0.5), 0 8px 20px rgba(0,0,0,0.3)' }}
          >
            <Bot size={24} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {aiChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-40 w-96 h-[520px] glass-card flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/06 bg-gradient-to-r from-accent-electric/10 to-accent-violet/10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-electric to-accent-violet flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">FlowBot</p>
                <p className={`text-xs flex items-center gap-1 ${isOnline ? 'text-accent-emerald' : 'text-text-muted'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${isOnline ? 'bg-accent-emerald' : 'bg-text-muted'}`} /> 
                  {isOnline ? 'Online' : 'Local Mode'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleAIChat} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-electric to-accent-violet flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <Sparkles size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-accent-electric to-accent-violet text-white rounded-tr-sm'
                      : 'bg-elevated text-text-primary rounded-tl-sm'
                  }`}>
                    {msg.isNew && msg.role === 'bot'
                      ? <TypewriterText text={msg.text} />
                      : <span className="whitespace-pre-line">{msg.text}</span>
                    }
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-electric to-accent-violet flex items-center justify-center">
                    <Sparkles size={12} className="text-white" />
                  </div>
                  <div className="bg-elevated px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {suggestedPrompts.map(p => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="px-2.5 py-1 text-xs bg-accent-electric/10 text-accent-electric border border-accent-electric/20 rounded-full hover:bg-accent-electric/20 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/06">
              <div className="flex items-center gap-2 bg-elevated rounded-xl px-3 py-2 border border-white/10 focus-within:border-accent-electric/50 transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder="Ask FlowBot anything..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  className="p-1.5 rounded-lg bg-accent-electric text-white disabled:opacity-40 hover:bg-accent-violet transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
