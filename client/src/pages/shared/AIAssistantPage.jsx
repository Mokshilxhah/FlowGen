import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, Bot, User as UserIcon, Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AIAssistantPage() {
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => 'session_' + Date.now() + Math.random().toString(36).substr(2, 9));
  const bottomRef = useRef(null);

  // We fetch history if we had a persistent session, but here we just start fresh for simplicity,
  // unless we want to load existing. Let's start fresh in this session.
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0]}! I'm your FlowGen AI assistant. How can I help you today?`,
      timestamp: new Date().toISOString()
    }
  ]);

  const sendMutation = useMutation({
    mutationFn: (message) => api.post('/ai/chat/message', { message, sessionId }),
    onSuccess: (res) => {
      const reply = res.data?.data?.reply || 'Sorry, I could not process that request.';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString()
        }
      ]);
    },
    onError: (e) => {
      toast.error(e.response?.data?.error || 'Failed to connect to AI Service');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⚠️ I encountered an error connecting to my servers. Please try again later.',
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, userMsg]);
    sendMutation.mutate(input.trim());
    setInput('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-160px)] flex flex-col bg-[#1E293B] border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-slate-700/80 bg-slate-900/90">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-blue-600">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
            FlowBot AI Assistant <Sparkles size={14} className="text-blue-400" />
          </h2>
          <p className="text-xs text-slate-400">Powered by FlowGen Intelligence</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#1E293B]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                isUser ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-600 text-white'
              }`}>
                {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm font-medium shadow-sm'
                      : msg.isError 
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-tl-sm'
                        : 'bg-slate-900 text-slate-100 border border-slate-700/60 rounded-tl-sm shadow-sm'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-slate-400 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          );
        })}
        {sendMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 bg-blue-600 text-white">
              <Bot size={16} />
            </div>
            <div className="bg-slate-900 border border-slate-700/60 px-5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              <span className="text-sm text-slate-400">FlowBot is thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-slate-700/80 bg-slate-900/90">
        <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[#1E293B] rounded-2xl p-2 pr-3 border border-slate-700 focus-within:border-blue-500 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask AI for task suggestions, productivity tips, or general help..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none px-3 py-2"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="p-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500 transition-colors flex-shrink-0 shadow-md"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3">
          FlowBot AI can make mistakes. Consider verifying important information.
        </p>
      </div>
    </motion.div>
  );
}
