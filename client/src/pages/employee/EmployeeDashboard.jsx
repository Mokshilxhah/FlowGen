import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, Flame, Trophy, Calendar, Sparkles, CheckSquare } from 'lucide-react';
import { format, startOfWeek, isAfter } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Stat from '../../components/ui/Stat';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import WorkSessionTimer from '../../components/ui/WorkSessionTimer';
import Progress from '../../components/ui/Progress';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { showToast } from '../../utils/toast';


export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => (await api.get('/tasks')).data.data,
    enabled: !!user?.id,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => (await api.get('/meetings')).data.data,
  });

  const { data: peers = [] } = useQuery({
    queryKey: ['user', 'peers'],
    queryFn: async () => (await api.get('/user/peers')).data.data,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => (await api.get('/attendance')).data.data,
  });

  const isAlreadyCheckedIn = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.some(a => a.userId === user?.id && a.date.startsWith(today));
  }, [attendance, user?.id]);

  const myTasks = useMemo(() => tasks.filter((t) => t.assigneeId === user?.id), [tasks, user?.id]);

  const stats = useMemo(() => {
    const doneThisWeek = myTasks.filter(
      (t) => t.status === 'done' && t.updatedAt && isAfter(new Date(t.updatedAt), weekStart)
    ).length;
    const hours = Math.round(myTasks.reduce((s, t) => s + (Number(t.loggedHours) || 0), 0) * 10) / 10;
    const pending = myTasks.filter((t) => t.status !== 'done').length;
    return { doneThisWeek, hours, pending, streak: doneThisWeek > 0 ? Math.min(7, doneThisWeek + 2) : 0 };
  }, [myTasks, weekStart]);

  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress').slice(0, 3);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayMeetings = meetings.filter((m) => {
    const d = new Date(m.scheduledAt);
    return m.status === 'scheduled' && d >= todayStart && d <= todayEnd;
  }).slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (isLoading) {
    return <div className="p-8 text-text-muted text-sm">Loading your workspace…</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative overflow-hidden flex-1 p-6 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-transparent border border-blue-500/20 backdrop-blur-xl shadow-lg shadow-black/20 text-white flex items-center">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between flex-1 flex-wrap gap-3">
            <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
              {greeting}, <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span> 👋
            </h2>
            <WorkSessionTimer />
          </div>
        </div>

        <Card className="md:w-72 flex flex-col justify-center items-center text-center p-6 border-accent-emerald/20 bg-accent-emerald/5">
          <p className="text-xs text-text-muted mb-2 uppercase tracking-widest font-bold">Attendance</p>
          <Button
            fullWidth
            variant={isAlreadyCheckedIn ? 'secondary' : 'success'}
            disabled={isAlreadyCheckedIn}
            onClick={async () => {
              try {
                await api.post('/attendance');
                queryClient.invalidateQueries({ queryKey: ['attendance'] });
                showToast.success('Successfully checked in for today!');
              } catch (e) {
                showToast.error(e.response?.data?.error || 'Check-in failed');
              }
            }}
          >
            {isAlreadyCheckedIn ? 'Present Today' : 'Daily Check-in'}
          </Button>
          <p className="text-[10px] text-text-muted mt-2">
            {isAlreadyCheckedIn ? 'Recorded' : `Mark your presence for ${format(new Date(), 'MMM d')}`}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Done this week" value={stats.doneThisWeek} icon={<ClipboardList size={20} />} color="electric" />
        <Stat title="Hours logged" value={stats.hours} icon={<Clock size={20} />} color="cyan" />
        <Stat title="Momentum" value={stats.streak} icon={<Flame size={20} />} color="amber" />
        <Stat title="Active tasks" value={stats.pending} icon={<Trophy size={20} />} color="emerald" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold mb-4 font-display" style={{ color: '#F1F5F9' }}>In progress</h3>
          <div className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <p className="text-sm" style={{ color: '#475569' }}>No tasks in progress. Move a card on the Tasks board.</p>
            ) : (
              inProgressTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{task.title}</p>
                      <Badge variant={task.priority} size="xs" className="mt-1">{task.priority}</Badge>
                    </div>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await api.patch(`/tasks/${task.id}/status`, { status: 'done' });
                          queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
                          showToast.success('Task marked as Done!');
                        } catch (e) {
                          showToast.error('Failed to update task');
                        }
                      }}
                      className="p-2 rounded-lg bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 transition-all"
                      title="Quick Finish"
                    >
                      <CheckSquare size={16} />
                    </button>
                  </div>
                  <Progress
                    value={(task.subtasks || []).filter((s) => s.isCompleted).length}
                    max={Math.max((task.subtasks || []).length, 1)}
                    size="xs"
                    label={`${(task.subtasks || []).filter((s) => s.isCompleted).length}/${(task.subtasks || []).length || 1} subtasks`}
                    showLabel
                  />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-4 font-display flex items-center gap-2" style={{ color: '#F1F5F9' }}>
            <Trophy size={16} style={{ color: '#F59E0B' }} /> Teammates
          </h3>
          <div className="space-y-2">
            {peers.slice(0, 6).map((member, i) => (
              <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black w-5 text-center" style={{ color: '#475569' }}>#{i + 1}</span>
                <Avatar src={member.avatar} name={member.name} size="sm" />
                <span className="flex-1 text-sm font-medium" style={{ color: '#F1F5F9' }}>{member.name}</span>
              </div>
            ))}
            {peers.length === 0 && <p className="text-xs text-text-muted">No other members in your org yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold mb-4 font-display flex items-center gap-2" style={{ color: '#F1F5F9' }}>
            <Calendar size={16} style={{ color: '#8B5CF6' }} /> Today&apos;s schedule
          </h3>
          {todayMeetings.length === 0 ? (
            <p className="text-sm" style={{ color: '#475569' }}>No meetings today.</p>
          ) : (
            <div className="space-y-3">
              {todayMeetings.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: '#8B5CF6' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{m.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{format(new Date(m.scheduledAt), 'h:mm a')} · {m.duration}min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <h3 className="text-base font-semibold font-display" style={{ color: '#F1F5F9' }}>Tip</h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
            Use <span style={{ color: '#6366F1', fontWeight: 600 }}>Tasks</span> to add work, drag cards across columns, and keep priorities aligned with your projects — all saved to the server.
          </p>
        </Card>
      </div>
    </motion.div>
  );
}
