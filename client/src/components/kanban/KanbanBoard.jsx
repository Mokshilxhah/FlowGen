import { useState, useEffect, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { showToast } from '../../utils/toast';

const COLUMNS = ['backlog', 'todo', 'in_progress', 'review', 'done'];

function groupTasks(tasks) {
  const cols = {};
  COLUMNS.forEach((col) => {
    cols[col] = [];
  });
  (tasks || []).forEach((t) => {
    const st = t.status && COLUMNS.includes(t.status) ? t.status : 'todo';
    cols[st].push(t);
  });
  return cols;
}

export default function KanbanBoard({ tasks, onTaskClick, onMoveTask, assigneeMap = {}, onAddTask }) {
  const [columns, setColumns] = useState(() => groupTasks(tasks));
  const [activeTask, setActiveTask] = useState(null);
  const dragSourceColRef = useRef(null);

  useEffect(() => {
    setColumns(groupTasks(tasks));
  }, [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const findColumn = (taskId) => COLUMNS.find((col) => columns[col].some((t) => t.id === taskId));

  const handleDragStart = ({ active }) => {
    const col = findColumn(active.id);
    dragSourceColRef.current = col || null;
    if (col) setActiveTask(columns[col].find((t) => t.id === active.id));
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeCol = findColumn(active.id);
    const overCol = COLUMNS.includes(over.id) ? over.id : findColumn(over.id);
    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns((prev) => {
      const activeItems = [...prev[activeCol]];
      const overItems = [...prev[overCol]];
      const activeIdx = activeItems.findIndex((t) => t.id === active.id);
      if (activeIdx < 0) return prev;
      const [moved] = activeItems.splice(activeIdx, 1);
      const updated = { ...moved, status: overCol };
      overItems.push(updated);
      return { ...prev, [activeCol]: activeItems, [overCol]: overItems };
    });
  };

  const handleDragEnd = ({ active, over }) => {
    const fromCol = dragSourceColRef.current;
    dragSourceColRef.current = null;
    setActiveTask(null);
    if (!over) return;
    const overCol = COLUMNS.includes(over.id) ? over.id : findColumn(over.id);
    if (!overCol) return;

    if (fromCol && overCol && fromCol !== overCol && onMoveTask) {
      onMoveTask(active.id, overCol);
      showToast.success(`Moved to ${overCol.replace('_', ' ')}`);
      return;
    }

    if (fromCol && overCol && fromCol === overCol) {
      setColumns((prev) => {
        const items = [...prev[fromCol]];
        const oldIdx = items.findIndex((t) => t.id === active.id);
        const newIdx = items.findIndex((t) => t.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          return { ...prev, [fromCol]: arrayMove(items, oldIdx, newIdx) };
        }
        return prev;
      });
    }
  };

  const overlayAssignee = useMemo(() => {
    if (!activeTask) return undefined;
    return assigneeMap[activeTask.assigneeId];
  }, [activeTask, assigneeMap]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col}
            id={col}
            tasks={columns[col]}
            onCardClick={onTaskClick}
            onAddTask={onAddTask}
            assigneeMap={assigneeMap}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} assignee={overlayAssignee} />}
      </DragOverlay>
    </DndContext>
  );
}
