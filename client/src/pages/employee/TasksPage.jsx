import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, CheckSquare, MessageSquare, Play, Square, Check, Circle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { format } from 'date-fns';
import { showToast } from '../../utils/toast';

export default function TasksPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const resetUnreadCount = useNotificationStore((state) => state.resetUnreadCount);

  useEffect(() => {
    resetUnreadCount('tasks');
    api.patch('/notifications/read-all').catch(() => {});
  }, [resetUnreadCount]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
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

  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== 'done' && t.status !== 'completed'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'done' || t.status === 'completed'), [tasks]);

  const moveMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      resetUnreadCount('tasks');
    },
    onError: (e) => {
      showToast.error(e.response?.data?.error || 'Could not update task');
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/tasks', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast.success('Task added to Section 1 (Active Tasks)');
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

  const handleAddTask = () => {
    const firstProject = projects[0]?.id || '';
    setNewTask((n) => ({ ...n, projectId: n.projectId || firstProject }));
    setAddOpen(true);
  };

  const submitNewTask = () => {
    if (!newTask.title.trim()) {
      showToast.error('Task title is required');
      return;
    }
    const targetProject = newTask.projectId || (projects[0]?.id || undefined);
    createMutation.mutate({
      projectId: targetProject,
      title: newTask.title.trim(),
      description: newTask.description || '',
      assigneeId: user.id,
      status: 'todo',
      priority: newTask.priority,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary flex items-center gap-3">
            <span>My Tasks</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-sans">
              {activeTasks.length} Active
            </span>
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {isLoading ? 'Loading tasks…' : `${activeTasks.length} pending · ${completedTasks.length} completed`}
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={handleAddTask}>
          Add Task Manually
        </Button>
      </div>

      {/* Horizontal 2-Section Side-by-Side Columns */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ── SECTION 1: ASSIGNED TASKS ── */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-text-primary">Assigned Tasks</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {activeTasks.length} Active
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="py-10 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              <p className="text-sm text-text-muted">No active tasks right now.</p>
              <button
                type="button"
                onClick={handleAddTask}
                className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
              >
                + Add a task manually
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/80 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Circular Checkbox */}
                      <button
                        type="button"
                        title="Click to mark as completed"
                        onClick={() => moveMutation.mutate({ id: task.id, status: 'done' })}
                        className="w-6 h-6 rounded-full border-2 border-slate-600 group-hover:border-emerald-400 group-hover:bg-emerald-500/20 flex items-center justify-center transition-all flex-shrink-0"
                      >
                        <Check size={12} className="text-transparent group-hover:text-emerald-400 transition-colors" />
                      </button>

                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTask(task)}>
                        <p className="text-sm font-semibold text-text-primary group-hover:text-blue-400 transition-colors truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {project && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                              {project.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                          {(task.subtasks || []).length > 0 && (
                            <span className="text-[10px] text-slate-400">
                              Subtasks: {(task.subtasks || []).filter((s) => s.isCompleted).length}/{(task.subtasks || []).length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={task.priority} size="xs">{task.priority}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECTION 2: COMPLETED TASKS ── */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-text-primary">Completed Tasks</h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {completedTasks.length} Completed
            </span>
          </div>

          {completedTasks.length === 0 ? (
            <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              <p className="text-sm text-text-muted">No completed tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-800/60 rounded-xl opacity-80 hover:opacity-100 transition-all"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Completed Circle */}
                    <button
                      type="button"
                      title="Click to move back to Assigned Tasks"
                      onClick={() => moveMutation.mutate({ id: task.id, status: 'todo' })}
                      className="w-6 h-6 rounded-full bg-emerald-500 border border-emerald-400 text-white flex items-center justify-center flex-shrink-0 shadow-sm hover:bg-emerald-600 transition-colors"
                    >
                      <Check size={13} className="text-white font-bold" />
                    </button>

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <p className="text-sm font-medium text-slate-400 line-through truncate">
                        {task.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="emerald" size="xs">Done</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Task Manually */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Task Manually to Section 1" size="md">
        <div className="p-6 space-y-4">
          <Input label="Task Title *" required placeholder="e.g. Complete quarterly documentation" value={newTask.title} onChange={(e) => setNewTask((n) => ({ ...n, title: e.target.value }))} />
          <div>
            <label className="block text-xs font-medium mb-1.5 text-text-muted">Project</label>
            <select
              value={newTask.projectId}
              onChange={(e) => setNewTask((n) => ({ ...n, projectId: e.target.value }))}
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/50"
            >
              <option value="">General Task (Or select project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-text-muted">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask((n) => ({ ...n, description: e.target.value }))}
              placeholder="Add details about what needs to be done..."
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/50 resize-none h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-text-muted">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask((n) => ({ ...n, priority: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary"
              >
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <Input label="Due Date" type="date" value={newTask.dueDate} onChange={(e) => setNewTask((n) => ({ ...n, dueDate: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={submitNewTask}>Add to Section 1</Button>
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
                  <Button size="xs" variant="success" onClick={() => moveMutation.mutate({ id: taskDetails.id, status: 'done' })}>Mark as Done</Button>
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
