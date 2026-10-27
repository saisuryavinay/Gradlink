import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Clock, CheckCircle, XCircle, Trash2, Edit2, X, Save } from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner, StatusBadge } from '../../components/ui';
import { formatDate, DEPARTMENTS, GRADUATION_YEARS } from '../../utils/helpers';
import { useForm } from 'react-hook-form';

const defaultJobForm = {
  title: '', company: '', location: '', description: '', jobType: 'full-time',
  category: 'alumni-posted', applicationMethod: 'external', externalUrl: '',
  requiredSkills: [], eligibleDepartments: [], eligibleGraduationYears: [],
  minCGPA: '', maxBacklogs: '', deadline: '',
};

function JobForm({ initialData, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initialData || defaultJobForm);
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.requiredSkills.includes(s)) {
      setForm({ ...form, requiredSkills: [...form.requiredSkills, s] });
      setSkillInput('');
    }
  };

  const toggleDept = (d) => {
    setForm({ ...form, eligibleDepartments: form.eligibleDepartments.includes(d) ? form.eligibleDepartments.filter((x) => x !== d) : [...form.eligibleDepartments, d] });
  };

  return (
    <div className="card p-6 space-y-4">
      <h3 className="section-title">{initialData ? 'Edit Job Posting' : 'Post a Job'}</h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Job Title <span className="text-red-500">*</span></label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. Software Engineer" />
        </div>
        <div>
          <label className="label">Company <span className="text-red-500">*</span></label>
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input" placeholder="Your company name" />
        </div>
        <div>
          <label className="label">Location</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" placeholder="e.g. Hyderabad / Remote" />
        </div>
        <div>
          <label className="label">Job Type</label>
          <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className="input">
            {['full-time', 'part-time', 'internship', 'contract', 'remote'].map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Application Method</label>
          <select value={form.applicationMethod} onChange={(e) => setForm({ ...form, applicationMethod: e.target.value })} className="input">
            <option value="external">External (link)</option>
            <option value="internal">Internal (via GradLink)</option>
          </select>
        </div>
        {form.applicationMethod === 'external' && (
          <div>
            <label className="label">External URL <span className="text-red-500">*</span></label>
            <input value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} className="input" placeholder="https://..." type="url" />
          </div>
        )}
        <div>
          <label className="label">Application Deadline <span className="text-red-500">*</span></label>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" min={new Date().toISOString().split('T')[0]} />
        </div>
        <div>
          <label className="label">Min CGPA</label>
          <input type="number" step="0.01" min="0" max="10" value={form.minCGPA} onChange={(e) => setForm({ ...form, minCGPA: e.target.value })} className="input" placeholder="e.g. 7.0" />
        </div>
        <div>
          <label className="label">Max Backlogs Allowed</label>
          <input type="number" min="0" value={form.maxBacklogs} onChange={(e) => setForm({ ...form, maxBacklogs: e.target.value })} className="input" placeholder="e.g. 0" />
        </div>
      </div>

      <div>
        <label className="label">Job Description <span className="text-red-500">*</span></label>
        <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" placeholder="Describe the role, responsibilities, and company…" />
      </div>

      <div>
        <label className="label">Required Skills</label>
        <div className="flex gap-2 mb-2">
          <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className="input flex-1" placeholder="Add skill…" />
          <button type="button" onClick={addSkill} className="btn-secondary">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.requiredSkills.map((s) => (
            <span key={s} className="badge-blue flex items-center gap-1">
              {s} <button type="button" onClick={() => setForm({ ...form, requiredSkills: form.requiredSkills.filter((x) => x !== s) })}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Eligible Departments (select all that apply)</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DEPARTMENTS.map((d) => (
            <button
              type="button" key={d}
              onClick={() => toggleDept(d)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${form.eligibleDepartments.includes(d) ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => onSave(form)} disabled={saving} className="btn-primary">
          {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Submit for Approval</>}
        </button>
        <button onClick={onCancel} className="btn-secondary"><X className="h-4 w-4" /> Cancel</button>
      </div>
    </div>
  );
}

export default function JobSubmissionsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsApi.getMyJobSubmissions();
      setJobs(res.data.jobs || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleSave = async (form) => {
    if (!form.title || !form.company || !form.deadline || !form.description) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      if (editingJob) {
        await jobsApi.updateJob(editingJob._id, form);
        toast.success('Job updated. Awaiting re-approval.');
      } else {
        await jobsApi.createJob(form);
        toast.success('Job submitted for admin approval.');
      }
      setShowForm(false);
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Job Submissions</h1>
          <p className="page-subtitle">Post job vacancies from your company for students.</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditingJob(null); }} className="btn-primary">
            <Plus className="h-4 w-4" /> Post a Job
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <JobForm
              initialData={editingJob || defaultJobForm}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingJob(null); }}
              saving={saving}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No job submissions" description="Post your first job vacancy for students to apply." />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <motion.div key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{job.title}</h3>
                    <StatusBadge status={job.status} />
                    {new Date(job.deadline) < new Date() && <span className="badge-red">Expired</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{job.company} · {job.location}</p>
                  <p className="text-xs text-slate-400 mt-1">Deadline: {formatDate(job.deadline)}</p>
                  {job.status === 'rejected' && job.reviewNote && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">Rejection note: {job.reviewNote}</p>
                  )}
                </div>
                {(job.status === 'pending' || job.status === 'rejected') && (
                  <button onClick={() => { setEditingJob(job); setShowForm(true); }} className="btn-ghost p-1.5 flex-shrink-0">
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
