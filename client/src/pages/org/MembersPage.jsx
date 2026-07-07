import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Grid, List, Plus, MoreVertical, Mail, Trash2, Edit, RefreshCw, Users } from 'lucide-react';
import { api } from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Dropdown from '../../components/ui/Dropdown';
import { formatDate, getRoleLabel } from '../../utils/formatters';
import { showToast, toastHelpers } from '../../utils/toast';
import { useAuthStore } from '../../store/authStore';

const tabs = ['All', 'HR', 'Employees', 'Interns'];
const roleMap = { HR: 'hr', Employees: 'employee', Interns: 'intern' };

// ── Free plan seat limit ──────────────────────────────────────────
const FREE_PLAN_LIMIT = 5;

// ── Gender avatar helpers ─────────────────────────────────────────
const genderAvatarConfig = {
  male:   { gradient: 'linear-gradient(135deg, #6366F1, #3B82F6)', emoji: '👨' },
  female: { gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)', emoji: '👩' },
  other:  { gradient: 'linear-gradient(135deg, #10B981, #06B6D4)', emoji: '🧑' },
};

function GenderAvatar({ gender, name, size = 'lg', status }) {
  const cfg = genderAvatarConfig[gender] || genderAvatarConfig.other;
  const sizeMap = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56, '2xl': 72 };
  const px = sizeMap[size] || 40;
  const fontSize = px * 0.35;
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className="rounded-full flex items-center justify-center font-bold text-white select-none"
        style={{ width: px, height: px, background: cfg.gradient, fontSize }}
      >
        {initials}
      </div>
      {status && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-deep"
          style={{
            width: px * 0.28,
            height: px * 0.28,
            background: status === 'active' ? '#10B981' : '#475569',
          }}
        />
      )}
    </div>
  );
}

