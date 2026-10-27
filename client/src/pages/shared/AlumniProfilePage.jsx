import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, Briefcase, Linkedin, Github, Globe,
  Star, BookOpen, Award, Code, ChevronDown, ChevronUp
} from 'lucide-react';
import { profileApi, mentorshipApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import { LoadingSpinner, EmptyState } from '../../components/ui';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-5">
      <h3 className="section-title flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4 w-4 text-brand-500" />} {title}
      </h3>
      {children}
    </div>
  );
}

export default function AlumniProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    profileApi.getAlumniProfile(id)
      .then(res => setData(res.data))
      .catch(() => toast.error('Could not load profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  const sendRequest = async () => {
    if (!message.trim() || message.trim().length < 20) {
      toast.error('Please write a message of at least 20 characters.');
      return;
    }
    setSending(true);
    try {
      await mentorshipApi.createRequest({ alumniId: id, message: message.trim() });
      toast.success('Mentorship request sent!');
      setShowRequestForm(false);
      setMessage('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
  );

  if (!data) return (
    <EmptyState icon={Star} title="Profile not found" description="This alumni profile does not exist." />
  );

  const { user: alumniUser, profile } = data;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar user={alumniUser} size="2xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{alumniUser.name}</h1>
            {alumniUser.currentRole && (
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                <Briefcase className="h-4 w-4" /> {alumniUser.currentRole}
                {alumniUser.currentCompany && <><span className="text-slate-300 dark:text-slate-600">·</span> <Building2 className="h-4 w-4" /> {alumniUser.currentCompany}</>}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {alumniUser.department && <span className="badge-gray">{alumniUser.department}</span>}
              {alumniUser.graduationYear && <span className="badge-gray">Class of {alumniUser.graduationYear}</span>}
            </div>
            <div className="flex gap-3 mt-3">
              {profile?.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {profile?.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 dark:hover:text-slate-300">
                  <Github className="h-5 w-5" />
                </a>
              )}
              {profile?.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-800 dark:hover:text-slate-300">
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {user?.role === 'student' && (
            <div className="flex-shrink-0">
              <button onClick={() => setShowRequestForm(!showRequestForm)} className="btn-primary">
                <Star className="h-4 w-4" /> Request Mentorship
              </button>
            </div>
          )}
        </div>

        {showRequestForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="label">Message to {alumniUser.name.split(' ')[0]}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
              className="input resize-none mb-2"
              placeholder="Explain what guidance you're looking for, your background, and what you hope to learn…"
            />
            <p className="text-xs text-slate-400 mb-3">{message.length}/1000 characters · minimum 20</p>
            <div className="flex gap-2">
              <button onClick={sendRequest} disabled={sending} className="btn-primary">
                {sending ? <LoadingSpinner size="sm" /> : 'Send Request'}
              </button>
              <button onClick={() => setShowRequestForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Skills */}
      {alumniUser.skills?.length > 0 && (
        <Section title="Skills" icon={Code}>
          <div className="flex flex-wrap gap-2">
            {alumniUser.skills.map((s) => <span key={s} className="badge-blue">{s}</span>)}
          </div>
        </Section>
      )}

      {/* Mentorship */}
      {(profile?.mentorshipAreas?.length > 0 || profile?.mentorshipInterests) && (
        <Section title="Mentorship" icon={Star}>
          {profile.mentorshipInterests && <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{profile.mentorshipInterests}</p>}
          {profile.mentorshipAreas?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.mentorshipAreas.map((a) => <span key={a} className="badge-purple">{a}</span>)}
            </div>
          )}
        </Section>
      )}

      {/* Career Journey */}
      {profile?.careerJourney && (
        <Section title="Career Journey" icon={Briefcase}>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{profile.careerJourney}</p>
        </Section>
      )}

      {/* Work Experience */}
      {profile?.workExperience?.length > 0 && (
        <Section title="Work Experience" icon={Building2}>
          <div className="space-y-4">
            {profile.workExperience.map((w, i) => (
              <div key={i} className="border-l-2 border-brand-200 dark:border-brand-800 pl-4">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{w.role}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{w.company}</p>
                <p className="text-xs text-slate-400">{w.from} — {w.to || 'Present'}</p>
                {w.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{w.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {profile?.projects?.length > 0 && (
        <Section title="Projects" icon={Code}>
          <div className="space-y-3">
            {profile.projects.map((p, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="font-medium text-slate-800 dark:text-slate-200">{p.title}</p>
                {p.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{p.description}</p>}
                {p.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.technologies.map((t) => <span key={t} className="badge-gray">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
