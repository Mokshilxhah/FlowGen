import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ClipboardList, CheckSquare, CheckCircle, Clock } from 'lucide-react';
import { showToast } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Stat from '../../components/ui/Stat';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Progress from '../../components/ui/Progress';
import Button from '../../components/ui/Button';
import WorkSessionTimer from '../../components/ui/WorkSessionTimer';

export default function InternDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => (await api.get('/tasks')).data.data,
    enabled: !!user?.id,
  });

  const myTasks = useMemo(() => tasks.filter((t) => t.assigneeId === user?.id), [tasks, user?.id]);
  const completedTasksCount = useMemo(() => myTasks.filter((t) => t.status === 'done').length, [myTasks]);
  const pendingTasksCount = useMemo(() => myTasks.filter((t) => t.status !== 'done').length, [myTasks]);

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => (await api.get('/attendance')).data.data,
  });

  const isAlreadyCheckedIn = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.some(a => a.userId === user?.id && a.date.startsWith(today));
  }, [attendance, user?.id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative overflow-hidden flex-1 p-6 rounded-2xl bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-transparent border border-emerald-500/20 backdrop-blur-xl shadow-lg shadow-black/20 text-white flex items-center">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between flex-1 flex-wrap gap-3">
            <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
              {greeting}, <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span> 👋
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Total Tasks" value={myTasks.length} icon={<ClipboardList size={20} />} color="electric" />
        <Stat title="Pending Tasks" value={pendingTasksCount} icon={<Clock size={20} />} color="amber" />
        <Stat title="Completed Tasks" value={completedTasksCount} icon={<CheckCircle size={20} />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold font-display" style={{ color: '#F1F5F9' }}>My Tasks Overview</h3>
            <Button size="xs" variant="secondary" onClick={() => navigate('/intern/tasks')}>View All Tasks</Button>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-text-muted">Overall Completion</span>
              <span className="text-xs font-bold text-accent-electric">
                {myTasks.length ? Math.round((completedTasksCount / myTasks.length) * 100) : 0}%
              </span>
            </div>
            <Progress 
              value={completedTasksCount} 
              max={Math.max(myTasks.length, 1)} 
              size="sm" 
              color="electric" 
            />
          </div>
          
          {myTasks.length === 0 ? (
            <p className="text-sm" style={{ color: '#475569' }}>No tasks assigned.</p>
          ) : (
            <div className="space-y-2">
              {myTasks.slice(0, 8).map((task) => {
                const statusColors = { done: '#10B981', in_progress: '#06B6D4', todo: '#6366F1', backlog: '#475569' };
                return (
                  <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColors[task.status] || '#475569' }} />
                    <p className="flex-1 text-sm font-medium" style={{ color: '#F1F5F9' }}>{task.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority} size="xs">{task.priority}</Badge>
                      {task.status !== 'done' && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.patch(`/tasks/${task.id}/status`, { status: 'done' });
                              queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
                              showToast.success('Task finished!');
                            } catch (e) {
                              showToast.error(e.response?.data?.error || 'Failed to finish task');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 transition-all"
                        >
                          <CheckSquare size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
