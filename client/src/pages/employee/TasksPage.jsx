import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Kanban, List, Plus, Clock, CheckSquare, MessageSquare, X, Play, Square } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Progress from '../../components/ui/Progress';
import { format } from 'date-fns';
import { showToast } from '../../utils/toast';

export default function TasksPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [view, setView] = useState('kanban');
  const [selectedTask, setSelectedTask] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addStatus, setAddStatus] = useState('todo');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium',
    dueDate: '',
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => (await api.get('/tasks')).data.data,
    enabled: !!user?.id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data.data,
    enabled: !!user?.id,
  });

  /** Members list is org-admin only; assignee on “my tasks” is almost always you */
  const assigneeMap = useMemo(() => (user ? { [user.id]: user } : {}), [user]);

  const moveMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
    onError: (e) => {
      showToast.error(e.response?.data?.error || 'Could not move task');
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/tasks', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast.success('Task created');
      setAddOpen(false);
      setNewTask({ title: '', description: '', projectId: '', priority: 'medium', dueDate: '' });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to create task'),
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ taskId, sid }) => api.patch(`/tasks/${taskId}/subtasks/${sid}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] }),
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to update subtask'),
  });

  const addSubtaskMutation = useMutation({
    mutationFn: ({ taskId, title }) => api.post(`/tasks/${taskId}/subtasks`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      showToast.success('Subtask added');
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to add subtask'),
  });

  const commentMutation = useMutation({
    mutationFn: ({ taskId, text }) => api.post(`/tasks/${taskId}/comments`, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      showToast.success('Comment added');
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to add comment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/tasks/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      showToast.success('Task updated');
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      setSelectedTask(null);
      showToast.success('Task deleted');
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Delete failed'),
  });

  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const activeTask = useMemo(() => {
    if (!selectedTask) return null;
    return tasks.find((t) => t.id === selectedTask.id);
  }, [tasks, selectedTask]);

  const taskDetails = activeTask || selectedTask;

  const handleMoveTask = (taskId, newStatus) => {
    moveMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleAddTask = (columnStatus) => {
    setAddStatus(columnStatus || 'todo');
    const firstProject = projects[0]?.id || '';
    setNewTask((n) => ({ ...n, projectId: n.projectId || firstProject }));
    setAddOpen(true);
  };

  const submitNewTask = () => {
    if (!newTask.title.trim() || !newTask.projectId) {
      showToast.error('Title and project are required');
      return;
    }
    createMutation.mutate({
      projectId: newTask.projectId,
      title: newTask.title.trim(),
      description: newTask.description || '',
      assigneeId: user.id,
      status: addStatus,
      priority: newTask.priority,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">My Tasks</h2>
          <p className="text-text-secondary text-sm mt-1">
            {isLoading ? 'Loading…' : `${tasks.length} tasks`} · Live data · Drag cards or add with +
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-elevated rounded-xl border border-white/10">
            <button type="button" onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-colors ${view === 'kanban' ? 'bg-accent-electric/20 text-accent-electric' : 'text-text-muted hover:text-text-primary'}`}>
              <Kanban size={16} />
            </button>
            <button type="button" onClick={() => setView('list')} className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-accent-electric/20 text-accent-electric' : 'text-text-muted hover:text-text-primary'}`}>
              <List size={16} />
            </button>
          </div>
          <Button icon={<Plus size={16} />} size="sm" onClick={() => handleAddTask('todo')}>Add task</Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'kanban' ? (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KanbanBoard
              tasks={tasks}
              onTaskClick={setSelectedTask}
              onMoveTask={handleMoveTask}
              assigneeMap={assigneeMap}
              onAddTask={handleAddTask}
            />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/06">
                  {['Task', 'Status', 'Priority', 'Due Date', 'Progress'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/04">
                {tasks.map((task) => (
                  <tr key={task.id} onClick={() => setSelectedTask(task)} className="hover:bg-white/02 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-primary">{task.title}</p>
                      <div className="flex gap-1 mt-1">
                        {(task.tags || []).slice(0, 2).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 text-xs bg-white/5 text-text-muted rounded">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge variant={task.status === 'in_progress' ? 'cyan' : task.status === 'done' ? 'emerald' : 'default'} size="xs">{String(task.status || '').replace('_', ' ')}</Badge></td>
                    <td className="px-6 py-4"><Badge variant={task.priority} size="xs">{task.priority}</Badge></td>
                    <td className="px-6 py-4 text-sm text-text-muted">{task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}</td>
                    <td className="px-6 py-4 w-32">
                      <Progress value={(task.subtasks || []).filter((s) => s.isCompleted).length} max={Math.max((task.subtasks || []).length, 1)} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add task" size="md">
        <div className="p-6 space-y-4">
          <p className="text-xs text-text-muted">New task in column: <strong className="text-text-primary">{addStatus.replace('_', ' ')}</strong></p>
          <Input label="Title" required value={newTask.title} onChange={(e) => setNewTask((n) => ({ ...n, title: e.target.value }))} />
          <div>
            <label className="block text-xs font-medium mb-1.5 text-text-muted">Project</label>
            <select
              value={newTask.projectId}
              onChange={(e) => setNewTask((n) => ({ ...n, projectId: e.target.value }))}
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/50"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <Input label="Description" value={newTask.description} onChange={(e) => setNewTask((n) => ({ ...n, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-text-muted">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask((n) => ({ ...n, priority: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary"
              >
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <Input label="Due date" type="date" value={newTask.dueDate} onChange={(e) => setNewTask((n) => ({ ...n, dueDate: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={submitNewTask}>Create task</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedTask} onClose={() => { setSelectedTask(null); setCommentText(''); setNewSubtaskTitle(''); }} title={taskDetails?.title} size="lg">
        {selectedTask && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Badge variant={taskDetails.priority}>{taskDetails.priority}</Badge>
              <Badge variant={taskDetails.status === 'in_progress' ? 'cyan' : taskDetails.status === 'done' ? 'emerald' : 'default'}>
                {String(taskDetails.status || '').replace('_', ' ')}
              </Badge>
              <div className="ml-auto flex gap-2">
                {taskDetails.status !== 'done' && (
                  <Button size="xs" variant="success" onClick={() => handleMoveTask(taskDetails.id, 'done')}>Mark as Done</Button>
                )}
                <Button size="xs" variant="secondary" onClick={() => {
                  const title = prompt('Update Title', taskDetails.title);
                  if (title) updateMutation.mutate({ id: taskDetails.id, title });
                }}>Edit</Button>
                <Button size="xs" variant="ghost" className="text-accent-rose hover:bg-accent-rose/10" onClick={() => {
                  if (confirm('Delete this task?')) deleteMutation.mutate(taskDetails.id);
                }}>Delete</Button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
               Due: {taskDetails.dueDate ? format(new Date(taskDetails.dueDate), 'MMM d, yyyy') : '—'}
            </div>

            <p className="text-sm text-text-secondary">{taskDetails.description || 'No description'}</p>

            <div className="flex items-center gap-3 p-3 bg-elevated rounded-xl border border-white/10">
              <Clock size={16} className="text-accent-cyan" />
              <span className="text-sm text-text-secondary">
                Time logged: {taskDetails.loggedHours ?? 0}h / {taskDetails.estimatedHours ?? 0}h
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (timerRunning) {
                    try {
                      await api.post(`/tasks/${taskDetails.id}/time-log`, { action: 'add', hours: 1 });
                      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
                      showToast.success('Logged 1 hour to task');
                    } catch (err) {
                      showToast.error('Failed to log time');
                    }
                  }
                  setTimerRunning(!timerRunning);
                }}
                className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${timerRunning ? 'bg-accent-rose/20 text-accent-rose' : 'bg-accent-emerald/20 text-accent-emerald'}`}
              >
                {timerRunning ? <><Square size={12} /> Stop & Log</> : <><Play size={12} /> Start Timer</>}
              </button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <CheckSquare size={14} /> Subtasks ({(taskDetails.subtasks || []).filter((s) => s.isCompleted).length}/{(taskDetails.subtasks || []).length})
              </h4>
              <div className="space-y-2 mb-3">
                {(taskDetails.subtasks || []).map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/03">
                    <button type="button" className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${sub.isCompleted ? 'bg-accent-emerald border-accent-emerald' : 'border-white/20'}`}
                      onClick={() => toggleSubtaskMutation.mutate({ taskId: taskDetails.id, sid: sub.id })}>
                      {sub.isCompleted && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={`text-sm ${sub.isCompleted ? 'line-through text-text-muted' : 'text-text-secondary'}`}>{sub.title}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 bg-elevated border border-white/10 rounded-xl px-3 py-1.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                      addSubtaskMutation.mutate({ taskId: taskDetails.id, title: newSubtaskTitle.trim() });
                      setNewSubtaskTitle('');
                    }
                  }}
                />
                <Button size="xs" onClick={() => {
                  if (!newSubtaskTitle.trim()) return;
                  addSubtaskMutation.mutate({ taskId: taskDetails.id, title: newSubtaskTitle.trim() });
                  setNewSubtaskTitle('');
                }}>Add</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <MessageSquare size={14} /> Comments ({(taskDetails.comments || []).length})
              </h4>
              {(taskDetails.comments || []).map((c) => (
                <div key={c.id} className="p-3 bg-elevated rounded-xl mb-2">
                  <p className="text-xs text-text-muted mb-1">{c.createdAt ? format(new Date(c.createdAt), 'MMM d, h:mm a') : ''}</p>
                  <p className="text-sm text-text-secondary">{c.text}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-elevated border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/50" />
                <Button size="sm" onClick={() => { if (!commentText.trim()) return; commentMutation.mutate({ taskId: taskDetails.id, text: commentText.trim() }); setCommentText(''); }}>Post</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
