import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, Save, Lock, Palette, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { profileApi, authApi, getErrorMessage } from '../../services/api';
import { LoadingSpinner } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { useNavigate } from 'react-router-dom';

const AVATARS = ['av_1','av_2','av_3','av_4','av_5','av_6','av_7','av_8','av_9','av_10','av_11','av_12'];
const AVATAR_COLORS = [
  'bg-blue-400','bg-indigo-500','bg-violet-500','bg-purple-500',
  'bg-pink-400','bg-rose-500','bg-orange-400','bg-amber-500',
  'bg-emerald-500','bg-teal-500','bg-cyan-500','bg-sky-500',
];

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || 'av_1',
    themePreference: theme,
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [requestingDeactivation, setRequestingDeactivation] = useState(false);

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const res = await profileApi.updateMyProfile({
        name: form.name.trim(),
        avatar: form.avatar,
        themePreference: form.themePreference,
      });
      updateUser(res.data.user);
      setThemeMode(form.themePreference);
      toast.success('Settings saved.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed. Please log in again.');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeactivationRequest = async () => {
    if (!window.confirm('Are you sure you want to request account deactivation? An administrator will process your request.')) return;
    setRequestingDeactivation(true);
    try {
      await profileApi.requestDeactivation();
      toast.success('Deactivation request submitted. An administrator will contact you.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRequestingDeactivation(false);
    }
  };

  const tabs = ['account', 'password', 'appearance'];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="page-title">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Account */}
      {tab === 'account' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 space-y-5">
          <h2 className="section-title flex items-center gap-2"><User className="h-4 w-4 text-brand-500" /> Account Information</h2>

          <div>
            <label className="label">Display Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </div>

          <div className="divider" />

          <div>
            <label className="label mb-3">Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((av, i) => (
                <button
                  key={av}
                  onClick={() => setForm({ ...form, avatar: av })}
                  className={`h-10 w-10 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm transition-all ${form.avatar === av ? 'ring-4 ring-brand-500 scale-110' : 'hover:scale-105'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSaveAccount} disabled={saving} className="btn-primary">
            {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>

          <div className="divider" />
          <div>
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
            <button onClick={handleDeactivationRequest} disabled={requestingDeactivation} className="btn-danger text-sm">
              {requestingDeactivation ? <LoadingSpinner size="sm" /> : 'Request Account Deactivation'}
            </button>
            <p className="text-xs text-slate-400 mt-1">Your account records will be retained. Only administrators can reactivate deactivated accounts.</p>
          </div>
        </motion.div>
      )}

      {/* Password */}
      {tab === 'password' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-5"><Lock className="h-4 w-4 text-brand-500" /> Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} className="input" placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} className="input" />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary">
              {pwLoading ? <LoadingSpinner size="sm" /> : 'Change Password'}
            </button>
            <p className="text-xs text-slate-400">You will be signed out after changing your password.</p>
          </form>
        </motion.div>
      )}

      {/* Appearance */}
      {tab === 'appearance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-5"><Palette className="h-4 w-4 text-brand-500" /> Appearance</h2>
          <div className="space-y-3">
            {['light', 'dark', 'system'].map((t) => (
              <label key={t} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${form.themePreference === t ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <input
                  type="radio" name="theme" value={t}
                  checked={form.themePreference === t}
                  onChange={() => setForm({ ...form, themePreference: t })}
                  className="text-brand-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{t === 'system' ? 'System Default' : t} Mode</p>
                  <p className="text-xs text-slate-400">{t === 'system' ? 'Follows your OS setting' : t === 'dark' ? 'Always dark' : 'Always light'}</p>
                </div>
              </label>
            ))}
          </div>
          <button onClick={handleSaveAccount} disabled={saving} className="btn-primary mt-5">
            {saving ? <LoadingSpinner size="sm" /> : 'Save Preference'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
