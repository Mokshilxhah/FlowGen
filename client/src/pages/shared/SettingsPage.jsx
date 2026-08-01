import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Shield, Plug } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../utils/toast';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SharedSettings() {
  const { user, updateProfile, updatePassword, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
  });

  // Security state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleProfileSave = async () => {
    const res = await updateProfile(profile);
    if (res.success) showToast.success('Profile updated!');
    else showToast.error(res.error);
  };

  const handlePasswordUpdate = async () => {
    if (passwords.new !== passwords.confirm) {
      return showToast.error('Passwords do not match');
    }
    const res = await updatePassword(passwords.current, passwords.new);
    if (res.success) {
      showToast.success('Password updated!');
      setPasswords({ current: '', new: '', confirm: '' });
    } else {
      showToast.error(res.error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display" style={{ color: '#F1F5F9' }}>Settings</h2>
        <p style={{ color: '#94A3B8' }} className="text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.filter(tab => !(tab.id === 'security' && user?.role === 'hr')).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                borderLeft: activeTab === tab.id ? '3px solid #6366F1' : '3px solid transparent',
                color: activeTab === tab.id ? '#F1F5F9' : '#94A3B8',
              }}>
              <tab.icon size={16} style={{ color: activeTab === tab.id ? '#6366F1' : 'inherit' }} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <h3 className="text-base font-semibold mb-6 font-display" style={{ color: '#F1F5F9' }}>Profile</h3>
              <div className="space-y-4">
                <Input label="Full Name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                <Input label="Email" type="email" value={user?.companyEmail} disabled />
                <Input label="Phone" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#94A3B8' }}>Bio</label>
                  <textarea className="w-full rounded-xl px-4 py-3 text-sm resize-none h-20 outline-none"
                    style={{ background: '#1A2236', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9' }}
                    value={profile.bio}
                    onChange={e => setProfile({...profile, bio: e.target.value})}
                    placeholder="Tell us about yourself..." />
                </div>
                <Button loading={isLoading} onClick={handleProfileSave}>Save Changes</Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-base font-semibold mb-6 font-display" style={{ color: '#F1F5F9' }}>Notifications</h3>
              <div className="space-y-4">
                {['Task assignments', 'Meeting reminders', 'Chat messages', 'System alerts', 'Weekly digest'].map(item => (
                  <div key={item} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-sm" style={{ color: '#94A3B8' }}>{item}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 rounded-full transition-colors peer-checked:bg-indigo-500" style={{ background: 'rgba(255,255,255,0.1)' }} />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}



          {activeTab === 'security' && (
            <Card>
              <h3 className="text-base font-semibold mb-6 font-display" style={{ color: '#F1F5F9' }}>Security</h3>
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
