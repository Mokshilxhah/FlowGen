import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, CheckSquare, GripVertical } from 'lucide-react';
import { format } from 'date-fns';

const priorityConfig = {
  critical: { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.4)', label: '🔴 Critical' },
  high: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', label: '🟡 High' },
  medium: { color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.4)', label: '🔵 Medium' },
  low: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', label: '⚪ Low' },
};

const tagColors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E'];

export default function KanbanCard({ task, onClick, assignee }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const completedSubs = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubs = task.subtasks?.length || 0;
  const pc = priorityConfig[task.priority] || priorityConfig.low;
  const initial = assignee?.name?.charAt(0) || '?';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.15 }}
        onClick={onClick}
        style={{
          background: isDragging ? 'rgba(99,102,241,0.15)' : 'rgba(26,34,54,0.9)',
          border: `1px solid ${isDragging ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
          borderLeft: `3px solid ${pc.color}`,
          borderRadius: 14,
          padding: 14,
          cursor: 'pointer',
          boxShadow: isDragging ? '0 10px 30px rgba(99,102,241,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
        }}>
        <div className="flex items-start gap-2 mb-2">
          <div {...attributes} {...listeners} style={{ color: '#2D3748', cursor: 'grab', flexShrink: 0, marginTop: 2 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#2D3748'; }}>
            <GripVertical size={13} />
          </div>
          <p className="flex-1 text-sm font-semibold leading-snug" style={{ color: '#F1F5F9' }}>{task.title}</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, fontSize: 10 }}>
            {task.priority}
          </span>
        </div>

        {task.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3 ml-5">
            {task.tags.slice(0, 3).map((tag, i) => (
              <span key={tag} style={{ padding: '2px 7px', fontSize: 10, borderRadius: 6, background: `${tagColors[i % tagColors.length]}15`, color: tagColors[i % tagColors.length], border: `1px solid ${tagColors[i % tagColors.length]}25`, fontWeight: 600 }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between ml-5">
          <div className="flex items-center gap-3" style={{ color: '#475569' }}>
            {totalSubs > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <CheckSquare size={11} style={{ color: completedSubs === totalSubs ? '#10B981' : '#475569' }} />
                <span style={{ color: completedSubs === totalSubs ? '#10B981' : '#475569' }}>{completedSubs}/{totalSubs}</span>
              </span>
            )}
            {task.comments?.length > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <MessageSquare size={11} style={{ color: '#8B5CF6' }} />
                <span style={{ color: '#8B5CF6' }}>{task.comments.length}</span>
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs">
                <Calendar size={11} style={{ color: '#F59E0B' }} />
                <span style={{ color: '#F59E0B' }}>{format(new Date(task.dueDate), 'MMM d')}</span>
              </span>
            )}
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', fontSize: 9 }}
            title={assignee?.name || 'Assignee'}>
            {assignee?.avatar ? (
              <img src={assignee.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
