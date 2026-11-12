import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { profileApi, getErrorMessage } from '../../services/api';
import { LoadingSpinner } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { User, Building2, Briefcase, BookOpen, Code, Linkedin, Github, Globe, Edit2, Save, X } from 'lucide-react';
import { DEPARTMENTS, GRADUATION_YEARS } from '../../utils/helpers';
import { motion } from 'framer-motion';

export default function MyProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    profileApi.getMyProfile()
      .then((res) => {
        setProfile(res.data.profile);
        initForm(res.data.user, res.data.profile);
      })
      .catch(() => toast.error('Could not load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const initForm = (u, p) => {
    setForm({
      name: u?.name || '',
      department: u?.department || '',
      graduationYear: u?.graduationYear || '',
      // For students, skills live in StudentProfile; for alumni, in User
      skills: (u?.role === 'student' ? p?.skills : u?.skills) || [],
      currentCompany: u?.currentCompany || '',
      currentRole: u?.currentRole || '',
      linkedinUrl: p?.linkedinUrl || '',
      githubUrl: p?.githubUrl || '',
      portfolioUrl: p?.portfolioUrl || '',
      bio: p?.bio || '',
      cgpa: p?.cgpa ?? '',
      percentage: p?.percentage ?? '',
      backlogs: p?.backlogs ?? '',
      mentorshipInterests: p?.mentorshipInterests || '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await profileApi.updateMyProfile(form);
      const savedProfile = res.data.profile;
      const savedUser = res.data.user;
      setProfile(savedProfile);
      updateUser(savedUser);
      // Re-seed the form from the freshly-saved data so reopening edit
      // shows the latest values (including bio and skills).
      initForm(savedUser, savedProfile);
      setEditing(false);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills?.includes(s)) {
      setForm({ ...form, skills: [...(form.skills || []), s] });
      setSkillInput('');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const isAlumni = user?.role === 'alumni';
  const isStudent = user?.role === 'student';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Profile</h1>
        {!editing
          ? <button onClick={() => setEditing(true)} className="btn-secondary"><Edit2 className="h-4 w-4" /> Edit</button>
          : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => { initForm(user, profile); setEditing(false); }} className="btn-ghost"><X className="h-4 w-4" /></button>
            </div>
          )
        }
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar user={user} size="xl" />
          <div>
            {editing
              ? <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input text-lg font-bold mb-1" />
              : <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            }
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="badge-blue capitalize mt-1">{user?.role}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Department</label>
            {editing
              ? <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input">
                  <option value="">Select</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              : <p className="text-sm text-slate-700 dark:text-slate-300">{user?.department || 'Not set'}</p>
            }
          </div>
          <div>
            <label className="label">Graduation Year</label>
            {editing
              ? <select value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} className="input">
                  <option value="">Select</option>
                  {GRADUATION_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              : <p className="text-sm text-slate-700 dark:text-slate-300">{user?.graduationYear || 'Not set'}</p>
            }
          </div>
          {isAlumni && (
            <>
              <div>
                <label className="label">Current Company</label>
                {editing
                  ? <input value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} className="input" />
                  : <p className="text-sm text-slate-700 dark:text-slate-300">{user?.currentCompany || 'Not set'}</p>
                }
              </div>
              <div>
                <label className="label">Current Role</label>
                {editing
                  ? <input value={form.currentRole} onChange={(e) => setForm({ ...form, currentRole: e.target.value })} className="input" />
                  : <p className="text-sm text-slate-700 dark:text-slate-300">{user?.currentRole || 'Not set'}</p>
                }
              </div>
            </>
          )}
          {isStudent && (
            <>
              <div>
                <label className="label">CGPA</label>
                {editing
                  ? <input type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} className="input" />
                  : <p className="text-sm text-slate-700 dark:text-slate-300">{profile?.cgpa ?? 'Not set'}</p>
                }
              </div>
              <div>
                <label className="label">Active Backlogs</label>
                {editing
                  ? <input type="number" min="0" value={form.backlogs} onChange={(e) => setForm({ ...form, backlogs: e.target.value })} className="input" />
                  : <p className="text-sm text-slate-700 dark:text-slate-300">{profile?.backlogs ?? 'Not set'}</p>
                }
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="card p-5">
        <h3 className="section-title mb-3">About</h3>
        {editing
          ? <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input resize-none" placeholder="Tell us about yourself…" maxLength={1000} />
          : <p className="text-sm text-slate-600 dark:text-slate-400">{profile?.bio || 'No bio added yet.'}</p>
        }
      </div>

      {/* Skills */}
      <div className="card p-5">
        <h3 className="section-title mb-3"><Code className="h-4 w-4 inline mr-1" />Skills</h3>
        {editing ? (
          <>
            <div className="flex gap-2 mb-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); }}} className="input flex-1" placeholder="Add skill…" />
              <button type="button" onClick={addSkill} className="btn-secondary">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.skills || []).map((s) => (
                <span key={s} className="badge-blue flex items-center gap-1">
                  {s} <button onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* Students: skills stored in StudentProfile; Alumni: skills stored on User */}
            {(() => {
              const displaySkills = isStudent ? profile?.skills : user?.skills;
              return displaySkills?.length > 0
                ? displaySkills.map((s) => <span key={s} className="badge-blue">{s}</span>)
                : <p className="text-sm text-slate-400">No skills added.</p>;
            })()}
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="card p-5">
        <h3 className="section-title mb-3">Social Links</h3>
        {editing ? (
          <div className="space-y-3">
            {[
              { key: 'linkedinUrl', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/...' },
              { key: 'githubUrl', label: 'GitHub', icon: Github, placeholder: 'https://github.com/...' },
              { key: 'portfolioUrl', label: 'Portfolio / Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
            ].map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="label flex items-center gap-1"><Icon className="h-3 w-3" />{label}</label>
                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input" placeholder={placeholder} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4">
            {profile?.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm"><Linkedin className="h-4 w-4" />LinkedIn</a>}
            {profile?.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 text-sm"><Github className="h-4 w-4" />GitHub</a>}
            {profile?.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 text-sm"><Globe className="h-4 w-4" />Portfolio</a>}
            {!profile?.linkedinUrl && !profile?.githubUrl && !profile?.portfolioUrl && <p className="text-sm text-slate-400">No links added yet.</p>}
          </div>
        )}
      </div>

      {/* Mentorship interests (alumni) */}
      {isAlumni && (
        <div className="card p-5">
          <h3 className="section-title mb-3">Mentorship Interests</h3>
          {editing
            ? <textarea rows={3} value={form.mentorshipInterests} onChange={(e) => setForm({ ...form, mentorshipInterests: e.target.value })} className="input resize-none" placeholder="What topics/areas are you open to mentoring?" maxLength={500} />
            : <p className="text-sm text-slate-600 dark:text-slate-400">{profile?.mentorshipInterests || 'Not specified.'}</p>
          }
        </div>
      )}
    </div>
  );
}
