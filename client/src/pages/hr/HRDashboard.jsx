import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, ClipboardList, Video, UserCheck, Plus } from 'lucide-react';
import WorkSessionTimer from '../../components/ui/WorkSessionTimer';
import { format, isToday } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Stat from '../../components/ui/Stat';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Progress from '../../components/ui/Progress';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import LineChart from '../../components/charts/LineChart';
import ActivityHeatmap from '../../components/charts/ActivityHeatmap';

const healthFromProgress = (p) => {
  if (p >= 70) return { key: 'green', color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'Healthy' };
  if (p >= 35) return { key: 'amber', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: 'At risk' };
  return { key: 'red', color: '#F43F5E', bg: 'rgba(244,63,94,0.15)', label: 'Behind' };
};

export default function HRDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '', projectId: '', priority: 'medium' });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data.data,
  });

  const createTaskMutation = useMutation({
    mutationFn: (body) => api.post('/tasks', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task assigned successfully');
      setAssignOpen(false);
      setNewTask({ title: '', description: '', assigneeId: '', projectId: '', priority: 'medium' });
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to assign task'),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/members')).data.data,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/tasks')).data.data,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => (await api.get('/meetings')).data.data,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => (await api.get('/teams')).data.data,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data.data,
  });

  const { data: attendanceRows = [] } = useQuery({
    queryKey: ['attendance', 'list'],
    queryFn: async () => (await api.get('/attendance')).data.data,
  });

  const userMap = useMemo(() => {
    const m = {};
    members.forEach((u) => { m[u.id] = u; });
    return m;
  }, [members]);

  const teamMembers = members.filter((m) => m.status === 'active').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;
  const meetingsToday = meetings.filter((m) => m.status === 'scheduled' && isToday(new Date(m.scheduledAt))).length;

  const presentDays = attendanceRows.filter((r) => r.status === 'present').length;
  const attendanceRate = attendanceRows.length ? Math.round((presentDays / attendanceRows.length) * 100) : 0;

  const todayMeetings = meetings.filter((m) => m.status === 'scheduled' && isToday(new Date(m.scheduledAt))).slice(0, 5);

  const heatmapData = useMemo(() => attendanceRows.map((r) => ({
    date: format(new Date(r.date), 'yyyy-MM-dd'),
    status: r.status || 'present',
  })), [attendanceRows]);

  const teamsWithProgress = useMemo(() => teams.map((team) => {
    const mids = new Set((team.memberIds || []).map((id) => id.toString()));
    const teamTasks = tasks.filter((t) => mids.has(t.assigneeId?.toString()));
    const done = teamTasks.filter((t) => t.status === 'done').length;
    const pct = teamTasks.length ? Math.round((done / teamTasks.length) * 100) : 0;
    return { ...team, completionPercent: pct };
  }), [teams, tasks]);

  const burndown = analytics?.sprintBurndown || [];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Modern Purple Accent Hero Block */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-purple-600/15 via-indigo-600/10 to-transparent border border-purple-500/20 backdrop-blur-xl shadow-lg shadow-black/20 text-white">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            {greeting}, <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <WorkSessionTimer />
        </div>
      </div>

      {/* Metric Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Team members" value={teamMembers} icon={<Users size={18} />} color="violet" />
        <Stat title="Open tasks" value={openTasks} icon={<ClipboardList size={18} />} color="electric" />
        <Stat title="Meetings today" value={meetingsToday} icon={<Video size={18} />} color="cyan" />
        <Stat title="Attendance rate" value={attendanceRate} suffix="%" icon={<UserCheck size={18} />} color="emerald" />
      </div>

      {/* Task Assignment Container */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl bg-slate-800/40 border border-blue-500/20 backdrop-blur-xl shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ClipboardList size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Daily Task Assignment</h3>
            <p className="text-xs text-slate-400">Assign work directly to any member in the organization</p>
          </div>
        </div>
        <Button onClick={() => setAssignOpen(true)}>Assign New Task</Button>
      </div>

      {/* Equal 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold mb-4 font-display text-white">Teams</h3>
          <div className="space-y-4">
            {teamsWithProgress.length === 0 ? (
              <p className="text-sm text-text-muted">No teams yet — create one under Teams.</p>
            ) : (
              teamsWithProgress.map((team) => {
                const leader = team.leaderId ? userMap[team.leaderId] : null;
                const hc = healthFromProgress(team.completionPercent ?? 0);
                return (
                  <div key={team.id} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm" style={{ color: '#F1F5F9' }}>{team.name}</h4>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{(team.memberIds || []).length} members</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: hc.bg, color: hc.color }}>
                        ● {hc.label}
                      </span>
                    </div>
                    <Progress value={team.completionPercent ?? 0} max={100} size="sm" showLabel label="Progress" color={hc.key === 'green' ? 'emerald' : hc.key === 'amber' ? 'amber' : 'rose'} />
                    {leader && (
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar src={leader.avatar} name={leader.name} size="xs" />
                        <span className="text-xs" style={{ color: '#475569' }}>Lead: {leader.name}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-4 font-display" style={{ color: '#F1F5F9' }}>Sprint burndown</h3>
          {burndown.length === 0 ? (
            <p className="text-sm text-text-muted">Not enough task data yet.</p>
          ) : (
            <LineChart
              data={burndown.map((s) => ({ name: s.day.replace('Day ', 'D'), ...s }))}
              lines={[
                { key: 'ideal', color: '#475569', label: 'Ideal' },
                { key: 'actual', color: '#6366F1', label: 'Actual' },
              ]}
              height={220}
            />
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-base font-semibold mb-4 font-display" style={{ color: '#F1F5F9' }}>Attendance (recorded days)</h3>
        {heatmapData.length === 0 ? (
          <p className="text-sm text-text-muted">No attendance rows yet — team check-ins will appear here.</p>
        ) : (
          <ActivityHeatmap data={heatmapData} months={3} />
        )}
      </Card>

      <Card>
        <h3 className="text-base font-semibold mb-4 font-display" style={{ color: '#F1F5F9' }}>Today&apos;s schedule</h3>
        {todayMeetings.length === 0 ? (
          <p className="text-sm" style={{ color: '#475569' }}>No meetings scheduled today.</p>
        ) : (
          <div className="space-y-3">
            {todayMeetings.map((meeting, i) => {
              const colors = ['#8B5CF6', '#06B6D4', '#10B981'];
              return (
                <div key={meeting.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: colors[i % 3] }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{meeting.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{format(new Date(meeting.scheduledAt), 'h:mm a')} · {meeting.duration}min · {meeting.platform}</p>
                  </div>
                  <Badge variant="violet" size="xs">{meeting.status}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign New Task">
        <div className="p-6 space-y-4">
          <Input label="Task Title" placeholder="e.g. Complete daily report" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
          <Input label="Description" placeholder="Details about the task..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Assign To</label>
              <select className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary"
                value={newTask.assigneeId} onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}>
                <option value="">Select Member</option>
                {members.filter(m => m.role !== 'org_admin').map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Project</label>
              <select className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary"
                value={newTask.projectId} onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}>
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Priority</label>
            <select className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary"
              value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
              {['low', 'medium', 'high', 'critical'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button fullWidth loading={createTaskMutation.isPending} 
              onClick={() => {
                if (!newTask.title || !newTask.assigneeId || !newTask.projectId) return toast.error('Please fill all fields');
                createTaskMutation.mutate(newTask);
              }}>
              Assign Task
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
