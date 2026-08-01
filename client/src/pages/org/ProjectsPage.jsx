import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Clock, CheckCircle, AlertCircle, BarChart3, Pencil, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Stat from '../../components/ui/Stat';
import { showToast, toastHelpers } from '../../utils/toast';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isOrgAdmin = user?.role === 'org_admin';
  const [createOpen, setCreateOpen] = useState(false);
  const [projectStep, setProjectStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    description: '',
    assignedHrId: '',
    priority: 'medium',
    startDate: '',
    deadline: '',
    techStack: '',
  });

  const resetForm = () => {
    setProjectStep(1);
    setForm({ name: '', description: '', assignedHrId: '', priority: 'medium', startDate: '', deadline: '', techStack: '' });
  };

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data.data,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/members')).data.data,
  });

  const hrUsers = useMemo(() => members.filter((m) => m.role === 'hr' && m.status === 'active'), [members]);
  const memberMap = useMemo(() => {
    const m = {};
    members.forEach((u) => { m[u.id] = u; });
    return m;
  }, [members]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      overdue: projects.filter((p) => p.deadline && new Date(p.deadline) < now && p.status !== 'completed').length,
    };
  }, [projects]);

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/projects', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'activity'] });
      toastHelpers.created('Project');
      setCreateOpen(false);
      resetForm();
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to create project'),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => api.patch(`/projects/${body.id}`, {
      ...body,
      techStack: typeof body.techStack === 'string' ? body.techStack.split(',').map(s => s.trim()).filter(Boolean) : body.techStack,
      startDate: body.startDate ? new Date(body.startDate).toISOString() : undefined,
      deadline: body.deadline ? new Date(body.deadline).toISOString() : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toastHelpers.updated('Project');
      setCreateOpen(false);
      resetForm();
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to update project'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'activity'] });
      showToast.success('Project deleted successfully!');
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to delete project'),
  });

  const submitCreate = () => {
    if (!form.name.trim() || !form.assignedHrId) {
      toastHelpers.validationError('Name and assigned HR are required');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (form.startDate && form.startDate < today) {
      toastHelpers.validationError('Start date cannot be in the past');
      return;
    }
    const techStack = form.techStack.split(',').map((s) => s.trim()).filter(Boolean);
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description || '',
      assignedHrId: form.assignedHrId,
      priority: form.priority,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      techStack,
      status: 'planning',
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Projects</h2>
          <p className="text-text-secondary text-sm mt-1">{isLoading ? 'Loading…' : 'Live projects from the API'}</p>
        </div>
        {isOrgAdmin && (
          <Button icon={<Plus size={16} />} onClick={() => { resetForm(); setCreateOpen(true); }}>New Project</Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Total Projects" value={stats.total} icon={<FolderKanban size={20} />} color="electric" />
        <Stat title="Active" value={stats.active} icon={<BarChart3 size={20} />} color="cyan" />
        <Stat title="Completed" value={stats.completed} icon={<CheckCircle size={20} />} color="emerald" />
        <Stat title="Overdue" value={stats.overdue} icon={<AlertCircle size={20} />} color="rose" />
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((proj, i) => {
          const hr = memberMap[proj.assignedHrId];
          const daysLeft = proj.deadline ? differenceInDays(new Date(proj.deadline), new Date()) : null;
          const ms = proj.milestones || [];
          return (
            <motion.div key={proj.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.01, y: -2 }}
              className="glass-card p-6 cursor-pointer hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary font-display truncate">{proj.name}</h3>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{proj.description}</p>
                </div>
                <Badge variant={proj.priority} size="xs" className="ml-2 flex-shrink-0">{proj.priority}</Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {(proj.techStack || []).slice(0, 3).map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs bg-white/5 text-text-muted rounded-full">{t}</span>
                ))}
              </div>

              <Progress value={proj.progress} showLabel label="Progress" className="mb-4" />

              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  {hr && (
                    <div className="flex items-center gap-1.5">
                      <img src={hr.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${hr.name}`} alt="" className="w-5 h-5 rounded-full" />
                      <span>{hr.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span className={daysLeft !== null && daysLeft < 7 && proj.status !== 'completed' ? 'text-accent-rose' : ''}>
                    {proj.status === 'completed' ? 'Completed' : daysLeft === null ? '—' : daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/06 flex items-center justify-between">
                <Badge variant={proj.status}>{String(proj.status || '').replace('_', ' ')}</Badge>
                <div className="flex items-center gap-2">
                  {isOrgAdmin && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({
                            id: proj.id,
                            name: proj.name,
                            description: proj.description,
                            assignedHrId: proj.assignedHrId,
                            priority: proj.priority,
                            startDate: proj.startDate ? format(new Date(proj.startDate), 'yyyy-MM-dd') : '',
                            deadline: proj.deadline ? format(new Date(proj.deadline), 'yyyy-MM-dd') : '',
                            techStack: (proj.techStack || []).join(', '),
                            status: proj.status
                          });
                          setProjectStep(1);
                          setCreateOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-accent-electric transition-colors"
                      >
                        <Pencil size={14} /> 
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete project "${proj.name}"?`)) {
                            deleteMutation.mutate(proj.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-accent-rose transition-colors"
                        title="Delete project"
                      >
                        <Trash2 size={14} /> 
                      </button>
                    </>
                  )}
                  <span className="text-xs text-text-muted">{ms.filter((m) => m.status === 'completed').length}/{ms.length || 0} milestones</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); resetForm(); }} title={form.id ? "Edit Project" : "Create New Project"} size="lg">
        <div className="p-6">
          {/* Phase Stepper */}
          <div className="flex items-center gap-2 mb-6">
            {['Phase 1: Basic Info', 'Phase 2: Assignee & Priority', 'Phase 3: Schedule & Tech'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= projectStep ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-semibold ${i + 1 === projectStep ? 'text-white' : 'text-slate-400'}`}>{s}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${i + 1 < projectStep ? 'bg-blue-600' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          {/* Phase 1: Basic Info */}
          {projectStep === 1 && (
            <div className="space-y-4">
              <Input label="Project Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mobile App Redesign" />
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/60 resize-none h-28"
                  placeholder="Describe the project goals, scope, and key deliverables..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button fullWidth onClick={() => {
                  if (!form.name.trim()) {
                    toastHelpers.validationError('Project Name is required');
                    return;
                  }
                  setProjectStep(2);
                }}>Continue to Phase 2</Button>
              </div>
            </div>
          )}

          {/* Phase 2: Assignee & Priority */}
          {projectStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Assigned HR Manager *</label>
                  <select value={form.assignedHrId} onChange={(e) => setForm((f) => ({ ...f, assignedHrId: e.target.value }))}
                    className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/60">
                    <option value="">Select HR</option>
                    {hrUsers.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/60">
                    {['low', 'medium', 'high', 'critical'].map((p) => (
                      <option key={p} value={p}>{p.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              {form.id && (
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/60">
                    {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setProjectStep(1)}>Back</Button>
                <Button fullWidth onClick={() => {
                  if (!form.assignedHrId) {
                    toastHelpers.validationError('Please select an assigned HR Manager');
                    return;
                  }
                  setProjectStep(3);
                }}>Continue to Phase 3</Button>
              </div>
            </div>
          )}

          {/* Phase 3: Schedule & Tech Stack */}
          {projectStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
                <Input
                  label="Deadline"
                  type="date"
                  min={form.startDate || new Date().toISOString().split('T')[0]}
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <Input label="Tech Stack (comma separated)" placeholder="React, Node.js, MongoDB" value={form.techStack} onChange={(e) => setForm((f) => ({ ...f, techStack: e.target.value }))} />
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setProjectStep(2)}>Back</Button>
                <Button 
                  fullWidth 
                  loading={createMutation.isPending || updateMutation.isPending} 
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    if (form.startDate && form.startDate < today) {
                      toastHelpers.validationError('Start date cannot be in the past');
                      return;
                    }
                    if (form.id) {
                      updateMutation.mutate(form);
                    } else {
                      submitCreate();
                    }
                  }}
                >
                  {form.id ? 'Save Changes' : 'Create Project'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
