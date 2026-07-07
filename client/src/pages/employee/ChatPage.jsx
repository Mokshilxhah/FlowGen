import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, MessageSquare, Smile, Paperclip, Search, Plus, ChevronDown, ChevronUp, Users, UserCheck, GraduationCap, UserCircle, Star, File as FileIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { formatMessageTime } from '../../utils/formatters';
import { showToast, toastHelpers } from '../../utils/toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { socket } from '../../lib/socket';


export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeRoom, setActiveRoom] = useState(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [dmPeerId, setDmPeerId] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedTeammate, setSelectedTeammate] = useState(null);
  const [dirOpen, setDirOpen] = useState({ hr: true, employee: true, intern: true });
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: async () => (await api.get('/chat/rooms')).data.data,
  });

  const { data: peers = [] } = useQuery({
    queryKey: ['user', 'peers'],
    queryFn: async () => (await api.get('/user/peers')).data.data,
  });

  const groupedPeers = useMemo(() => {
    return {
      hr: peers.filter(p => p.role === 'hr'),
      employee: peers.filter(p => p.role === 'employee'),
      intern: peers.filter(p => p.role === 'intern'),
    };
  }, [peers]);

  // Removed setState in effect

  const peerMap = useMemo(() => {
    const m = new Map();
    peers.forEach((p) => m.set(p.id, p));
    if (user?.id) m.set(user.id, user);
    return m;
  }, [peers, user]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat', 'messages', activeRoom?.id],
    enabled: !!activeRoom?.id,
    queryFn: async () => {
      const res = await api.get(`/chat/rooms/${activeRoom.id}/messages`, { params: { limit: 100 } });
      return res.data.data?.items || [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: (content) => api.post(`/chat/rooms/${activeRoom.id}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', activeRoom.id] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      toastHelpers.messageSent();
    },
    onError: (e) => {
      showToast.error(e.response?.data?.error || 'Could not send message');
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/chat/rooms/${activeRoom.id}/messages/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', activeRoom.id] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      toastHelpers.messageSent();
    },
    onError: (e) => {
      showToast.error(e.response?.data?.error || 'Could not upload file');
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return showToast.error('File must be less than 10MB');
    uploadFileMutation.mutate(file);
    e.target.value = '';
  };

  const createDmMutation = useMutation({
    mutationFn: (participantIds) => api.post('/chat/rooms', { type: 'direct', participantIds }),
    onSuccess: async (res) => {
      const room = res.data?.data;
      await queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      setNewDmOpen(false);
      setProfileModalOpen(false);
      setDmPeerId('');
      if (room?.id) setActiveRoom(room);
      showToast.success('Conversation opened');
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Could not start chat'),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeRoom?.id) {
      socket.emit('join:room', activeRoom.id);
    }

    const handleNewMessage = (msg) => {
      // Invalidate the message query for the room
      if (msg.roomId === activeRoom?.id) {
        queryClient.setQueryData(['chat', 'messages', activeRoom.id], (old = []) => {
          // Prevent duplicates
          if (old.some(m => m.id === msg.id)) return old;
          return [...old, msg];
        });
      }
      // Also invalidate rooms list to show last message
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    };

    socket.on('chat:message', handleNewMessage);
    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [activeRoom?.id, queryClient]);

  const getRoomName = (room) => {
    if (!room) return '';
    if (room.type !== 'direct') return room.name || 'Group';
    const otherId = room.participants?.find((p) => p !== user?.id);
    return peerMap.get(otherId)?.name || 'Direct message';
  };

  const getRoomAvatar = (room) => {
    if (!room || room.type !== 'direct') return null;
    const otherId = room.participants?.find((p) => p !== user?.id);
    return peerMap.get(otherId) || null;
  };

  const filteredRooms = (type) =>
    rooms.filter((r) => r.type === type).filter((r) => {
      if (!search.trim()) return true;
      return getRoomName(r).toLowerCase().includes(search.toLowerCase());
    });

  const sendMessage = () => {
    if (!input.trim() || !activeRoom?.id) return;
    sendMutation.mutate(input.trim());
    setInput('');
  };

  const handleTeammateSelect = (teammate) => {
    // If there is an existing room with this teammate, open it directly
    const existing = rooms.find(r => r.type === 'direct' && r.participants?.includes(teammate.id));
    if (existing) {
      setActiveRoom(existing);
      setProfileModalOpen(false);
      showToast.success(`Opened chat with ${teammate.name}`);
    } else {
      // Create new direct room
      createDmMutation.mutate([teammate.id]);
    }
  };

  const channels = [...filteredRooms('team_channel'), ...filteredRooms('group')];
  const directs = filteredRooms('direct');

  const filteredGroupPeers = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return groupedPeers;
    return {
      hr: groupedPeers.hr.filter(p => p.name.toLowerCase().includes(s) || (p.designation || '').toLowerCase().includes(s)),
      employee: groupedPeers.employee.filter(p => p.name.toLowerCase().includes(s) || (p.designation || '').toLowerCase().includes(s)),
      intern: groupedPeers.intern.filter(p => p.name.toLowerCase().includes(s) || (p.designation || '').toLowerCase().includes(s)),
    };
  }, [groupedPeers, search]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-160px)] flex gap-4">
      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teammate or chat..."
            className="w-full pl-9 pr-4 py-2 bg-elevated border border-white/10 rounded-xl text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Recent & Frequent Chats */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                <Star size={10} className="text-accent-cyan" /> Recent &amp; Frequent Chats
              </p>
              <button
                type="button"
                onClick={() => setNewDmOpen(true)}
                className="text-text-muted hover:text-text-primary transition-colors"
                title="New Direct Message"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {roomsLoading && <p className="text-xs text-text-muted px-2 py-1">Loading chats…</p>}
              {!roomsLoading && channels.length === 0 && directs.length === 0 && (
                <p className="text-xs text-text-muted px-2 py-1">No recent chats</p>
              )}
              {channels.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setActiveRoom(room)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                    activeRoom?.id === room.id ? 'bg-accent-electric/15 text-text-primary border-l-2 border-accent-electric' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  <Hash size={13} className="text-text-muted" />
                  <span className="flex-1 text-left truncate">{getRoomName(room)}</span>
                </button>
              ))}
              {directs.map((room) => {
                const other = getRoomAvatar(room);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setActiveRoom(room)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                      activeRoom?.id === room.id ? 'bg-accent-electric/15 text-text-primary border-l-2 border-accent-electric' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    {other ? (
                      <Avatar src={other.avatar} name={other.name} size="xs" status="active" />
                    ) : (
                      <MessageSquare size={13} className="text-text-muted" />
                    )}
                    <span className="flex-1 text-left truncate">{getRoomName(room)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teammates Directory */}
          <div>
            <p className="text-[10px] text-text-muted px-2 mb-2 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Users size={10} className="text-accent-cyan" /> Teammates Directory
            </p>

            <div className="space-y-2">
              {/* HR Managers Category */}
              <div className="bg-white/02 rounded-xl overflow-hidden border border-white/05">
                <button
                  type="button"
                  onClick={() => setDirOpen(prev => ({ ...prev, hr: !prev.hr }))}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-text-secondary hover:bg-white/04 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck size={12} className="text-accent-violet" />
                    HR Managers ({filteredGroupPeers.hr.length})
                  </span>
                  {dirOpen.hr ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {dirOpen.hr && (
                  <div className="p-1.5 space-y-1 border-t border-white/05 bg-black/10">
                    {filteredGroupPeers.hr.length === 0 && <p className="text-[11px] text-text-muted px-2 py-1">No HR teammates</p>}
                    {filteredGroupPeers.hr.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedTeammate(p); setProfileModalOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                      >
                        <Avatar src={p.avatar} name={p.name} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-text-primary">{p.name}</p>
                          <p className="text-[10px] truncate text-text-muted">{p.designation || 'HR Manager'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Employees Category */}
              <div className="bg-white/02 rounded-xl overflow-hidden border border-white/05">
                <button
                  type="button"
                  onClick={() => setDirOpen(prev => ({ ...prev, employee: !prev.employee }))}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-text-secondary hover:bg-white/04 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <UserCircle size={12} className="text-accent-cyan" />
                    Employees ({filteredGroupPeers.employee.length})
                  </span>
                  {dirOpen.employee ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {dirOpen.employee && (
                  <div className="p-1.5 space-y-1 border-t border-white/05 bg-black/10">
                    {filteredGroupPeers.employee.length === 0 && <p className="text-[11px] text-text-muted px-2 py-1">No employee teammates</p>}
                    {filteredGroupPeers.employee.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedTeammate(p); setProfileModalOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                      >
                        <Avatar src={p.avatar} name={p.name} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-text-primary">{p.name}</p>
                          <p className="text-[10px] truncate text-text-muted">{p.designation || 'Staff'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Interns Category */}
              <div className="bg-white/02 rounded-xl overflow-hidden border border-white/05">
                <button
                  type="button"
                  onClick={() => setDirOpen(prev => ({ ...prev, intern: !prev.intern }))}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-text-secondary hover:bg-white/04 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap size={12} className="text-accent-emerald" />
                    Interns ({filteredGroupPeers.intern.length})
                  </span>
                  {dirOpen.intern ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {dirOpen.intern && (
                  <div className="p-1.5 space-y-1 border-t border-white/05 bg-black/10">
                    {filteredGroupPeers.intern.length === 0 && <p className="text-[11px] text-text-muted px-2 py-1">No intern teammates</p>}
                    {filteredGroupPeers.intern.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedTeammate(p); setProfileModalOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                      >
                        <Avatar src={p.avatar} name={p.name} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-text-primary">{p.name}</p>
                          <p className="text-[10px] truncate text-text-muted">{p.designation || 'Intern'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-2 p-8">
            <MessageSquare size={40} className="opacity-30" />
            <p className="text-sm">Select a conversation or start a new direct message</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-white/06">
              {activeRoom.type === 'direct' ? (
                <Avatar src={getRoomAvatar(activeRoom)?.avatar} name={getRoomName(activeRoom)} size="sm" status="active" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-accent-electric/20 flex items-center justify-center">
                  <Hash size={14} className="text-accent-electric" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-text-primary">{getRoomName(activeRoom)}</p>
                <p className="text-xs text-text-muted">{activeRoom.participants?.length || 0} members</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading && <p className="text-xs text-text-muted">Loading messages…</p>}
              {!messagesLoading &&
                messages.map((msg, i) => {
                  const sender = msg.senderUser;
                  const getSenderId = (m) => m?.senderUser?.id || (typeof m?.senderId === 'string' && m.senderId !== '[object Object]' ? m.senderId : null);
                  const currentSenderId = getSenderId(msg);
                  const isMe = String(currentSenderId) === String(user?.id);
                  const showAvatar = !isMe && (i === 0 || String(getSenderId(messages[i - 1])) !== String(currentSenderId));

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      {!isMe && (
                        <div className="w-8 flex-shrink-0">
                          {showAvatar && <Avatar src={sender?.avatar} name={sender?.name} size="sm" />}
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {showAvatar && !isMe && <span className="text-xs text-text-muted px-1">{sender?.name}</span>}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-gradient-to-br from-accent-electric to-accent-violet text-white rounded-br-sm'
                              : 'bg-elevated text-text-primary rounded-bl-sm'
                          }`}
                        >
                          {msg.type === 'text' && msg.content}
                          {msg.type === 'image' && (
                            <div className="flex flex-col gap-2">
                              <img src={api.defaults.baseURL?.replace('/api/v1', '') + msg.fileUrl} alt="attachment" className="max-w-[200px] rounded-lg cursor-pointer" onClick={() => window.open(api.defaults.baseURL?.replace('/api/v1', '') + msg.fileUrl)} />
                              {msg.fileName && <span className="text-[10px] opacity-70">{msg.fileName}</span>}
                            </div>
                          )}
                          {msg.type === 'file' && (
                            <a href={api.defaults.baseURL?.replace('/api/v1', '') + msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                              <FileIcon size={16} />
                              <span className="truncate max-w-[150px]">{msg.fileName}</span>
                            </a>
                          )}
                        </div>
                        <span className="text-xs text-text-muted px-1">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-white/06 relative">
              <AnimatePresence>
                {showEmojis && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-20 right-8 p-3 glass-card rounded-2xl border border-white/10 grid grid-cols-6 gap-2"
                  >
                    {['👍','👎','😄','🎉','❤️','🚀','👀','✅','🔥','👏','🤔','😅'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInput(prev => prev + emoji);
                          setShowEmojis(false);
                        }}
                        className="text-xl hover:scale-125 transition-transform p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-3 bg-elevated rounded-xl px-4 py-3 border border-white/10 focus-within:border-accent-electric/50 transition-colors">
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadFileMutation.isPending} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 disabled:opacity-50">
                  <Paperclip size={16} />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Message ${getRoomName(activeRoom)}...`}
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
                />
                <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
                  <Smile size={16} />
                </button>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || sendMutation.isPending}
                  className="p-1.5 rounded-lg bg-accent-electric text-white disabled:opacity-40 hover:bg-accent-violet transition-colors flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={newDmOpen} onClose={() => setNewDmOpen(false)} title="New direct message">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Choose someone in your organization</p>
          <select
            value={dmPeerId}
            onChange={(e) => setDmPeerId(e.target.value)}
            className="w-full bg-elevated border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Select a teammate…</option>
            {peers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.designation ? ` — ${p.designation}` : ''}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNewDmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!dmPeerId) {
                  toastHelpers.validationError('Please select a teammate');
                  return;
                }
                createDmMutation.mutate([dmPeerId]);
              }}
              disabled={createDmMutation.isPending}
            >
              Open chat
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={profileModalOpen} onClose={() => { setProfileModalOpen(false); setSelectedTeammate(null); }} title="Teammate Profile" size="sm">
        {selectedTeammate && (
          <div className="space-y-5 text-center p-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar src={selectedTeammate.avatar} name={selectedTeammate.name} size="xl" status="active" />
              <div>
                <h3 className="text-lg font-bold text-text-primary">{selectedTeammate.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">{selectedTeammate.designation || 'Teammate'}</p>
              </div>
              <Badge variant={selectedTeammate.role} size="xs" className="mt-1">
                {String(selectedTeammate.role).toUpperCase()}
              </Badge>
            </div>

            <div className="bg-white/02 border border-white/05 rounded-2xl p-4 text-left space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-text-muted uppercase block">Department</span>
                <span className="text-text-primary font-medium">{selectedTeammate.department || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase block">Company Email</span>
                <span className="text-text-primary font-medium block truncate" title={selectedTeammate.companyEmail}>
                  {selectedTeammate.companyEmail || 'N/A'}
                </span>
              </div>
              {selectedTeammate.phone && (
                <div>
                  <span className="text-[10px] text-text-muted uppercase block">Phone</span>
                  <span className="text-text-primary font-medium">{selectedTeammate.phone}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" fullWidth onClick={() => { setProfileModalOpen(false); setSelectedTeammate(null); }}>
                Close
              </Button>
              <Button fullWidth onClick={() => handleTeammateSelect(selectedTeammate)} loading={createDmMutation.isPending}>
                💬 Message
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
