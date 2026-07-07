import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../lib/api';
import ActivityHeatmap from '../../components/charts/ActivityHeatmap';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import { showToast, toastHelpers } from '../../utils/toast';

export default function AttendancePage() {
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/members')).data.data,
  });

  const { data: rows = [] } = useQuery({
    queryKey: ['attendance', 'list'],
    queryFn: async () => (await api.get('/attendance')).data.data,
  });

  const heatmapData = useMemo(() => rows.map((r) => ({
    date: format(new Date(r.date), 'yyyy-MM-dd'),
    status: r.status || 'present',
  })), [rows]);

  const summary = useMemo(() => {
    const byUser = {};
    rows.forEach((r) => {
      const uid = r.userId?.toString?.() || r.userId;
      if (!uid) return;
      if (!byUser[uid]) {
        byUser[uid] = { present: 0, absent: 0, late: 0, wfh: 0, leave: 0, half_day: 0 };
      }
      const st = r.status || 'present';
      if (st in byUser[uid]) byUser[uid][st] += 1;
    });
    return members
      .filter((m) => ['employee', 'intern'].includes(m.role))
      .map((m) => ({
        ...m,
        ...(byUser[m.id] || { present: 0, absent: 0, late: 0, wfh: 0, leave: 0, half_day: 0 }),
      }));
  }, [members, rows]);

  const handleExport = () => {
    if (summary.length === 0) {
      showToast.error('No data to export');
      return;
    }
    const headers = ['Name', 'Role', 'Designation', 'Present', 'Absent', 'Late', 'WFH', 'Leave', 'Half Day'];
    const csvRows = summary.map(m => [
      `"${m.name || ''}"`,
      `"${m.role || ''}"`,
      `"${m.designation || ''}"`,
      m.present,
      m.absent,
      m.late,
      m.wfh,
      m.leave,
      m.half_day
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast.success('Attendance exported successfully!');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Attendance</h2>
          <p className="text-text-secondary text-sm mt-1">Recorded check-ins from the database</p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport}>
          Export
        </Button>
      </div>

      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-4 font-display">Org heatmap</h3>
        {heatmapData.length === 0 ? (
          <p className="text-sm text-text-muted">No attendance rows yet.</p>
        ) : (
          <ActivityHeatmap data={heatmapData} months={3} />
        )}
      </Card>

      <Card padding={false}>
        <div className="p-6 border-b border-white/06">
          <h3 className="text-base font-semibold text-text-primary font-display">By member</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/06">
                {['Member', 'Present', 'Absent', 'Late', 'WFH', 'Leave', 'Half'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/04">
              {summary.map((m) => (
                <tr key={m.id} className="hover:bg-white/02 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={m.avatar} name={m.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{m.name}</p>
                        <p className="text-xs text-text-muted">{m.designation || m.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-accent-emerald font-medium">{m.present}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-accent-rose font-medium">{m.absent}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-accent-amber font-medium">{m.late}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-accent-cyan font-medium">{m.wfh}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-text-muted">{m.leave}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-text-muted">{m.half_day}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {summary.length === 0 && (
            <p className="p-6 text-sm text-text-muted">No employees/interns listed.</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
