import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Bell, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { showToast, toastHelpers } from '../../utils/toast';

const priorityIcons = {
  critical: <AlertTriangle size={14} className="text-accent-rose" />,
  high: <AlertTriangle size={14} className="text-accent-amber" />,
  medium: <Bell size={14} className="text-accent-cyan" />,
  low: <Bell size={14} className="text-text-muted" />,
};

export default function AlertsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    priority: 'medium',
    recipientType: 'all',
    teamIds: [],
    userIds: [],
    scheduledAt: '',
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await api.get('/alerts')).data.data,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => (await api.get('/teams')).data.data,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['peers'],
    queryFn: async () => (await api.get('/user/peers')).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/alerts', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showToast.success('Alert sent successfully!');
      setCreateOpen(false);
      setForm({
        title: '',
        message: '',
        priority: 'medium',
        recipientType: 'all',
        teamIds: [],
        userIds: [],
        scheduledAt: '',
      });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to send alert'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showToast.success('Alert deleted successfully!');
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to delete alert'),
  });

  const recipientLabel = (a) => {
    const t = a.recipients?.type;
    if (t === 'all') return 'All members';
    if (t === 'team') return `Teams (${(a.recipients?.teamIds || []).length})`;
    return `Individuals (${(a.recipients?.userIds || []).length})`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Alerts</h2>
          <p className="text-text-secondary text-sm mt-1">Priority broadcasts (stored in MongoDB)</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create alert</Button>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      <div className="space-y-4">
        {alerts.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{priorityIcons[alert.priority] || priorityIcons.medium}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-text-primary">{alert.title}</h4>
                    <Badge variant={alert.priority} size="xs">{alert.priority}</Badge>
                  </div>
                  <p className="text-sm text-text-secondary">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span>To: {recipientLabel(alert)}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {alert.sentAt ? format(new Date(alert.sentAt), 'MMM d, h:mm a') : 'Scheduled'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={alert.status === 'sent' ? 'active' : 'amber'} size="xs">{alert.status}</Badge>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this alert?')) {
                        deleteMutation.mutate(alert.id);
                      }
                    }}
                    className="p-1 rounded-lg text-text-muted hover:text-accent-rose hover:bg-white/10 transition-all"
                    title="Delete Alert"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {alert.status === 'sent' && (
                  <div className="text-xs text-text-muted">
                    <span className="text-accent-emerald">{alert.deliveryStats?.read ?? 0}</span>
                    /{alert.deliveryStats?.sent ?? 0} notified
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {alerts.length === 0 && !isLoading && (
          <Card><p className="text-sm text-text-muted">No alerts yet — create one to notify the org.</p></Card>
        )}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create alert" size="md">
        <div className="p-6 space-y-4">
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Message</label>
            <textarea
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary resize-none h-24 outline-none"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Priority</label>
              <select
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm outline-none"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {['low', 'medium', 'high', 'critical'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Recipients</label>
              <select
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm outline-none"
                value={form.recipientType}
                onChange={(e) => setForm((f) => ({ ...f, recipientType: e.target.value }))}
              >
                <option value="all">All members</option>
                <option value="team">Specific teams</option>
                <option value="individual">Specific people</option>
              </select>
            </div>
          </div>
          {form.recipientType === 'team' && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Teams</label>
              <select
                multiple
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm min-h-[80px]"
                value={form.teamIds}
                onChange={(e) => setForm((f) => ({ ...f, teamIds: [...e.target.selectedOptions].map((o) => o.value) }))}
              >
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {form.recipientType === 'individual' && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">People</label>
              <select
                multiple
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm min-h-[80px]"
                value={form.userIds}
                onChange={(e) => setForm((f) => ({ ...f, userIds: [...e.target.selectedOptions].map((o) => o.value) }))}
              >
                {members.filter((m) => m.id !== user?.id).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
          )}
          <Input
            label="Schedule (optional, ISO local)"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              fullWidth
              loading={createMutation.isPending}
              onClick={() => {
                if (!form.title.trim() || !form.message.trim()) {
                  toastHelpers.validationError('Title and message are required');
                  return;
                }
                const recipients = { type: form.recipientType };
                if (form.recipientType === 'team') recipients.teamIds = form.teamIds;
                if (form.recipientType === 'individual') recipients.userIds = form.userIds;
                const body = {
                  title: form.title.trim(),
                  message: form.message.trim(),
                  priority: form.priority,
                  recipients,
                };
                if (form.scheduledAt) body.scheduledAt = new Date(form.scheduledAt).toISOString();
                createMutation.mutate(body);
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
