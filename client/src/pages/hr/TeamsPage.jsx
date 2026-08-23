import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Users, Crown, ChevronDown, ChevronUp, Pencil, Search, Check, X, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Progress from '../../components/ui/Progress';
import { showToast, toastHelpers } from '../../utils/toast';
import { useAuthStore } from '../../store/authStore';

const TYPES = ['frontend', 'backend', 'design', 'qa', 'devops', 'other'];

function MemberSelector({ members, selectedIds, onChange, leaderId }) {
  const [search, setSearch] = useState('');

  const eligibleMembers = useMemo(() => {
    return members.filter((m) => m.role !== 'org_admin' && m.id !== leaderId);
  }, [members, leaderId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return eligibleMembers;
    const q = search.toLowerCase();
    return eligibleMembers.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q)
    );
  }, [eligibleMembers, search]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-muted font-medium block">
          Team Members ({selectedIds.length} selected)
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(eligibleMembers.map((m) => m.id))}
            className="text-[11px] text-accent-electric hover:underline font-medium"
          >
            Select All
          </button>
          <span className="text-xs text-white/20">|</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-elevated/40 border border-white/05 rounded-xl max-h-[85px] overflow-y-auto">
          {selectedIds.map((id) => {
            const m = members.find((u) => u.id === id);
            if (!m) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-accent-electric/15 border border-accent-electric/30 text-xs text-text-primary"
              >
                <Avatar src={m.avatar} name={m.name} size="xs" />
                <span className="truncate max-w-[120px] font-medium">{m.name}</span>
                <button
                  type="button"
                  onClick={() => toggleSelect(id)}
                  className="hover:text-rose-400 text-text-muted transition-colors ml-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search member by name, role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-elevated border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-accent-electric/60"
        />
      </div>

      <div className="border border-white/10 rounded-xl bg-elevated/60 max-h-[160px] overflow-y-auto divide-y divide-white/05">
        {filtered.length === 0 ? (
          <p className="text-xs text-text-muted p-4 text-center">No members available</p>
        ) : (
          filtered.map((m) => {
            const isSelected = selectedIds.includes(m.id);
            return (
              <div
                key={m.id}
                onClick={() => toggleSelect(m.id)}
                className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors hover:bg-white/05 ${
                  isSelected ? 'bg-accent-electric/10' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-accent-electric border-accent-electric text-white'
                        : 'border-white/30 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} />}
                  </div>
                  <Avatar src={m.avatar} name={m.name} size="xs" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{m.name}</p>
                    <p className="text-[10px] text-text-muted truncate">
                      {m.designation || m.department || m.role}
                    </p>
                  </div>
                </div>
                <Badge variant={m.role} size="xs">
                  {m.role}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({ name: '', type: 'other', leaderId: '', memberIds: [], projectIds: [] });
  const [editForm, setEditForm] = useState({ name: '', type: 'other', leaderId: '', memberIds: [], projectIds: [] });
  const [activeTab, setActiveTab] = useState('teams');
  const [selectedMentors, setSelectedMentors] = useState({});

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => (await api.get('/teams')).data.data,
  });

  const user = useAuthStore((state) => state.user);

  const { data: peers = [] } = useQuery({
    queryKey: ['peers'],
    queryFn: async () => (await api.get('/user/peers')).data.data,
  });

  const { data: orgMembers = [] } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/members')).data.data,
  });

  const members = useMemo(() => {
    const map = new Map();
    (orgMembers || []).forEach((m) => { if (m.id) map.set(m.id, m); });
    (peers || []).forEach((p) => { if (p.id && !map.has(p.id)) map.set(p.id, p); });
    if (user && user.id && !map.has(user.id)) map.set(user.id, user);
    return Array.from(map.values());
  }, [user, peers, orgMembers]);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/tasks')).data.data,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data.data,
  });

  const userMap = useMemo(() => {
    const m = {};
    members.forEach((u) => { m[u.id] = u; });
    return m;
  }, [members]);

  const teamsEnriched = useMemo(() => teams.map((team) => {
    const mids = new Set((team.memberIds || []).map((id) => id.toString()));
    const teamTasks = tasks.filter((t) => mids.has(t.assigneeId?.toString()));
    const done = teamTasks.filter((t) => t.status === 'done').length;
    const pct = teamTasks.length ? Math.round((done / teamTasks.length) * 100) : 0;
    return { ...team, completionPercent: pct };
  }), [teams, tasks]);

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/teams', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toastHelpers.created('Team');
      setCreateOpen(false);
      setForm({ name: '', type: 'other', leaderId: '', memberIds: [], projectIds: [] });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to create team'),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => api.patch(`/teams/${editingTeam?.id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toastHelpers.updated('Team');
      setEditOpen(false);
      setEditingTeam(null);
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to update team'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toastHelpers.deleted('Team');
      setDeleteOpen(false);
      setDeletingTeam(null);
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to delete team'),
  });

  const handleEditClick = (team) => {
    setEditingTeam(team);
    setEditForm({
      name: team.name || '',
      type: team.type || 'other',
      leaderId: team.leaderId || '',
      memberIds: team.memberIds || [],
      projectIds: team.projectIds || [],
    });
    setEditOpen(true);
  };

  const assignMentorMutation = useMutation({
    mutationFn: (body) => api.patch('/learning/mentor/assign', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
      showToast.success('Mentor assigned successfully!');
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to assign mentor'),
  });

  const [selectedInternForCourse, setSelectedInternForCourse] = useState(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', provider: '', totalHours: '', skillTagsString: '' });

  const assignCourseMutation = useMutation({
    mutationFn: (body) => api.post('/learning/courses', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
      showToast.success('Learning course assigned successfully!');
      setCourseModalOpen(false);
      setSelectedInternForCourse(null);
      setCourseForm({ title: '', provider: '', totalHours: '', skillTagsString: '' });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to assign course'),
  });

  const handleAssignCourse = () => {
    if (!courseForm.title.trim() || !courseForm.provider.trim()) {
      showToast.error('Title and provider are required');
      return;
    }
    const total = Number(courseForm.totalHours) || 0;
    if (total <= 0) {
      showToast.error('Total hours must be greater than 0');
      return;
    }
    const tags = courseForm.skillTagsString
      ? courseForm.skillTagsString.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    
    assignCourseMutation.mutate({
      internId: selectedInternForCourse.id,
      title: courseForm.title.trim(),
      provider: courseForm.provider.trim(),
      totalHours: total,
      skillTags: tags,
    });
  };

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Teams</h2>
          <p className="text-text-secondary text-sm mt-1">Manage organization teams</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create team</Button>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading teams…</p>}

      <div className="space-y-4">
        {teamsEnriched.map((team, i) => {
          
          const memberUsers = (team.memberIds || []).map((id) => userMap[id]).filter(Boolean);
          const isExpanded = expanded[team.id];
          const health = team.completionPercent >= 70 ? 'green' : team.completionPercent >= 35 ? 'amber' : 'red';

          return (
            <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Users size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary font-display">{team.name}</h3>
                      <p className="text-sm text-text-muted capitalize">{team.type} · {memberUsers.length} employees</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={health === 'green' ? 'emerald' : health === 'amber' ? 'amber' : 'rose'}>
                      {health}
                    </Badge>
                    <button type="button" onClick={() => handleEditClick(team)} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors" title="Edit Team">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => { setDeletingTeam(team); setDeleteOpen(true); }} className="p-2 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete Team">
                      <Trash2 size={14} />
                    </button>
                    <button type="button" onClick={() => toggleExpand(team.id)} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-text-muted">Projects</p>
                    <p className="text-sm font-medium text-text-primary">{(team.projectIds || []).length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Employees</p>
                    <p className="text-sm font-medium text-text-primary">{memberUsers.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Done ratio</p>
                    <p className="text-sm font-medium text-text-primary">{team.completionPercent}%</p>
                  </div>
                </div>

                <Progress value={team.completionPercent} max={100} size="sm" className="mt-3" />
              </div>

              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-white/06 p-6">
                  <h4 className="text-sm font-semibold text-text-secondary mb-3">Employees</h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {memberUsers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-elevated rounded-xl">
                        <Avatar src={member.avatar} name={member.name} size="sm" status="active" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                            {team.leaderId === member.id && <Crown size={12} className="text-accent-amber flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-text-muted truncate">{member.designation || member.role}</p>
                        </div>
                        <Badge variant={member.role} size="xs">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create team" size="md">
        <div className="p-6 space-y-4">
          <Input label="Team name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Type</label>
            <select
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/60"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Leader</label>
            <select
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/60"
              value={form.leaderId}
              onChange={(e) => setForm((f) => ({ ...f, leaderId: e.target.value }))}
            >
              <option value="">Optional</option>
              {members.filter((m) => m.role !== 'org_admin').map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
          <MemberSelector
            members={members}
            selectedIds={form.memberIds}
            onChange={(selected) => setForm((f) => ({ ...f, memberIds: selected }))}
            leaderId={form.leaderId}
          />
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Projects (hold Ctrl to multi-select)</label>
            <select
              multiple
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none min-h-[80px]"
              value={form.projectIds}
              onChange={(e) => {
                const selected = [...e.target.selectedOptions].map((o) => o.value);
                setForm((f) => ({ ...f, projectIds: selected }));
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              fullWidth
              loading={createMutation.isPending}
              onClick={() => {
                if (!form.name.trim()) {
                  toastHelpers.validationError('Team name is required');
                  return;
                }
                createMutation.mutate({
                  name: form.name.trim(),
                  type: form.type,
                  leaderId: form.leaderId || undefined,
                  memberIds: form.memberIds,
                  projectIds: form.projectIds,
                });
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit team" size="md">
        <div className="p-6 space-y-4">
          <Input label="Team name" required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Type</label>
            <select
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/60"
              value={editForm.type}
              onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Leader</label>
            <select
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/60"
              value={editForm.leaderId}
              onChange={(e) => setEditForm((f) => ({ ...f, leaderId: e.target.value }))}
            >
              <option value="">Optional</option>
              {members.filter((m) => m.role !== 'org_admin').map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
          <MemberSelector
            members={members}
            selectedIds={editForm.memberIds}
            onChange={(selected) => setEditForm((f) => ({ ...f, memberIds: selected }))}
            leaderId={editForm.leaderId}
          />
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Projects (hold Ctrl to multi-select)</label>
            <select
              multiple
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none min-h-[80px]"
              value={editForm.projectIds}
              onChange={(e) => {
                const selected = [...e.target.selectedOptions].map((o) => o.value);
                setEditForm((f) => ({ ...f, projectIds: selected }));
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              fullWidth
              loading={updateMutation.isPending}
              onClick={() => {
                if (!editForm.name.trim()) {
                  toastHelpers.validationError('Team name is required');
                  return;
                }
                updateMutation.mutate({
                  name: editForm.name.trim(),
                  type: editForm.type,
                  leaderId: editForm.leaderId || null,
                  memberIds: editForm.memberIds,
                  projectIds: editForm.projectIds,
                });
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Course Modal */}
      <Modal isOpen={courseModalOpen} onClose={() => { setCourseModalOpen(false); setSelectedInternForCourse(null); }} title={`Assign Course to ${selectedInternForCourse?.name || ''}`} size="md">
        <div className="p-6 space-y-4">
          <Input
            label="Course Title"
            required
            value={courseForm.title}
            onChange={(e) => setCourseForm((n) => ({ ...n, title: e.target.value }))}
            placeholder="e.g. Full-Stack Web Development"
          />
          <Input
            label="Provider"
            required
            value={courseForm.provider}
            onChange={(e) => setCourseForm((n) => ({ ...n, provider: e.target.value }))}
            placeholder="e.g. Coursera, Udemy"
          />
          <Input
            label="Total Hours"
            required
            type="number"
            value={courseForm.totalHours}
            onChange={(e) => setCourseForm((n) => ({ ...n, totalHours: e.target.value }))}
            placeholder="e.g. 40"
          />
          <Input
            label="Skill Tags (comma separated)"
            value={courseForm.skillTagsString}
            onChange={(e) => setCourseForm((n) => ({ ...n, skillTagsString: e.target.value }))}
            placeholder="e.g. React, Node.js, Mongoose"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setCourseModalOpen(false); setSelectedInternForCourse(null); }}>Cancel</Button>
            <Button loading={assignCourseMutation.isPending} onClick={handleAssignCourse}>Assign Course</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Team Modal */}
      <Modal isOpen={deleteOpen} onClose={() => { setDeleteOpen(false); setDeletingTeam(null); }} title="Delete Team" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <strong className="text-text-primary">{deletingTeam?.name}</strong>? Team members will be unassigned from this team.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setDeleteOpen(false); setDeletingTeam(null); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteMutation.isPending}
              onClick={() => {
                if (deletingTeam) deleteMutation.mutate(deletingTeam.id);
              }}
            >
              Delete Team
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
