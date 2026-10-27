import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { LoadingSpinner } from '../../components/ui';
import { DEPARTMENTS, GRADUATION_YEARS } from '../../utils/helpers';

const blank = {
  title: '', company: '', location: '', description: '',
  jobType: 'full-time', category: 'placement',
  applicationMethod: 'external', externalUrl: '',
  requiredSkills: [], eligibleDepartments: [], eligibleGraduationYears: [],
  minCGPA: '', minPercentage: '', maxBacklogs: '0', additionalEligibility: '', deadline: '',
};

export default function AdminPostJobPage() {
  const [form, setForm] = useState(blank);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.requiredSkills.includes(s)) {
      setForm({ ...form, requiredSkills: [...form.requiredSkills, s] });
      setSkillInput('');
    }
  };

  const toggleDept = (d) =>
    setForm({ ...form, eligibleDepartments: form.eligibleDepartments.includes(d) ? form.eligibleDepartments.filter((x) => x !== d) : [...form.eligibleDepartments, d] });

  const toggleYear = (y) =>
    setForm({ ...form, eligibleGraduationYears: form.eligibleGraduationYears.includes(y) ? form.eligibleGraduationYears.filter((x) => x !== y) : [...form.eligibleGraduationYears, y] });

  const handleSubmit = async () => {
    if (!form.title || !form.company || !form.description || !form.deadline) {
      toast.error('Title, company, description and deadline are required.');
      return;
    }
    if (form.applicationMethod === 'external' && !form.externalUrl) {
      toast.error('External URL is required for external application method.');
      return;
    }
    setSaving(true);
    try {
      await jobsApi.createJob({
        ...form,
        minCGPA: form.minCGPA ? parseFloat(form.minCGPA) : undefined,
        minPercentage: form.minPercentage ? parseFloat(form.minPercentage) : undefined,
        maxBacklogs: form.maxBacklogs !== '' ? parseInt(form.maxBacklogs) : 0,
      });
      toast.success('Job posted and published immediately.');
      navigate('../jobs/approvals');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Post a Job</h1>
        <p className="page-subtitle">Admin-posted jobs are published immediately without approval.</p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Basic Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Job Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={f('title')} className="input" placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <label className="label">Company <span className="text-red-500">*</span></label>
            <input value={form.company} onChange={f('company')} className="input" placeholder="Company name" />
          </div>
          <div>
            <label className="label">Location</label>
            <input value={form.location} onChange={f('location')} className="input" placeholder="e.g. Hyderabad / Remote" />
          </div>
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={f('category')} className="input">
              <option value="placement">Placement Drive</option>
              <option value="off-campus">Off-Campus</option>
              <option value="alumni-posted">Alumni Posted</option>
            </select>
          </div>
          <div>
            <label className="label">Job Type</label>
            <select value={form.jobType} onChange={f('jobType')} className="input">
              {['full-time', 'part-time', 'internship', 'contract', 'remote'].map((t) => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Application Deadline <span className="text-red-500">*</span></label>
            <input type="date" value={form.deadline} onChange={f('deadline')} className="input" min={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        {/* Application Method */}
        <div>
          <label className="label">Application Method</label>
          <div className="flex gap-4">
            {['external', 'internal'].map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="appMethod" value={m} checked={form.applicationMethod === m} onChange={f('applicationMethod')} />
                <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{m} {m === 'external' ? '(redirect to URL)' : '(apply via GradLink)'}</span>
              </label>
            ))}
          </div>
        </div>
        {form.applicationMethod === 'external' && (
          <div>
            <label className="label">External Application URL <span className="text-red-500">*</span></label>
            <input value={form.externalUrl} onChange={f('externalUrl')} className="input" placeholder="https://careers.company.com/apply/..." type="url" />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="label">Job Description <span className="text-red-500">*</span></label>
          <textarea rows={5} value={form.description} onChange={f('description')} className="input resize-none" placeholder="Role, responsibilities, requirements…" />
        </div>

        {/* Skills */}
        <div>
          <label className="label">Required Skills</label>
          <div className="flex gap-2 mb-2">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className="input flex-1" placeholder="Type skill and press Enter…" />
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

        {/* Eligibility */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Min CGPA</label>
            <input type="number" step="0.1" min="0" max="10" value={form.minCGPA} onChange={f('minCGPA')} className="input" placeholder="e.g. 7.0" />
          </div>
          <div>
            <label className="label">Min Percentage</label>
            <input type="number" step="1" min="0" max="100" value={form.minPercentage} onChange={f('minPercentage')} className="input" placeholder="e.g. 60" />
          </div>
          <div>
            <label className="label">Max Backlogs</label>
            <input type="number" min="0" value={form.maxBacklogs} onChange={f('maxBacklogs')} className="input" />
          </div>
        </div>

        {/* Departments */}
        <div>
          <label className="label">Eligible Departments <span className="text-xs text-slate-400">(leave empty = all)</span></label>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map((d) => (
              <button key={d} type="button" onClick={() => toggleDept(d)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${form.eligibleDepartments.includes(d) ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Graduation Years */}
        <div>
          <label className="label">Eligible Graduation Years <span className="text-xs text-slate-400">(leave empty = all)</span></label>
          <div className="flex flex-wrap gap-2">
            {GRADUATION_YEARS.map((y) => (
              <button key={y} type="button" onClick={() => toggleYear(y)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${form.eligibleGraduationYears.includes(y) ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {y}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Additional Eligibility Notes</label>
          <textarea rows={2} value={form.additionalEligibility} onChange={f('additionalEligibility')} className="input resize-none" placeholder="Any other requirements…" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? <LoadingSpinner size="sm" /> : <><Send className="h-4 w-4" /> Post Job</>}
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
