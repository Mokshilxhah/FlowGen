import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import KanbanCard from './KanbanCard';

const columnConfig = {
  backlog: { label: 'Backlog', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', emoji: '📋' },
  todo: { label: 'To Do', color: '#6366F1', bg: 'rgba(99,102,241,0.08)', emoji: '📌' },
  in_progress: { label: 'In Progress', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)', emoji: '⚡' },
  review: { label: 'Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', emoji: '👀' },
  done: { label: 'Done', color: '#10B981', bg: 'rgba(16,185,129,0.08)', emoji: '✅' },
};

export default function KanbanColumn({ id, tasks, onCardClick, onAddTask, assigneeMap = {} }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const cfg = columnConfig[id] || { label: id, color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', emoji: '📋' };

  return (
    <div className="flex flex-col flex-shrink-0" style={{ minWidth: 280, width: 280 }}>
      <div className="flex items-center justify-between p-3 mb-3 rounded-xl"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderTop: `3px solid ${cfg.color}` }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
          <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}20`, color: cfg.color }}>{tasks.length}</span>
        </div>
        <button type="button" onClick={() => onAddTask?.(id)}
          className="p-1 rounded-lg transition-all"
          style={{ color: '#475569' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${cfg.color}20`; e.currentTarget.style.color = cfg.color; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
          <Plus size={14} />
        </button>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-2 min-h-20 p-2 rounded-xl transition-all"
        style={{ background: isOver ? `${cfg.color}08` : 'transparent', border: isOver ? `1px dashed ${cfg.color}40` : '1px solid transparent' }}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              assignee={assigneeMap[task.assigneeId]}
              onClick={() => onCardClick?.(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs rounded-xl"
            style={{ color: '#2D3748', border: `1px dashed ${cfg.color}20` }}>
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
