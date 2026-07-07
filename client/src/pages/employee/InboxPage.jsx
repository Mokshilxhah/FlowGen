import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mail, Plus, Search, Inbox, AlertTriangle, Bell, Settings } from 'lucide-react';
import { api } from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { formatMessageTime } from '../../utils/formatters';
import { showToast, toastHelpers } from '../../utils/toast';

const categories = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'unread', label: 'Unread', icon: Mail },
  { id: 'general', label: 'General', icon: Bell },
  { id: 'alert', label: 'Alerts', icon: AlertTriangle },
  { id: 'meeting_invite', label: 'Meetings', icon: Settings },
];

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [compose, setCompose] = useState({ toId: '', subject: '', body: '' });

  const { data: inboxPage, isLoading } = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: async () => (await api.get('/messages?limit=100')).data.data,
  });

  const messages = inboxPage?.items || [];

  const { data: peers = [] } = useQuery({
    queryKey: ['user', 'peers'],
    queryFn: async () => (await api.get('/user/peers')).data.data,
  });

  const sendMutation = useMutation({
    mutationFn: (body) => api.post('/messages', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toastHelpers.messageSent();
      setComposeOpen(false);
      setCompose({ toId: '', subject: '', body: '' });
    },
    onError: (e) => {
      showToast.error(e.response?.data?.error || 'Failed to send message');
    },
  });

  const filtered = messages.filter((m) => {
    const matchCat =
      activeCategory === 'all' ||
      (activeCategory === 'unread' && !m.isRead) ||
      m.category === activeCategory;
    const matchSearch = (m.subject || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  useEffect(() => {
    if (!selectedMsg?.id) return;
    let cancelled = false;
    (async () => {
      try {
        await api.get(`/messages/${selectedMsg.id}`);
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ['messages', 'inbox'] });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        }
      } catch {
        /* */
      }
    })();
    return () => { cancelled = true; };
  }, [selectedMsg?.id, queryClient]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Inbox</h2>
          <p className="text-text-secondary text-sm mt-1">
            {isLoading ? 'Loading…' : `${unreadCount} unread`} · Live mail from the API
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setComposeOpen(true)}>Compose</Button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        <div className="w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="glass-card p-2 space-y-1">
            {categories.map((cat) => {
              const count =
                cat.id === 'unread'
                  ? unreadCount
                  : cat.id === 'all'
                    ? unreadCount
                    : messages.filter((m) => m.category === cat.id && !m.isRead).length;
              return (
                <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${activeCategory === cat.id ? 'bg-accent-electric/15 text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}>
                  <cat.icon size={14} />
                  <span className="flex-1 text-left">{cat.label}</span>
                  {count > 0 && <span className="px-1.5 py-0.5 text-xs bg-accent-electric/20 text-accent-electric rounded-full">{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages..."
              className="w-full pl-9 pr-4 py-2 bg-elevated border border-white/10 rounded-xl text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/50" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filtered.map((msg) => {
              const sender = msg.fromUser;
              return (
                <button key={msg.id} type="button" onClick={() => setSelectedMsg(msg)}
                  className={`w-full glass-card p-4 text-left transition-all hover:border-white/20 ${selectedMsg?.id === msg.id ? 'border-accent-electric/40 bg-accent-electric/5' : ''} ${!msg.isRead ? 'border-l-2 border-l-accent-electric' : ''}`}>
                  <div className="flex items-start gap-3">
                    <Avatar src={sender?.avatar} name={sender?.name || '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${!msg.isRead ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{sender?.name || 'Unknown'}</p>
                        <span className="text-xs text-text-muted flex-shrink-0">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${!msg.isRead ? 'text-text-primary' : 'text-text-muted'}`}>{msg.subject}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 glass-card overflow-hidden">
          {selectedMsg ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-white/06">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{selectedMsg.subject}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Avatar src={selectedMsg.fromUser?.avatar} name={selectedMsg.fromUser?.name} size="sm" />
                      <div>
                        <p className="text-sm text-text-secondary">{selectedMsg.fromUser?.name}</p>
                        <p className="text-xs text-text-muted">{formatMessageTime(selectedMsg.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{selectedMsg.body || ''}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              <Mail size={48} className="opacity-20 mb-3" />
              <p className="text-sm">Select a message to read</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="New Message" size="md">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">To</label>
            <select value={compose.toId} onChange={(e) => setCompose((c) => ({ ...c, toId: e.target.value }))}
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/50">
              <option value="">Select teammate</option>
              {peers.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>
          <Input label="Subject" required value={compose.subject} onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))} />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-text-muted">Message</label>
            </div>
            <textarea value={compose.body} onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/60 resize-none h-32"
              placeholder="Write your message..." />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button fullWidth loading={sendMutation.isPending} onClick={() => {
              if (!compose.toId || !compose.subject.trim()) {
                toastHelpers.validationError('Recipient and subject required');
                return;
              }
              sendMutation.mutate({ toId: compose.toId, subject: compose.subject.trim(), body: compose.body, category: 'general' });
            }}>Send Message</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
