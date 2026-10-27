import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Building2, MapPin } from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function JobApprovalsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [noteModal, setNoteModal] = useState(null); // { jobId, action }
  const [note, setNote] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await jobsApi.getPendingJobs();
      setJobs(res.data.jobs || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const review = async (jobId, status) => {
    setReviewing(jobId);
    try {
      await jobsApi.reviewJob(jobId, { status, adminNote: note });
      toast.success(`Job ${status}.`);
      setNoteModal(null);
      setNote('');
      fetchPending();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReviewing(null);
    }
  };

  const openReview = (jobId, action) => { setNoteModal({ jobId, action }); setNote(''); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Job Approvals</h1>
        <p className="page-subtitle">{jobs.length} pending</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Clock} title="No pending jobs" description="All job submissions have been reviewed." />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <motion.div key={job._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="badge-yellow capitalize">{job.jobType}</span>
                    <span className="badge-gray capitalize">{job.category}</span>
                    <span className="badge-gray capitalize">{job.applicationMethod}</span>
                  </div>
                  <Link to={`../jobs/${job._id}`} className="text-lg font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-600 transition-colors">
                    {job.title}
                  </Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" /> {job.company}
                    {job.location && <><MapPin className="h-3.5 w-3.5 ml-2" /> {job.location}</>}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Deadline: {formatDate(job.deadline)} · Posted by: {job.postedBy?.name || 'Alumni'} ({job.postedBy?.email})
                  </p>
                  {job.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.requiredSkills.map((s) => <span key={s} className="badge-gray">{s}</span>)}
                    </div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">{job.description}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => openReview(job._id, 'approved')} disabled={reviewing === job._id} className="btn-primary text-xs">
                    <CheckCircle className="h-3 w-3" /> Approve
                  </button>
                  <button onClick={() => openReview(job._id, 'rejected')} disabled={reviewing === job._id} className="btn-danger text-xs">
                    <XCircle className="h-3 w-3" /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 max-w-md w-full">
            <h3 className="section-title mb-3 capitalize">{noteModal.action} Job</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Add a note for the submitter (optional for approval, recommended for rejection):</p>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="input resize-none mb-4" placeholder={noteModal.action === 'rejected' ? 'Explain reason for rejection…' : 'Optional approval note…'} />
            <div className="flex gap-3">
              <button onClick={() => review(noteModal.jobId, noteModal.action)} disabled={reviewing === noteModal.jobId} className={noteModal.action === 'approved' ? 'btn-primary' : 'btn-danger'}>
                {reviewing === noteModal.jobId ? <LoadingSpinner size="sm" /> : `Confirm ${noteModal.action}`}
              </button>
              <button onClick={() => setNoteModal(null)} className="btn-secondary">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
