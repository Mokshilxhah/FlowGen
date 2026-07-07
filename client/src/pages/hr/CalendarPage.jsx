import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const eventColors = {
  meeting: '#8B5CF6',
  deadline: '#F43F5E',
  project: '#06B6D4',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => (await api.get('/meetings')).data.data,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data.data,
  });

  const calendarEvents = useMemo(() => {
    const ev = meetings.map((m) => ({
      id: m.id,
      title: m.title,
      start: new Date(m.scheduledAt),
      end: new Date(new Date(m.scheduledAt).getTime() + (m.duration || 30) * 60000),
      type: 'meeting',
    }));
    projects.forEach((p) => {
      if (p.deadline) {
        const d = new Date(p.deadline);
        ev.push({
          id: `dl-${p.id}`,
          title: `Deadline: ${p.name}`,
          start: d,
          end: new Date(d.getTime() + 3600000),
          type: 'deadline',
        });
      }
    });
    return ev;
  }, [meetings, projects]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Calendar</h2>
          <p className="text-text-secondary text-sm mt-1">Meetings and project deadlines from the API</p>
        </div>
        <Button onClick={() => { toast('Use Meetings to schedule'); }}>+ Schedule</Button>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        {Object.entries(eventColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-text-muted capitalize">{type}</span>
          </div>
        ))}
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="p-4" style={{ height: 600 }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            view={currentView}
            onView={(newView) => setCurrentView(newView)}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: eventColors[event.type] || '#6366F1',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
              },
            })}
            selectable
            views={['month', 'week', 'day']}
            defaultView="month"
          />
        </div>
      </Card>
    </motion.div>
  );
}
