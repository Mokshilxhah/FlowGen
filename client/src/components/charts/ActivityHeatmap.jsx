import { useMemo } from 'react';
import { format, eachDayOfInterval, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns';

const statusColors = {
  present: 'bg-accent-emerald',
  wfh: 'bg-accent-cyan',
  late: 'bg-accent-amber',
  absent: 'bg-white/5',
  leave: 'bg-accent-violet',
};

export default function ActivityHeatmap({ data = [], months = 3 }) {
  const days = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, months);
    return eachDayOfInterval({ start, end });
  }, [months]);

  const dataMap = useMemo(() => {
    const map = {};
    data.forEach(d => { map[d.date] = d.status; });
    return map;
  }, [data]);

  // Group by week
  const weeks = useMemo(() => {
    const result = [];
    let week = [];
    const firstDay = days[0];
    const startPad = getDay(firstDay);
    for (let i = 0; i < startPad; i++) week.push(null);
    days.forEach(day => {
      week.push(day);
      if (week.length === 7) { result.push(week); week = []; }
    });
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [days]);

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          <div className="w-4 h-3" />
          {dayLabels.map((d, i) => (
            <div key={i} className="w-4 h-3 text-xs text-text-muted flex items-center justify-center" style={{ fontSize: 9 }}>
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            <div className="h-3 text-xs text-text-muted" style={{ fontSize: 9 }}>
              {wi % 4 === 0 && week[1] ? format(week[1], 'MMM') : ''}
            </div>
            {week.map((day, di) => {
              if (!day) return <div key={di} className="w-3 h-3" />;
              const dateStr = format(day, 'yyyy-MM-dd');
              const status = dataMap[dateStr] || 'absent';
              return (
                <div
                  key={di}
                  title={`${dateStr}: ${status}`}
                  className={`w-3 h-3 rounded-sm ${statusColors[status] || 'bg-white/5'} cursor-pointer hover:opacity-80 transition-opacity`}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-xs text-text-muted capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
