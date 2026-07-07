import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react';
import AreaChart from '../../components/charts/AreaChart';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import LineChart from '../../components/charts/LineChart';
import { api } from '../../lib/api';

const cardStyle = (color) => ({
  background: `${color}08`,
  border: `1px solid ${color}20`,
  borderRadius: 20,
  padding: 24,
});

export default function AnalyticsPage() {
  const { data: a, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data.data,
  });

  const weeklyData = (a?.weeklyTaskCompletion || []).map((w) => ({
    name: w.week,
    completed: w.completed,
    assigned: w.assigned,
  }));
  const monthlyData = (a?.monthlyHours || []).map((m) => ({
    name: m.month,
    hours: m.hours,
    target: m.target,
  }));
  const teamData = (a?.teamPerformance || []).map((t) => ({
    name: t.name?.split?.(' ')?.[0] || t.name,
    tasks: t.tasks,
    score: t.score,
  }));
  const statusDonut = Object.entries(a?.tasksByStatus || {}).map(([name, value], i) => ({
    name,
    value,
    color: ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][i % 5],
  }));

  if (isLoading) {
    return (
      <div className="p-8 text-text-muted text-sm">Loading analytics from your organization data…</div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderLeft: '4px solid #6366F1' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
            <BarChart3 size={20} color="#6366F1" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display" style={{ color: '#F1F5F9' }}>Analytics</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Live metrics from MongoDB — tasks, projects, and teams</p>
          </div>
        </div>
      </div>

      {statusDonut.some((d) => d.value > 0) && (
        <div style={{ background: 'rgba(26,34,54,0.7)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, padding: 24 }}>
          <h3 className="text-base font-semibold font-display mb-4" style={{ color: '#F1F5F9' }}>Tasks by status</h3>
          <DonutChart data={statusDonut} height={200} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div style={cardStyle('#6366F1')}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} color="#6366F1" />
            <h3 className="text-base font-semibold font-display" style={{ color: '#F1F5F9' }}>Weekly task completion</h3>
          </div>
          <AreaChart
            data={weeklyData}
            dataKeys={[
              { key: 'completed', color: '#6366F1', label: 'Completed' },
              { key: 'assigned', color: '#06B6D4', label: 'Assigned' },
            ]}
            height={220}
          />
        </div>

        <div style={cardStyle('#10B981')}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} color="#10B981" />
            <h3 className="text-base font-semibold font-display" style={{ color: '#F1F5F9' }}>Monthly hours logged</h3>
          </div>
          <AreaChart
            data={monthlyData}
            dataKeys={[
              { key: 'hours', color: '#10B981', label: 'Logged' },
              { key: 'target', color: '#475569', label: 'Target' },
            ]}
            height={220}
          />
        </div>

        <div style={cardStyle('#8B5CF6')}>
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} color="#8B5CF6" />
            <h3 className="text-base font-semibold font-display" style={{ color: '#F1F5F9' }}>Tasks by team</h3>
          </div>
          <BarChart data={teamData} dataKey="tasks" color="#8B5CF6" height={220} />
        </div>

        <div style={cardStyle('#F59E0B')}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} color="#F59E0B" />
            <h3 className="text-base font-semibold font-display" style={{ color: '#F1F5F9' }}>Sprint burndown (snapshot)</h3>
          </div>
          <LineChart
            data={(a?.sprintBurndown || []).map((s) => ({ name: s.day.replace('Day ', 'D'), ...s }))}
            lines={[
              { key: 'ideal', color: '#475569', label: 'Ideal' },
              { key: 'actual', color: '#F59E0B', label: 'Actual' },
            ]}
            height={220}
          />
        </div>
      </div>

      <div style={{ background: 'rgba(26,34,54,0.7)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 20, padding: 24 }}>
        <h3 className="text-base font-semibold font-display mb-5" style={{ color: '#F1F5F9' }}>Project progress</h3>
        <div className="space-y-4">
          {(a?.projectProgress || []).length === 0 ? (
            <p className="text-sm text-text-muted">No projects yet — create one under Projects.</p>
          ) : (
            (a?.projectProgress || []).map((p, i) => (
              <div key={p.name + i} className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <span className="text-sm w-52 truncate" style={{ color: '#94A3B8' }}>{p.name}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: p.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${p.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.08 }}
                  />
                </div>
                <span className="text-sm font-bold w-10 text-right" style={{ color: p.color }}>{p.progress}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