// ── Reusable member avatar (falls back to gender-based if no src) ─
function MemberAvatar({ member, size, status }) {
  if (member.avatar) {
    return <Avatar src={member.avatar} name={member.name} size={size} status={status} />;
  }
  return (
    <GenderAvatar
      gender={member.gender}
      name={member.name}
      size={size}
      status={status}
    />
  );
}

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { organization } = useAuthStore();
  const isFreePlan = !organization?.plan || organization?.plan === 'free';

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    personalEmail: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    managerId: '',
    gender: 'male',
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/members')).data.data,
  });

  const hrManagers = useMemo(() => {
    return members.filter((m) => m.role === 'hr' && m.status === 'active');
  }, [members]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    companyEmail: '',
    personalEmail: '',
    phone: '',
    role: '',
    department: '',
    designation: '',
    password: '',
    resendCredentials: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name || '',
      companyEmail: member.companyEmail || '',
      personalEmail: member.personalEmail || '',
      phone: member.phone || '',
      role: member.role || '',
      department: member.department || '',
      designation: member.designation || '',
      managerId: member.managerId?._id || member.managerId || '',
      password: '',
      resendCredentials: false
    });
    setIsChangingPassword(false);
    setEditModalOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (body) => (await api.patch(`/members/${editingMember.id}`, body)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      showToast.success('Member information updated successfully');
      setEditModalOpen(false);
      setEditingMember(null);
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to update member'),
  });

  const handleConfirmEdit = () => {
    if (!editForm.name.trim() || !editForm.personalEmail.trim() || !editForm.companyEmail.trim() || !editForm.department.trim() || !editForm.designation.trim()) {
      toastHelpers.validationError('Please fill in all required fields');
      return;
    }
    const payload = {
      name: editForm.name.trim(),
      companyEmail: editForm.companyEmail.trim(),
      personalEmail: editForm.personalEmail.trim(),
      phone: editForm.phone || undefined,
      role: editForm.role,
      department: editForm.department,
      designation: editForm.designation,
      managerId: (editForm.role === 'employee' || editForm.role === 'intern') && editForm.managerId ? editForm.managerId : null,
    };
    if (isChangingPassword) {
      if (!editForm.password.trim()) {
        toastHelpers.validationError('Please enter a new password or uncheck Change Password');
        return;
      }
      payload.password = editForm.password.trim();
      if (editForm.resendCredentials) {
        payload.resendCredentials = true;
      }
    }
    updateMutation.mutate(payload);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditForm(f => ({ ...f, password: pass }));
  };

  const addMutation = useMutation({
    mutationFn: async (body) => (await api.post('/members', body)).data,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'activity'] });
      toastHelpers.memberInvited();
      if (res?.data?.tempPassword) {
        showToast.success(
          `Account created! Email: ${res.data.user?.companyEmail} | Password: ${res.data.tempPassword}`,
          { duration: 10000 }
        );
      }
      setAddModalOpen(false);
      setAddStep(1);
      setSelectedRole('');
      setForm({
        firstName: '',
        lastName: '',
        personalEmail: '',
        phone: '',
        department: '',
        designation: '',
        joiningDate: new Date().toISOString().slice(0, 10),
        managerId: '',
        gender: 'male',
      });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to add employee'),
  });

  const resendMutation = useMutation({
    mutationFn: (id) => api.post(`/members/${id}/resend-invite`),
    onSuccess: () => {
      showToast.success('Invite email resent successfully');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to resend invite'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/members/${id}`),
    onSuccess: () => {
      toastHelpers.memberRemoved();
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'stats'] });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to deactivate employee'),
  });

  const activateMutation = useMutation({
    mutationFn: (id) => api.patch(`/members/${id}`, { status: 'active' }),
    onSuccess: () => {
      showToast.success('Employee activated successfully');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'stats'] });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to activate employee'),
  });

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (m.role === 'org_admin') return false;
      const matchTab = activeTab === 'All' || m.role === roleMap[activeTab];
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q) ||
        (m.companyEmail || '').toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [members, activeTab, search]);

  // ── Admin is NOT a member: count only non-admin roles ────────────
  const nonAdminCount = members.filter((m) => m.role !== 'org_admin').length;

  const handleConfirmAdd = () => {
    if (!selectedRole || !form.firstName || !form.lastName || !form.personalEmail || !form.department || !form.designation) {
      toastHelpers.validationError('Please fill in all required fields');
      return;
    }
    // Free plan seat limit check
    if (isFreePlan && nonAdminCount >= FREE_PLAN_LIMIT) {
      showToast.error(`Free plan is limited to ${FREE_PLAN_LIMIT} members. Please upgrade to add more.`);
      return;
    }
    addMutation.mutate({
      role: selectedRole,
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      personalEmail: form.personalEmail.trim(),
      phone: form.phone || undefined,
      department: form.department,
      designation: form.designation,
      joinDate: form.joiningDate,
      gender: form.gender,
      managerId: (selectedRole === 'employee' || selectedRole === 'intern') && form.managerId ? form.managerId : undefined,
    });
  };

  // ── Free plan progress bar values ────────────────────────────────
  const freePlanUsed = nonAdminCount;
  const freePlanPct = Math.min((freePlanUsed / FREE_PLAN_LIMIT) * 100, 100);
  const freePlanColor =
    freePlanPct >= 100 ? '#EF4444' :
    freePlanPct >= 80  ? '#F59E0B' :
    '#10B981';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Employees</h2>
          <p className="text-text-secondary text-sm mt-1">
            {isLoading ? '…' : `${nonAdminCount} workforce employees`} · Live data from your organization
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setAddModalOpen(true)}>Add Employee</Button>
      </div>

      {/* ── Free Plan Seat Progress Bar ──────────────────────────── */}
      {isFreePlan && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
          style={{ borderColor: freePlanPct >= 100 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: freePlanColor }} />
              <span className="text-xs font-semibold text-text-primary">Free Plan — Team Seats</span>
              {freePlanPct >= 100 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                  Limit Reached
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold" style={{ color: freePlanColor }}>{freePlanUsed}</span>
              <span className="text-xs text-text-muted">/ {FREE_PLAN_LIMIT} members</span>
              <span className="text-xs text-text-muted ml-2">({FREE_PLAN_LIMIT - freePlanUsed > 0 ? `${FREE_PLAN_LIMIT - freePlanUsed} remaining` : 'full'})</span>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${freePlanPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: freePlanColor }}
            />
          </div>
          {freePlanPct >= 80 && freePlanPct < 100 && (
            <p className="text-xs mt-2" style={{ color: '#F59E0B' }}>
              ⚠️ Almost full — upgrade to Pro for unlimited members
            </p>
          )}
          {freePlanPct >= 100 && (
            <p className="text-xs mt-2" style={{ color: '#EF4444' }}>
              🚫 Seat limit reached. Upgrade your plan to add more members.
            </p>
          )}
        </motion.div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 p-1 bg-elevated rounded-xl border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-accent-electric text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 max-w-xs relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full pl-9 pr-4 py-2 bg-elevated border border-white/10 rounded-xl text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/50"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-accent-electric/20 text-accent-electric' : 'text-text-muted hover:text-text-primary'}`}
          >
            <Grid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-accent-electric/20 text-accent-electric' : 'text-text-muted hover:text-text-primary'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-5 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <MemberAvatar member={member} size="lg" status={member.status === 'active' ? 'active' : 'offline'} />
                  <Dropdown
                    trigger={
                      <button type="button" className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreVertical size={14} />
                      </button>
                    }
                    align="right"
                    items={
                      member.status !== 'active'
                        ? [
                            { label: 'Edit Info', icon: <Edit size={14} />, onClick: () => handleOpenEditModal(member) },
                            { label: 'Resend welcome email', icon: <Mail size={14} />, onClick: () => resendMutation.mutate(member.id) },
                            { divider: true },
                            {
                              label: 'Activate',
                              icon: <RefreshCw size={14} className="text-accent-cyan" />,
                              onClick: () => activateMutation.mutate(member.id),
                            },
                          ]
                        : [
                            { label: 'Edit Info', icon: <Edit size={14} />, onClick: () => handleOpenEditModal(member) },
                            { label: 'Resend welcome email', icon: <Mail size={14} />, onClick: () => resendMutation.mutate(member.id) },
                            { divider: true },
                            {
                              label: 'Deactivate',
                              icon: <Trash2 size={14} />,
                              danger: true,
                              onClick: () => deactivateMutation.mutate(member.id),
                            },
                          ]
                    }
                  />
                </div>
                <h4 className="font-semibold text-text-primary text-sm">{member.name}</h4>
                <p className="text-xs text-text-muted mb-3">{member.designation}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={member.role} size="xs">{getRoleLabel(member.role)}</Badge>
                  <Badge variant={member.status} dot size="xs">{member.status}</Badge>
                </div>
                <p className="text-xs text-text-muted mt-2">{member.department}</p>
                <p className="text-xs text-text-muted mt-1 truncate" title={member.companyEmail}>{member.companyEmail}</p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/06">
                  {['Employee', 'Role', 'Department', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/04">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-white/02 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar member={member} size="sm" status={member.status === 'active' ? 'active' : 'offline'} />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{member.name}</p>
                          <p className="text-xs text-text-muted">{member.companyEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge variant={member.role} size="xs">{getRoleLabel(member.role)}</Badge></td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{member.department}</td>
                    <td className="px-6 py-4"><Badge variant={member.status} dot size="xs">{member.status}</Badge></td>
                    <td className="px-6 py-4 text-sm text-text-muted">{member.joinDate ? formatDate(member.joinDate) : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <Dropdown
                          trigger={
                            <button type="button" className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-all">
                              <MoreVertical size={14} />
                            </button>
                          }
                          align="right"
                          items={
                            member.status !== 'active'
                              ? [
                                  { label: 'Edit Info', icon: <Edit size={14} />, onClick: () => handleOpenEditModal(member) },
                                  { label: 'Resend welcome email', icon: <Mail size={14} />, onClick: () => resendMutation.mutate(member.id) },
                                  { divider: true },
                                  {
                                    label: 'Activate',
                                    icon: <RefreshCw size={14} className="text-accent-cyan" />,
                                    onClick: () => activateMutation.mutate(member.id),
                                  },
                                ]
                              : [
                                  { label: 'Edit Info', icon: <Edit size={14} />, onClick: () => handleOpenEditModal(member) },
                                  { label: 'Resend welcome email', icon: <Mail size={14} />, onClick: () => resendMutation.mutate(member.id) },
                                  { divider: true },
                                  {
                                    label: 'Deactivate',
                                    icon: <Trash2 size={14} />,
                                    danger: true,
                                    onClick: () => deactivateMutation.mutate(member.id),
                                  },
                                ]
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Employee Modal ─────────────────────────────────────── */}
      <Modal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setAddStep(1); setSelectedRole(''); }} title="Add New Employee" size="md">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            {['Role', 'Details', 'Preview'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= addStep ? 'bg-accent-electric text-white' : 'bg-white/10 text-text-muted'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs ${i + 1 === addStep ? 'text-text-primary' : 'text-text-muted'}`}>{s}</span>
                {i < 2 && <div className={`flex-1 h-0.5 ${i + 1 < addStep ? 'bg-accent-electric' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          {addStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary mb-4">Select the role for the new employee</p>

              {/* Free plan seat warning on step 1 */}
              {isFreePlan && nonAdminCount >= FREE_PLAN_LIMIT && (
                <div className="p-3 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
                  <p className="text-xs text-red-400 font-medium">🚫 Free plan seat limit reached ({FREE_PLAN_LIMIT}/{FREE_PLAN_LIMIT}). Upgrade to add more members.</p>
                </div>
              )}

              {[
                { role: 'hr', label: 'HR Manager', desc: 'Manages teams, attendance, and reports', color: 'accent-violet' },
                { role: 'employee', label: 'Employee', desc: 'Works on projects and tasks', color: 'accent-cyan' },
                { role: 'intern', label: 'Intern', desc: 'Learning and contributing to projects', color: 'accent-emerald' },
              ].map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setSelectedRole(r.role)}
                  className={`w-full p-4 glass-card text-left transition-all ${selectedRole === r.role ? 'border-accent-electric/50 bg-accent-electric/5' : 'hover:border-white/20'}`}
                >
                  <p className={`font-semibold text-${r.color} mb-1`}>{r.label}</p>
                  <p className="text-xs text-text-muted">{r.desc}</p>
                </button>
              ))}
              <Button
                fullWidth
                disabled={!selectedRole || (isFreePlan && nonAdminCount >= FREE_PLAN_LIMIT)}
                onClick={() => setAddStep(2)}
                className="mt-4"
              >
                Continue
              </Button>
            </div>
          )}

          {addStep === 2 && (
            <div className="space-y-4">
              {/* Gender Selection */}
              <div>
                <label className="text-xs text-text-muted mb-2 block">Gender</label>
                <div className="flex gap-2">
                  {[
                    { value: 'male',   label: '👨 Male',   gradient: genderAvatarConfig.male.gradient },
                    { value: 'female', label: '👩 Female', gradient: genderAvatarConfig.female.gradient },
                    { value: 'other',  label: '🧑 Other',  gradient: genderAvatarConfig.other.gradient },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, gender: g.value }))}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                        form.gender === g.value
                          ? 'text-white border-transparent'
                          : 'bg-elevated border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'
                      }`}
                      style={form.gender === g.value ? { background: g.gradient, borderColor: 'transparent' } : {}}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview avatar */}
              <div className="flex items-center gap-3 p-3 bg-elevated rounded-xl border border-white/08">
                <GenderAvatar gender={form.gender} name={`${form.firstName} ${form.lastName}`} size="md" />
                <div>
                  <p className="text-xs text-text-muted">Avatar Preview</p>
                  <p className="text-sm text-text-primary font-medium">
                    {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : 'Full Name'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                <Input label="Last Name" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
              <Input label="Personal Email" type="email" required value={form.personalEmail} onChange={(e) => setForm((f) => ({ ...f, personalEmail: e.target.value }))} />
              <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Department" required value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
                <Input label="Designation" required value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
              </div>
              <Input label="Joining Date" type="date" required value={form.joiningDate} onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))} />

              {(selectedRole === 'employee' || selectedRole === 'intern') && (
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Assign HR Manager</label>
                  <select
                    value={form.managerId}
                    onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))}
                    className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F1F5F9] outline-none focus:border-accent-electric/60"
                  >
                    <option value="">-- No Assigned HR Manager (Reports to Admin) --</option>
                    {hrManagers.map((hr) => (
                      <option key={hr.id || hr._id} value={hr.id || hr._id}>
                        {hr.name} ({hr.companyEmail})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setAddStep(1)}>Back</Button>
                <Button fullWidth onClick={() => setAddStep(3)}>Preview</Button>
              </div>
            </div>
          )}

          {addStep === 3 && (
            <div className="space-y-4">
              <div className="glass-card p-4 bg-accent-electric/5 border-accent-electric/20">
                <div className="flex items-center gap-3 mb-3">
                  <GenderAvatar gender={form.gender} name={`${form.firstName} ${form.lastName}`} size="lg" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{form.firstName} {form.lastName}</p>
                    <p className="text-xs text-text-muted capitalize">{selectedRole} · {form.gender}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-text-primary mb-2">We will send a real welcome email</p>
                <p className="text-xs text-text-muted mb-2">SMTP must be configured on the server (.env) for delivery. Otherwise the server logs the email in the console.</p>
                <div className="mt-3 p-3 bg-deep rounded-lg text-xs text-text-secondary space-y-1">
                  <p><strong>Name:</strong> {form.firstName} {form.lastName}</p>
                  <p><strong>Role:</strong> {selectedRole}</p>
                  <p><strong>Personal email (receives invite):</strong> {form.personalEmail}</p>
                  {form.managerId && (selectedRole === 'employee' || selectedRole === 'intern') && (
                    <p><strong>Assigned HR Manager:</strong> {hrManagers.find(h => (h.id || h._id) === form.managerId)?.name}</p>
                  )}
                  <p className="text-text-muted mt-2">Company email and password are generated automatically (e.g. first.last@yourdomain.flowgen.app).</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setAddStep(2)}>Back</Button>
                <Button fullWidth variant="success" loading={addMutation.isPending} onClick={handleConfirmAdd}>Confirm &amp; send email</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Edit Employee Modal ────────────────────────────────────── */}
      <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingMember(null); }} title="Edit Employee Information" size="md">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" required value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Role</label>
              <select value={editForm.role} onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-electric/60">
                <option value="hr">HR Manager</option>
                <option value="employee">Employee</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company Email" type="email" required value={editForm.companyEmail} onChange={(e) => setEditForm(f => ({ ...f, companyEmail: e.target.value }))} />
            <Input label="Personal Email" type="email" required value={editForm.personalEmail} onChange={(e) => setEditForm(f => ({ ...f, personalEmail: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" required value={editForm.department} onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))} />
            <Input label="Designation" required value={editForm.designation} onChange={(e) => setEditForm(f => ({ ...f, designation: e.target.value }))} />
          </div>
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />

          {(editForm.role === 'employee' || editForm.role === 'intern') && (
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Assign HR Manager</label>
              <select
                value={editForm.managerId}
                onChange={(e) => setEditForm(f => ({ ...f, managerId: e.target.value }))}
                className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F1F5F9] outline-none focus:border-accent-electric/60"
              >
                <option value="">-- No Assigned HR Manager (Reports to Admin) --</option>
                {hrManagers.map((hr) => (
                  <option key={hr.id || hr._id} value={hr.id || hr._id}>
                    {hr.name} ({hr.companyEmail})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Password Resets Section */}
          <div className="p-4 rounded-xl bg-white/02 border border-white/05 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isChangingPassword} onChange={(e) => setIsChangingPassword(e.target.checked)} className="rounded bg-white/5 border-white/10 text-accent-electric focus:ring-accent-electric/50" />
              <span className="text-xs text-text-primary font-medium">Reset Credentials / Change Password</span>
            </label>

            {isChangingPassword && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New Password"
                    value={editForm.password}
                    onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))}
                    className="flex-1 bg-elevated border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent-electric/60"
                  />
                  <Button type="button" variant="secondary" onClick={handleGenerateRandomPassword}>
                    Generate
                  </Button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input type="checkbox" checked={editForm.resendCredentials} onChange={(e) => setEditForm(f => ({ ...f, resendCredentials: e.target.checked }))} className="rounded bg-white/5 border-white/10 text-accent-electric focus:ring-accent-electric/50" />
                  <span className="text-xs text-text-muted">Resend updated credentials/login info to personal email</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setEditModalOpen(false); setEditingMember(null); }}>Cancel</Button>
            <Button fullWidth loading={updateMutation.isPending} onClick={handleConfirmEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
