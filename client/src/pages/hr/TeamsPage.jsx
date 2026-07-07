import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Users, Crown, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
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

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
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

  const { data: progresses = [] } = useQuery({
    queryKey: ['learning', 'progress', 'all'],
    queryFn: async () => (await api.get('/learning/progress/all')).data.data,
  });

  const interns = useMemo(() => peers.filter((p) => p.role === 'intern'), [peers]);
  const employees = useMemo(() => peers.filter((p) => p.role === 'employee'), [peers]);

  const teamMap = useMemo(() => {
    const m = {};
    teams.forEach((t) => { m[t.id] = t; });
    return m;
  }, [teams]);

  const progressMap = useMemo(() => {
    const m = {};
    progresses.forEach((p) => { m[p.internId] = p; });
    return m;
  }, [progresses]);

  const members = useMemo(() => {
    if (!user) return peers;
    return [user, ...peers];
  }, [user, peers]);

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

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Teams</h2>
          <p className="text-text-secondary text-sm mt-1">Manage teams and intern mentorship</p>
        </div>
        {activeTab === 'teams' && (
          <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create team</Button>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-elevated rounded-xl border border-white/10 w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'teams' ? 'bg-accent-electric text-white' : 'text-text-muted hover:text-text-primary'}`}
        >
          Teams List
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mentorship')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'mentorship' ? 'bg-accent-electric text-white' : 'text-text-muted hover:text-text-primary'}`}
        >
          Intern Mentorship
        </button>
      </div>

      {activeTab === 'teams' ? (
        <>
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
      </>
      ) : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {interns.map((intern) => {
              const team = intern.teamId ? teamMap[intern.teamId] : null;
              const currentMentorId = progressMap[intern.id]?.mentorId || '';
              const selectedMentorId = selectedMentors[intern.id] !== undefined ? selectedMentors[intern.id] : currentMentorId;
              
              const sameTeamEmployees = employees.filter((e) => e.teamId && String(e.teamId) === String(intern.teamId));
              const currentMentor = currentMentorId ? members.find(m => m.id === currentMentorId) : null;

              return (
                <div key={intern.id} className="glass-card p-6 flex flex-col justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar src={intern.avatar} name={intern.name} size="md" status="active" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-text-primary text-base truncate">{intern.name}</h4>
                      <p className="text-xs text-text-muted truncate mb-2">{intern.companyEmail}</p>
                      {team ? (
                        <Badge variant="cyan" size="xs">Team: {team.name}</Badge>
                      ) : (
                        <Badge variant="rose" size="xs">No Team Assigned</Badge>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/06 pt-4">
                    <p className="text-xs text-text-muted mb-2 font-medium">Assigned Mentor:</p>
                    {currentMentor ? (
                      <div className="flex items-center gap-2 mb-3 bg-white/02 p-2 rounded-xl border border-white/04">
                        <Avatar src={currentMentor.avatar} name={currentMentor.name} size="xs" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">{currentMentor.name}</p>
                          <p className="text-[10px] text-text-muted truncate">{currentMentor.designation || 'Employee'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-accent-rose mb-3 font-semibold">No mentor assigned</p>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-text-muted mb-1.5 block">Select Mentor (Same Team)</label>
                        <select
                          disabled={!team}
                          value={selectedMentorId}
                          onChange={(e) => setSelectedMentors((prev) => ({ ...prev, [intern.id]: e.target.value }))}
                          className="w-full bg-elevated border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-electric/60 disabled:opacity-40"
                        >
                          <option value="">No mentor / Select employee</option>
                          {sameTeamEmployees.map((e) => (
                            <option key={e.id} value={e.id}>{e.name} ({e.designation || 'Employee'})</option>
                          ))}
                        </select>
                      </div>

                      <Button
                        fullWidth
                        size="sm"
                        disabled={!team || selectedMentorId === currentMentorId}
                        loading={assignMentorMutation.isPending && assignMentorMutation.variables?.internId === intern.id}
                        onClick={() => {
                          assignMentorMutation.mutate({ internId: intern.id, mentorId: selectedMentorId || null });
                        }}
                      >
                        Assign Mentor
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {interns.length === 0 && (
              <p className="text-sm text-text-muted py-6">No interns found in the organization.</p>
            )}
          </div>
        </div>
      )}

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
              {members.filter((m) => m.role !== 'hr' && m.role !== 'org_admin').map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Employees (hold Ctrl to multi-select)</label>
            <select
              multiple
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none min-h-[100px]"
              value={form.memberIds}
              onChange={(e) => {
                const selected = [...e.target.selectedOptions].map((o) => o.value);
                setForm((f) => ({ ...f, memberIds: selected }));
              }}
            >
              {members.filter((m) => m.id !== form.leaderId && m.role !== 'hr' && m.role !== 'org_admin').map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
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
              {members.filter((m) => m.role !== 'hr' && m.role !== 'org_admin').map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Employees (hold Ctrl to multi-select)</label>
            <select
              multiple
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none min-h-[100px]"
              value={editForm.memberIds}
              onChange={(e) => {
                const selected = [...e.target.selectedOptions].map((o) => o.value);
                setEditForm((f) => ({ ...f, memberIds: selected }));
              }}
            >
              {members.filter((m) => m.id !== editForm.leaderId && m.role !== 'hr' && m.role !== 'org_admin').map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
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
    </motion.div>
  );
}
