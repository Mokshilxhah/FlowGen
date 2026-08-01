import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, FolderKanban, ClipboardList, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import Stat from '../../components/ui/Stat';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';
import Avatar from '../../components/ui/Avatar';

export default function OrgDashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['org', 'stats'],
    queryFn: async () => (await api.get('/org/stats')).data.data,
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const totalMembers = stats?.members?.totalHeadcount ?? stats?.members?.total ?? 0;
  const activeProjects = stats?.projects?.active ?? 0;
  const pendingInvites = stats?.pendingInvites ?? 0;
  const openTasks = orgTasks.filter((t) => t.status !== 'done').length;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Modern Glassmorphic Hero Banner */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-transparent border border-blue-500/20 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
          {greeting}, <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span> 👋
        </h2>
      </div>

      {/* Metric Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat title="Total Members" value={totalMembers} icon={<Users size={16} />} color="electric" compact />
        <Stat title="Active Projects" value={activeProjects} icon={<FolderKanban size={16} />} color="cyan" compact />
        <Stat title="Open Tasks" value={openTasks} icon={<ClipboardList size={16} />} color="emerald" compact />
        <Stat title="Pending Invites" value={pendingInvites} icon={<UserPlus size={16} />} color="amber" compact />
      </div>

      {/* Dark Slate Project Table */}
      <Card padding={false}>
        <div className="p-5 border-b border-white/10">
          <h3 className="text-base font-semibold font-display text-white">Project Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {['Project', 'Assigned HR', 'Status', 'Progress', 'Deadline'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => {
                const hr = userMap[proj.assignedHrId];
                return (
                  <tr key={proj.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-white">{proj.name}</p>
                      <p className="text-xs mt-0.5 text-slate-400">{(proj.techStack || []).slice(0, 2).join(', ')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={hr?.avatar} name={hr?.name} size="xs" />
                        <span className="text-sm text-slate-300 font-medium">{hr?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><Badge variant={proj.status}>{String(proj.status || '').replace('_', ' ')}</Badge></td>
                    <td className="px-5 py-4 w-40"><Progress value={proj.progress} size="sm" showLabel /></td>
                    <td className="px-5 py-4 text-sm text-slate-400">{proj.deadline ? format(new Date(proj.deadline), 'MMM d, yyyy') : '—'}</td>
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
