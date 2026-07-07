import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, MessageSquare, Calendar, FileText, Link, MessageCircleQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { showToast } from '../../utils/toast';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');

const typeIcons = {
  doc: <FileText size={14} className="text-accent-electric" />,
  link: <Link size={14} className="text-accent-cyan" />,
};

export default function MentorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');

  const { data: mentorData, isLoading } = useQuery({
    queryKey: ['learning', 'mentor'],
    queryFn: async () => (await api.get('/learning/mentor')).data.data,
  });

  const { data: resourcesPage } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => (await api.get('/resources')).data.data,
  });

  const mentor = mentorData?.mentor;
  const resources = Array.isArray(resourcesPage) ? resourcesPage : [];

  const requestFeedbackMutation = useMutation({
    mutationFn: (body) => api.post('/messages', body),
    onSuccess: () => {
      showToast.success('Feedback request sent to your mentor!');
      setFeedbackOpen(false);
      setTopic('');
      setDetails('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (e) => showToast.error(e.response?.data?.error || 'Failed to send feedback request'),
  });

  const handleSendFeedbackRequest = () => {
    if (!mentor?.id) return;
    if (!topic.trim() || !details.trim()) {
      showToast.error('Topic and details are required');
      return;
    }

    const messageBody = `Hi ${mentor.name},\n\nI would appreciate your feedback on the following:\n\nTopic: ${topic.trim()}\nDetails:\n${details.trim()}\n\nBest regards,\nIntern`;

    requestFeedbackMutation.mutate({
      toId: mentor.id,
      subject: `Feedback Request: ${topic.trim()}`,
      body: messageBody,
      category: 'general',
    });
  };

  if (isLoading) {
    return <div className="p-8 text-text-muted text-sm">Loading…</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-text-primary">Mentor</h2>
        <p className="text-text-secondary text-sm mt-1">Assigned mentor and shared resources from the API</p>
      </div>

      {mentor ? (
        <Card className="bg-gradient-to-r from-accent-violet/10 to-transparent">
          <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
            <Avatar src={mentor.avatar} name={mentor.name} size="2xl" ring />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="text-xl font-bold font-display text-text-primary truncate">{mentor.name}</h3>
                <Badge variant="violet">Mentor</Badge>
              </div>
              <p className="text-text-secondary text-sm">{mentor.designation}</p>
              <p className="text-xs text-text-muted mt-1 truncate" title={mentor.companyEmail}>{mentor.companyEmail}</p>
              <div className="flex gap-3 mt-4 flex-wrap">
                <Button icon={<MessageSquare size={14} />} size="sm" onClick={() => navigate('/intern/chat')}>Chat</Button>
                <Button variant="success" icon={<MessageCircleQuestion size={14} />} size="sm" onClick={() => setFeedbackOpen(true)}>Request Feedback</Button>
                <Button variant="secondary" icon={<Calendar size={14} />} size="sm" onClick={() => navigate('/intern/tasks')}>Tasks</Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="text-accent-violet" />
            <p className="text-text-secondary text-sm">No mentor assigned. Ask HR to set <code className="text-xs">mentorId</code> on your learning profile.</p>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-4 font-display">Resources</h3>
        {resources.length === 0 ? (
          <p className="text-sm text-text-muted">No resources uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {resources.map((res) => (
              <a
                key={res.id}
                href={res.fileUrl ? `${apiOrigin}${res.fileUrl}` : '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-elevated rounded-xl hover:border-white/20 border border-transparent transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  {typeIcons[res.category] || typeIcons.doc}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{res.title}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>

      {/* Request Feedback Modal */}
      <Modal isOpen={feedbackOpen} onClose={() => { setFeedbackOpen(false); setTopic(''); setDetails(''); }} title="Request Feedback" size="md">
        <div className="p-6 space-y-4">
          <Input
            label="Feedback Topic"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Code review for user registration"
          />
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Request Details</label>
            <textarea
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-electric/60 resize-none h-32"
              placeholder="Describe what you want feedback on (e.g. files changed, challenges, or specific questions)..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setFeedbackOpen(false); setTopic(''); setDetails(''); }}>Cancel</Button>
            <Button loading={requestFeedbackMutation.isPending} onClick={handleSendFeedbackRequest}>Send Request</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
