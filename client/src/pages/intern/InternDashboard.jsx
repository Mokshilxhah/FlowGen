import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, ClipboardList, Flame, Star, GraduationCap, CheckSquare } from 'lucide-react';
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

export default function InternDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: learning } = useQuery({
    queryKey: ['learning', 'progress'],
    queryFn: async () => (await api.get('/learning/progress')).data.data,
  });

  const { data: mentorRes } = useQuery({
    queryKey: ['learning', 'mentor'],
    queryFn: async () => (await api.get('/learning/mentor')).data.data,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => (await api.get('/tasks')).data.data,
    enabled: !!user?.id,
  });

  const myTasks = useMemo(() => tasks.filter((t) => t.assigneeId === user?.id), [tasks, user?.id]);
  const mentor = mentorRes?.mentor;

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

  const activeCourses = (learning?.courses || []).filter((c) => c.status === 'in_progress').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1), rgba(99,102,241,0.05))', border: '1px solid rgba(16,185,129,0.25)', borderLeft: '4px solid #10B981' }}>
          <h2 className="text-2xl font-bold font-display" style={{ color: '#F1F5F9' }}>{greeting}, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="mt-1 text-sm" style={{ color: '#94A3B8' }}>
            Streak: <span style={{ color: '#F59E0B', fontWeight: 700 }}>{learning?.streak?.current ?? 0}</span> days
          </p>
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
        <Stat title="Tasks" value={myTasks.length} icon={<ClipboardList size={20} />} color="electric" />
        <Stat title="Active courses" value={activeCourses} icon={<BookOpen size={20} />} color="cyan" />
        <Stat title="Streak" value={learning?.streak?.current ?? 0} icon={<Flame size={20} />} color="amber" />
        <Stat title="Skills" value={(learning?.skills || []).length} icon={<Star size={20} />} color="emerald" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold mb-4 font-display flex items-center gap-2" style={{ color: '#F1F5F9' }}>
            <BookOpen size={16} style={{ color: '#06B6D4' }} /> Learning
          </h3>
          <div className="space-y-5">
            {(learning?.courses || []).length === 0 ? (
              <p className="text-sm" style={{ color: '#475569' }}>No courses in your profile yet.</p>
            ) : (
              (learning?.courses || []).map((course, i) => {
                const colors = ['electric', 'cyan', 'violet'];
                return (
                  <div key={course.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{course.title}</p>
                      <Badge variant={course.status === 'completed' ? 'emerald' : 'cyan'} size="xs">{(course.status || '').replace('_', ' ')}</Badge>
                    </div>
                    <Progress value={course.completionPercent ?? 0} showLabel size="sm" color={colors[i % 3]} />
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-4 font-display flex items-center gap-2" style={{ color: '#F1F5F9' }}>
            <GraduationCap size={16} style={{ color: '#8B5CF6' }} /> Mentor
          </h3>
          {mentor ? (
            <div>
              <div className="flex items-center gap-4 mb-5 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <Avatar src={mentor.avatar} name={mentor.name} size="lg" ring />
                <div>
                  <h4 className="font-bold" style={{ color: '#F1F5F9' }}>{mentor.name}</h4>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>{mentor.designation}</p>
                </div>
              </div>
              <button
                type="button"
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.25)' }}
                onClick={() => navigate('/intern/chat')}
              >
                Open chat
              </button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#475569' }}>No mentor assigned yet. HR can link a mentor to your learning profile in the database.</p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold mb-4 font-display" style={{ color: '#F1F5F9' }}>My tasks</h3>
          <div className="mb-6 p-4 rounded-xl bg-accent-electric/5 border border-accent-electric/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted">Overall Completion</span>
              <span className="text-xs font-bold text-accent-electric">
                {myTasks.length ? Math.round((myTasks.filter(t => t.status === 'done').length / myTasks.length) * 100) : 0}%
              </span>
            </div>
            <Progress 
              value={myTasks.filter(t => t.status === 'done').length} 
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

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent-amber/10 text-accent-amber">
              <ClipboardList size={16} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Task Tip</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Click the checkmark icon to finish a task instantly. This updates your momentum streak and helps your mentor track your progress.
          </p>
        </Card>
      </div>
    </motion.div>
  );
}
