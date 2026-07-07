import { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Video, Clock, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { showToast, toastHelpers } from '../../utils/toast';

export default function MeetingsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    scheduledAt: '',
    duration: 30,
    platform: 'internal',
    agenda: '',
    participantIds: [],
  });

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => (await api.get('/meetings')).data.data,
  });

  const { data: peers = [] } = useQuery({
    queryKey: ['peers'],
    queryFn: async () => (await api.get('/user/peers')).data.data,
  });

  const members = useMemo(() => {
    if (!user) return peers;
    return [user, ...peers];
  }, [user, peers]);

  const userMap = useMemo(() => {
    const m = {};
    members.forEach((u) => { m[u.id] = u; });
    return m;
  }, [members]);

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/meetings', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toastHelpers.meetingScheduled();
      setCreateOpen(false);
      setForm({
        title: '',
        scheduledAt: '',
        duration: 30,
        platform: 'internal',
        agenda: '',
        participantIds: [],
      });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to schedule meeting'),
  });

  const upcoming = meetings.filter((m) => !isPast(new Date(m.scheduledAt)) && m.status !== 'cancelled');
  const past = meetings.filter((m) => isPast(new Date(m.scheduledAt)) || m.status === 'completed');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Meetings</h2>
          <p className="text-text-secondary text-sm mt-1">Schedule and manage team meetings</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Schedule meeting</Button>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Upcoming</h3>
        <div className="space-y-4">
          {upcoming.length === 0 && <p className="text-sm text-text-muted">No upcoming meetings.</p>}
          {upcoming.map((meeting, i) => {
            const organizer = userMap[meeting.organizerId];
            const participants = (meeting.participantIds || []).map((id) => userMap[id]).filter(Boolean);
            return (
              <motion.div key={meeting.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-violet/20 flex items-center justify-center flex-shrink-0">
                      <Video size={20} className="text-accent-violet" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{meeting.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(meeting.scheduledAt), 'MMM d, h:mm a')}</span>
                        <span>{meeting.duration} min</span>
                        <span className="capitalize">{meeting.platform}</span>
                      </div>
                      {organizer && <p className="text-xs text-text-muted mt-1">Organizer: {organizer.name}</p>}
                      {meeting.agenda && <p className="text-xs text-text-muted mt-2 line-clamp-2">{meeting.agenda}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-accent-amber font-medium">
                      {formatDistanceToNow(new Date(meeting.scheduledAt), { addSuffix: true })}
                    </span>
                    {meeting.meetingLink && (
                      <Button variant="primary" size="sm" icon={<ExternalLink size={14} />} onClick={() => window.open(meeting.meetingLink, '_blank')}>Join</Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-text-muted">Participants:</span>
                  <div className="flex -space-x-2">
                    {participants.slice(0, 5).map((p) => (
                      <Avatar key={p.id} src={p.avatar} name={p.name} size="xs" className="ring-2 ring-surface" />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Past</h3>
          <div className="space-y-3">
            {past.slice(0, 20).map((meeting) => (
              <div key={meeting.id} className="glass-card p-4 opacity-80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary text-sm">{meeting.title}</h4>
                    <p className="text-xs text-text-muted">{format(new Date(meeting.scheduledAt), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <Badge variant="default" size="xs">{meeting.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Schedule meeting" size="lg">
        <div className="p-6 space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date & time"
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            />
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Duration (minutes)</label>
              <select
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
              >
                {[15, 30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Platform</label>
            <select
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none"
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            >
              {['internal', 'zoom', 'teams', 'meet'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Participants</label>
            <select
              multiple
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm min-h-[88px]"
              value={form.participantIds}
              onChange={(e) => setForm((f) => ({ ...f, participantIds: [...e.target.selectedOptions].map((o) => o.value) }))}
            >
              {members.filter((m) => m.id !== user?.id).map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Agenda</label>
            <textarea
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary resize-none h-20 outline-none"
              value={form.agenda}
              onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
              placeholder="Agenda"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              fullWidth
              loading={createMutation.isPending}
              onClick={() => {
                if (!form.title.trim() || !form.scheduledAt) {
                  toastHelpers.validationError('Title and time required');
                  return;
                }
                const scheduledAt = new Date(form.scheduledAt).toISOString();
                createMutation.mutate({
                  title: form.title.trim(),
                  scheduledAt,
                  duration: form.duration,
                  platform: form.platform,
                  agenda: form.agenda,
                  participantIds: form.participantIds,
                });
              }}
            >
              Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
