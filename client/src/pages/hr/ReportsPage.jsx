import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DonutChart from '../../components/charts/DonutChart';
import { showToast, toastHelpers } from '../../utils/toast';

const tabs = ['Team performance', 'Project progress', 'Individuals'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(0);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data.data,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data.data,
  });

  const teamData = (analytics?.teamPerformance || []).map((t) => ({
    name: (t.name || '?').split(' ')[0],
    value: t.tasks,
  }));

  const weekly = (analytics?.weeklyTaskCompletion || []).map((w) => ({
    name: w.week,
    completed: w.completed,
    assigned: w.assigned,
  }));

  const statusDonut = Object.entries(analytics?.tasksByStatus || {}).map(([name, value], i) => ({
    name,
    value,
    color: ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][i % 5],
  }));

  const projectBars = projects.slice(0, 12).map((p) => ({
    name: p.name?.slice(0, 18) || 'Project',
    value: p.progress ?? 0,
  }));

  const handleExportCSV = () => {
    if (!analytics) {
      showToast.error('Data not loaded yet');
      return;
    }
    
    let csv = "--- Team Performance ---\nName,Tasks,Score\n";
    if (analytics.teamPerformance) {
      csv += analytics.teamPerformance.map(t => `"${t.name}",${t.tasks},${t.score}`).join('\n');
    }
    
    csv += "\n\n--- Weekly Output ---\nWeek,Completed,Assigned\n";
    if (analytics.weeklyTaskCompletion) {
      csv += analytics.weeklyTaskCompletion.map(w => `"${w.week}",${w.completed},${w.assigned}`).join('\n');
    }

    csv += "\n\n--- Projects ---\nName,Progress\n";
    if (projects && projects.length) {
      csv += projects.map(p => `"${p.name}",${p.progress || 0}`).join('\n');
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'flowgen_analytics_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Reports</h2>
          <p className="text-text-secondary text-sm mt-1">Live data from your organization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download size={16} />} size="sm" onClick={handleExportPDF}>Export PDF</Button>
          <Button variant="secondary" icon={<FileText size={16} />} size="sm" onClick={handleExportCSV}>Export CSV</Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading analytics…</p>}

      <div className="flex gap-1 p-1 bg-elevated rounded-xl border border-white/10 w-fit flex-wrap">
        {tabs.map((tab, i) => (
          <button key={tab} type="button" onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-accent-electric text-white' : 'text-text-muted hover:text-text-primary'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4 font-display">Tasks by team member bucket</h3>
            <BarChart data={teamData} dataKey="value" color="#6366F1" height={220} />
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4 font-display">Tasks by status</h3>
            {statusDonut.some((d) => d.value > 0) ? (
              <DonutChart data={statusDonut} height={220} />
            ) : (
              <p className="text-sm text-text-muted">No tasks yet.</p>
            )}
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="text-base font-semibold text-text-primary mb-4 font-display">Weekly output</h3>
            <LineChart
              data={weekly}
              lines={[
                { key: 'completed', color: '#10B981', label: 'Completed' },
                { key: 'assigned', color: '#6366F1', label: 'New' },
              ]}
              height={200}
            />
          </Card>
        </div>
      )}

      {activeTab === 1 && (
        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-4 font-display">Project progress %</h3>
          {projectBars.length === 0 ? (
            <p className="text-sm text-text-muted">No projects.</p>
          ) : (
            <BarChart data={projectBars} dataKey="value" color="#8B5CF6" height={250} />
          )}
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-4 font-display">Team scores (derived)</h3>
          <div className="space-y-4">
            {(analytics?.teamPerformance || []).map((member, i) => (
              <div key={member.name + i} className="flex items-center gap-4">
                <span className="text-sm text-text-secondary w-40 truncate">{member.name}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent-electric to-accent-violet"
                    initial={{ width: 0 }}
                    animate={{ width: `${member.score}%` }}
                    transition={{ duration: 1, delay: i * 0.08 }}
                  />
                </div>
                <span className="text-sm font-semibold text-text-primary w-10">{member.score}</span>
              </div>
            ))}
            {(analytics?.teamPerformance || []).length === 0 && (
              <p className="text-sm text-text-muted">Create teams and tasks to see scores.</p>
            )}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
