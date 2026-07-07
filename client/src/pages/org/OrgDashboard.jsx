import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, FolderKanban, ClipboardList, UserPlus, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Stat from '../../components/ui/Stat';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';
import Avatar from '../../components/ui/Avatar';
import DonutChart from '../../components/charts/DonutChart';
import { formatRelative } from '../../utils/formatters';

const activityDotColors = {
  'accent-emerald': '#10B981',
  'accent-electric': '#6366F1',
  'accent-cyan': '#06B6D4',
  'accent-violet': '#8B5CF6',
  'accent-amber': '#F59E0B',
};

export default function OrgDashboard() {
  const { user, organization } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['org', 'stats'],
    queryFn: async () => (await api.get('/org/stats')).data.data,
    refetchOnWindowFocus: true,
  });

  const { data: activityPage } = useQuery({
    queryKey: ['org', 'activity'],
    queryFn: async () => (await api.get('/org/activity?limit=20')).data.data,
    refetchOnWindowFocus: true,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data.data,
    refetchOnWindowFocus: true,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/members')).data.data,
    refetchOnWindowFocus: true,
  });

  const { data: orgTasks = [] } = useQuery({
    queryKey: ['tasks', 'org'],
    queryFn: async () => (await api.get('/tasks')).data.data,
    refetchOnWindowFocus: true,
  });

  const userMap = useMemo(() => {
    const m = {};
    members.forEach((u) => {
      m[u.id] = u;
    });
    return m;
  }, [members]);

  const memberBreakdownData = useMemo(() => {
    const m = stats?.members;
    if (!m) {
      return [
        { name: 'HR', value: 0, color: '#8B5CF6' },
        { name: 'Employees', value: 0, color: '#6366F1' },
        { name: 'Interns', value: 0, color: '#06B6D4' },
      ];
    }
    return [
      { name: 'HR', value: m.hr, color: '#8B5CF6' },
      { name: 'Employees', value: m.employees, color: '#6366F1' },
      { name: 'Interns', value: m.interns, color: '#06B6D4' },
    ];
  }, [stats]);

  const feed = activityPage?.items || [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const orgName = organization?.name || stats?.orgName || 'Your organization';
  const planLabel = (organization?.plan || stats?.plan || 'free').toString();
  /** Headcount includes org admins (totalHeadcount); total is role buckets only */
  const totalMembers = stats?.members?.totalHeadcount ?? stats?.members?.total ?? 0;
  const activeProjects = stats?.projects?.active ?? 0;
  const pendingInvites = stats?.pendingInvites ?? 0;
  const openTasks = orgTasks.filter((t) => t.status !== 'done').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(99,102,241,0.25)', borderLeft: '4px solid #6366F1' }}>
        <h2 className="text-2xl font-bold font-display" style={{ color: '#F1F5F9' }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="mt-1 text-sm" style={{ color: '#94A3B8' }}>{format(new Date(), 'EEEE, MMMM d, yyyy')} · {orgName}</p>
        <div className="flex items-center gap-4 mt-3">
          {[
            { label: `${totalMembers} Members`, color: '#6366F1' },
            { label: `${activeProjects} Active Projects`, color: '#06B6D4' },
            { label: `${planLabel} Plan`, color: '#10B981' },
          ].map((b) => (
            <span key={b.label} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${b.color}20`, color: b.color, border: `1px solid ${b.color}40` }}>{b.label}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Total Members" value={totalMembers} icon={<Users size={20} />} color="electric" />
        <Stat title="Active Projects" value={activeProjects} icon={<FolderKanban size={20} />} color="cyan" />
        <Stat title="Open Tasks" value={openTasks} icon={<ClipboardList size={20} />} color="emerald" />
        <Stat title="Pending Invites" value={pendingInvites} icon={<UserPlus size={20} />} color="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-base font-semibold mb-4 font-display" style={{ color: '#F1F5F9' }}>Member Breakdown</h3>
          <DonutChart data={memberBreakdownData} height={180} />
          <div className="grid grid-cols-3 gap-2 mt-3">
            {memberBreakdownData.map((d) => (
              <div key={d.name} className="text-center p-2 rounded-xl" style={{ background: `${d.color}12`, border: `1px solid ${d.color}25` }}>
                <p className="text-lg font-bold" style={{ color: d.color }}>{d.value}</p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>{d.name}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold font-display flex items-center gap-2" style={{ color: '#F1F5F9' }}>
              <Activity size={16} style={{ color: '#6366F1' }} /> Live Activity
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {feed.length === 0 && (
              <p className="text-sm" style={{ color: '#475569' }}>No recent activity yet.</p>
            )}
            {feed.map((item, i) => {
              const actor = item.userId ? userMap[item.userId] : null;
              const dotColor = activityDotColors[item.color] || '#6366F1';
              const ts = item.createdAt || item.timestamp;
              return (
                <motion.div key={item.id + String(i)} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: '#94A3B8' }}>{item.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{ts ? formatRelative(ts) : ''}</p>
                  </div>
                  {actor && <Avatar src={actor.avatar} name={actor.name} size="xs" />}
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="p-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
          <h3 className="text-base font-semibold font-display" style={{ color: '#F1F5F9' }}>Project Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                {['Project', 'Assigned HR', 'Status', 'Progress', 'Deadline'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((proj, i) => {
                const hr = userMap[proj.assignedHrId];
                return (
                  <tr key={proj.id} style={{ borderBottom: i < projects.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>{proj.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{(proj.techStack || []).slice(0, 2).join(', ')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={hr?.avatar} name={hr?.name} size="xs" />
                        <span className="text-sm" style={{ color: '#94A3B8' }}>{hr?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><Badge variant={proj.status}>{String(proj.status || '').replace('_', ' ')}</Badge></td>
                    <td className="px-5 py-4 w-40"><Progress value={proj.progress} size="sm" showLabel /></td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#475569' }}>{proj.deadline ? format(new Date(proj.deadline), 'MMM d, yyyy') : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
