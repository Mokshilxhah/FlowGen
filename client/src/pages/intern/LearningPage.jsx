import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, Star, Plus, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { showToast } from '../../utils/toast';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

export default function LearningPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [logHours, setLogHours] = useState('');
  
  const [newCourse, setNewCourse] = useState({
    title: '',
    provider: '',
    totalHours: '',
    skillTagsString: '',
  });

  const { data: learning, isLoading } = useQuery({
    queryKey: ['learning', 'progress'],
    queryFn: async () => (await api.get('/learning/progress')).data.data,
  });

  const addCourseMutation = useMutation({
    mutationFn: (body) => api.post('/learning/courses', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
      showToast.success('Course added successfully!');
      setAddOpen(false);
      setNewCourse({ title: '', provider: '', totalHours: '', skillTagsString: '' });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to add course'),
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/learning/courses/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
      showToast.success('Course progress updated!');
      setLogOpen(false);
      setLogHours('');
      setSelectedCourse(null);
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to update progress'),
  });

  const handleAddCourse = () => {
    if (!newCourse.title.trim() || !newCourse.provider.trim()) {
      showToast.error('Title and provider are required');
      return;
    }
    const total = Number(newCourse.totalHours) || 0;
    if (total <= 0) {
      showToast.error('Total hours must be greater than 0');
      return;
    }
    const tags = newCourse.skillTagsString
      ? newCourse.skillTagsString.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    
    addCourseMutation.mutate({
      title: newCourse.title.trim(),
      provider: newCourse.provider.trim(),
      totalHours: total,
      skillTags: tags,
    });
  };

  const handleLogProgress = () => {
    if (!selectedCourse) return;
    const added = Number(logHours) || 0;
    if (added <= 0) {
      showToast.error('Please enter study hours greater than 0');
      return;
    }
    const completed = Math.min((selectedCourse.completedHours || 0) + added, selectedCourse.totalHours || 1);
    const pct = Math.round((completed / (selectedCourse.totalHours || 1)) * 100);
    const status = completed >= selectedCourse.totalHours ? 'completed' : 'in_progress';
    
    updateCourseMutation.mutate({
      id: selectedCourse.id,
      completedHours: completed,
      completionPercent: pct,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  const radarData = (learning?.skills || []).map((s) => ({
    skill: s.name,
    value: ((s.proficiency || 1) / 5) * 100,
  }));

  if (isLoading) {
    return <div className="p-8 text-text-muted text-sm">Loading learning profile…</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-primary">Learning</h2>
          <p className="text-text-secondary text-sm mt-1">Your courses and skills from the database</p>
        </div>
        <Button icon={<Plus size={16} />} size="sm" onClick={() => setAddOpen(true)}>Add course</Button>
      </div>

      <div className="glass-card p-6 bg-gradient-to-r from-accent-amber/10 to-transparent border-l-4 border-accent-amber">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🔥</div>
          <div>
            <h3 className="text-2xl font-bold font-display text-text-primary">{learning?.streak?.current ?? 0}-day streak</h3>
            <p className="text-text-secondary text-sm">Longest: {learning?.streak?.longest ?? 0} days</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-4 font-display flex items-center gap-2">
            <BookOpen size={16} className="text-accent-cyan" /> Courses
          </h3>
          <div className="space-y-5">
            {(learning?.courses || []).length === 0 && (
              <p className="text-sm text-text-muted">No courses yet. Click &quot;Add course&quot; above to link one.</p>
            )}
            {(learning?.courses || []).map((course) => (
              <div key={course.id} className="p-4 bg-elevated rounded-xl border border-white/06 flex flex-col justify-between">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm">{course.title}</h4>
                    <p className="text-xs text-text-muted mt-0.5">{course.provider} · {course.completedHours || 0}h / {course.totalHours || 0}h logged</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={course.status === 'completed' ? 'emerald' : 'cyan'} size="xs">
                      {(course.status || '').replace('_', ' ')}
                    </Badge>
                    {course.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse(course);
                          setLogOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-accent-electric/10 text-accent-electric hover:bg-accent-electric/20 transition-all flex items-center justify-center"
                        title="Log study progress"
                      >
                        <Clock size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <Progress value={course.completionPercent ?? 0} showLabel size="sm" className="mb-2" />
                <div className="flex flex-wrap gap-1 mt-1">
                  {(course.skillTags || []).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-accent-electric/10 text-accent-electric rounded font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-4 font-display flex items-center gap-2">
            <Star size={16} className="text-accent-amber" /> Skills
          </h3>
          {radarData.length === 0 ? (
            <p className="text-sm text-text-muted">No skills in profile yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Radar name="Skills" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(learning?.skills || []).map((skill) => (
              <div key={skill.name} className="flex items-center justify-between p-2 bg-elevated rounded-lg">
                <span className="text-xs text-text-secondary">{skill.name}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < (skill.proficiency || 0) ? 'bg-accent-electric' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add Course Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Course" size="md">
        <div className="p-6 space-y-4">
          <Input
            label="Course Title"
            required
            value={newCourse.title}
            onChange={(e) => setNewCourse((n) => ({ ...n, title: e.target.value }))}
            placeholder="e.g. Full-Stack Web Development"
          />
          <Input
            label="Provider"
            required
            value={newCourse.provider}
            onChange={(e) => setNewCourse((n) => ({ ...n, provider: e.target.value }))}
            placeholder="e.g. Coursera, Udemy"
          />
          <Input
            label="Total Hours"
            required
            type="number"
            value={newCourse.totalHours}
            onChange={(e) => setNewCourse((n) => ({ ...n, totalHours: e.target.value }))}
            placeholder="e.g. 40"
          />
          <Input
            label="Skill Tags (comma separated)"
            value={newCourse.skillTagsString}
            onChange={(e) => setNewCourse((n) => ({ ...n, skillTagsString: e.target.value }))}
            placeholder="e.g. React, Node.js, Mongoose"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button loading={addCourseMutation.isPending} onClick={handleAddCourse}>Add Course</Button>
          </div>
        </div>
      </Modal>

      {/* Log Progress Modal */}
      <Modal isOpen={logOpen} onClose={() => { setLogOpen(false); setSelectedCourse(null); setLogHours(''); }} title="Log Study Hours" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary">
            Log progress for <strong className="text-text-primary">{selectedCourse?.title}</strong>
          </p>
          <Input
            label="Hours Studied"
            required
            type="number"
            value={logHours}
            onChange={(e) => setLogHours(e.target.value)}
            placeholder="e.g. 2"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setLogOpen(false); setSelectedCourse(null); setLogHours(''); }}>Cancel</Button>
            <Button loading={updateCourseMutation.isPending} onClick={handleLogProgress}>Save Progress</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
