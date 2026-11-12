import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, Clock, Briefcase, CheckCircle, XCircle,
  ExternalLink, Users, Building2, AlertTriangle, Send
} from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner, EmptyState, StatusBadge } from '../../components/ui';
import ExternalApplyConfirmModal from '../../components/ExternalApplyConfirmModal';
import { formatDate } from '../../utils/helpers';

export default function JobDetailPage({ adminView = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // ── External apply confirmation state ─────────────────────────────────────
  // pendingConfirm: true when student has opened the external tab and we
  // are waiting for them to return and answer the confirmation popup.
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Track whether we have already attached the visibilitychange listener
  // so we don't fire the popup multiple times.
  const confirmListenerAttached = useRef(false);

  useEffect(() => {
    jobsApi.getJob(id)
      .then((res) => {
        setData(res.data);
        // If backend returns myApplication (future-proof), show Applied
        if (res.data.myApplication) setApplied(true);
      })
      .catch(() => toast.error('Job not found.'))
      .finally(() => setLoading(false));

    // Check if student already applied to this job via getMyApplications
    if (user?.role === 'student') {
      jobsApi.getMyApplications()
        .then((r) => {
          const alreadyApplied = r.data.applications?.some(
            (a) => a.job?._id === id || a.job === id
          );
          if (alreadyApplied) setApplied(true);
        })
        .catch(() => {}); // silent — not critical
    }
  }, [id]);

  // Cleanup visibility listener on unmount / job change
  useEffect(() => {
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      confirmListenerAttached.current = false;
    };
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await jobsApi.applyToJob(id, { formData });
      toast.success('Application submitted successfully!');
      setApplied(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  // Called once when the student returns to the GradLink tab
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      confirmListenerAttached.current = false;
      setPendingConfirm(true);
    }
  }

  // Open the external URL and start listening for tab-return
  const handleExternalApplyClick = (externalUrl) => {
    if (applied) return; // already confirmed — no second popup
    // Open external site in new tab
    window.open(externalUrl, '_blank', 'noopener,noreferrer');
    // Attach the visibility listener only once
    if (!confirmListenerAttached.current) {
      confirmListenerAttached.current = true;
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  };

  // Student clicked "Yes, Applied"
  const handleConfirmYes = async () => {
    setConfirming(true);
    try {
      await jobsApi.confirmExternalApplication(id);
      setApplied(true);
      setPendingConfirm(false);
      toast.success('Application confirmed and recorded in GradLink!');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPendingConfirm(false);
    } finally {
      setConfirming(false);
    }
  };

  // Student clicked "No, Not Yet"
  const handleConfirmNo = () => {
    setPendingConfirm(false);
    toast.info('No problem. You can apply again when ready.');
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return <EmptyState icon={Briefcase} title="Job not found" />;

  const { job, eligibility } = data;
  const isExpired = new Date(job.deadline) < new Date();
  const canApplyInternal = user?.role === 'student' && job.applicationMethod === 'internal' && !isExpired && !applied;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-slate-600 dark:text-slate-400">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
              {job.location && <><span>·</span><MapPin className="h-4 w-4" /><span>{job.location}</span></>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge-blue capitalize">{job.jobType}</span>
            {isExpired && <span className="badge-red">Expired</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-5">
          <Clock className="h-4 w-4" />
          <span>{isExpired ? 'Deadline passed' : `Apply by ${formatDate(job.deadline)}`}</span>
        </div>

        {/* Eligibility check */}
        {eligibility && (
          <div className={`rounded-lg p-4 mb-4 ${eligibility.eligible ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              {eligibility.eligible
                ? <CheckCircle className="h-4 w-4 text-green-600" />
                : <XCircle className="h-4 w-4 text-red-600" />
              }
              <span className={`text-sm font-medium ${eligibility.eligible ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {eligibility.eligible ? 'You are eligible for this position.' : 'You are not eligible for this position.'}
              </span>
            </div>
            {!eligibility.eligible && (
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                {eligibility.reasons.map((r, i) => <li key={i} className="flex items-start gap-2"><span className="mt-0.5">•</span>{r}</li>)}
              </ul>
            )}
            {job.applicationMethod === 'external' && !eligibility.eligible && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                GradLink cannot prevent you from applying externally, but you may not meet the listed requirements.
              </p>
            )}
          </div>
        )}

        {/* Apply button */}
        {!isExpired && user?.role === 'student' && (
          <>
            {job.applicationMethod === 'external' && job.externalUrl && (
              <div>
                {applied ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" /> Applied (Externally Confirmed)
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleExternalApplyClick(job.externalUrl)}
                      className="btn-primary"
                    >
                      <ExternalLink className="h-4 w-4" /> Apply on External Site
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-0.5">
                      You will be redirected to an external website. Return here to confirm your application.
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Description */}
      <div className="card p-6">
        <h2 className="section-title mb-3">About the Role</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">{job.description}</p>
      </div>

      {/* Skills */}
      {job.requiredSkills?.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-3">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map((s) => <span key={s} className="badge-blue">{s}</span>)}
          </div>
        </div>
      )}

      {/* Eligibility criteria */}
      <div className="card p-6">
        <h2 className="section-title mb-3">Eligibility Criteria</h2>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {job.eligibleDepartments?.length > 0 && (
            <p><span className="font-medium text-slate-700 dark:text-slate-300">Departments:</span> {job.eligibleDepartments.join(', ')}</p>
          )}
          {job.eligibleGraduationYears?.length > 0 && (
            <p><span className="font-medium text-slate-700 dark:text-slate-300">Graduation Years:</span> {job.eligibleGraduationYears.join(', ')}</p>
          )}
          {job.minCGPA && <p><span className="font-medium text-slate-700 dark:text-slate-300">Min CGPA:</span> {job.minCGPA}</p>}
          {job.minPercentage && <p><span className="font-medium text-slate-700 dark:text-slate-300">Min Percentage:</span> {job.minPercentage}%</p>}
          {job.maxBacklogs != null && <p><span className="font-medium text-slate-700 dark:text-slate-300">Max Backlogs:</span> {job.maxBacklogs}</p>}
          {job.additionalEligibility && <p><span className="font-medium text-slate-700 dark:text-slate-300">Additional:</span> {job.additionalEligibility}</p>}
        </div>
      </div>

      {/* Internal Application Form */}
      {canApplyInternal && eligibility?.eligible && job.applicationFormFields?.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Application Form</h2>
          <div className="space-y-4">
            {job.applicationFormFields.sort((a, b) => a.order - b.order).map((field) => (
              <div key={field._id || field.label}>
                <label className="label">{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</label>
                {field.fieldType === 'textarea' ? (
                  <textarea
                    rows={4}
                    className="input resize-none"
                    required={field.required}
                    onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                  />
                ) : field.fieldType === 'select' ? (
                  <select
                    className="input"
                    required={field.required}
                    onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.fieldType || 'text'}
                    className="input"
                    required={field.required}
                    onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <button onClick={handleApply} disabled={applying} className="btn-primary">
              {applying ? <LoadingSpinner size="sm" /> : <><Send className="h-4 w-4" /> Submit Application</>}
            </button>
          </div>
        </div>
      )}

      {canApplyInternal && eligibility?.eligible && !job.applicationFormFields?.length && (
        <div className="card p-6">
          <h2 className="section-title mb-3">Apply via GradLink</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Click below to submit your application through GradLink.</p>
          <button onClick={handleApply} disabled={applying} className="btn-primary">
            {applying ? <LoadingSpinner size="sm" /> : <><Send className="h-4 w-4" /> Submit Application</>}
          </button>
        </div>
      )}

      {/* External application confirmation modal */}
      {user?.role === 'student' && (
        <ExternalApplyConfirmModal
          open={pendingConfirm}
          jobTitle={job?.title}
          company={job?.company}
          confirming={confirming}
          onConfirm={handleConfirmYes}
          onDecline={handleConfirmNo}
        />
      )}
    </div>
  );
}
