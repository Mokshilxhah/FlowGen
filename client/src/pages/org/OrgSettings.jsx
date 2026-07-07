import { motion } from 'framer-motion';
import { useState } from 'react';
import { Building2, Bell, Palette, Shield, Plug } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { showToast, toastHelpers } from '../../utils/toast';

const tabs = [
  { id: 'notifications', label: 'Notifications', icon: Bell, color: '#F59E0B' },
  { id: 'security', label: 'Security', icon: Shield, color: '#F43F5E' },
];



export default function OrgSettings() {
  const { updatePassword, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('notifications');

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePasswordUpdate = async () => {
    if (passwords.new !== passwords.confirm) {
      return toastHelpers.validationError('Passwords do not match');
    }
    const res = await updatePassword(passwords.current, passwords.new);
    if (res.success) {
      showToast.success('Password updated successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } else {
      showToast.error(res.error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-text-primary">Settings</h2>
        <p className="text-text-secondary text-sm mt-1">Manage your organization settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTab === tab.id ? 'sidebar-active text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}>
              <tab.icon size={16} style={{ color: activeTab === tab.id ? tab.color : '#475569' }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">

          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-base font-semibold text-text-primary mb-6 font-display">Notification Preferences</h3>
              <div className="space-y-4">
                {['New member joined', 'Project status changed', 'Billing alerts', 'Security alerts', 'Weekly digest'].map(item => (
                  <div key={item} className="flex items-center justify-between py-3 border-b border-white/06 last:border-0">
                    <span className="text-sm text-text-secondary">{item}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-white/10 peer-checked:bg-accent-electric rounded-full transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <h3 className="text-base font-semibold text-text-primary mb-6 font-display">Security</h3>
              <div className="space-y-4">
                <Input label="Current Password" type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                <Input label="New Password" type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                <Input label="Confirm Password" type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
                <Button loading={isLoading} onClick={handlePasswordUpdate}>Update Password</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
