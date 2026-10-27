import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BookmarkX, Briefcase, Clock } from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { CardSkeleton, EmptyState } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsApi.getSavedJobs()
      .then((res) => setSavedJobs(res.data.savedJobs || []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const unsave = async (jobId) => {
    try {
      await jobsApi.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((s) => s.job?._id !== jobId));
      toast.success('Removed from saved jobs.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Saved Jobs</h1>
        <p className="page-subtitle">{savedJobs.length} saved</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : savedJobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No saved jobs" description="Browse jobs and click the bookmark icon to save them here." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {savedJobs.map((s) => {
            const job = s.job;
            if (!job) return null;
            const isExpired = new Date(job.deadline) < new Date();
            return (
              <div key={s._id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <Link to={`../jobs/${job._id}`} className="font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-600 transition-colors">
                      {job.title}
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                  </div>
                  <button onClick={() => unsave(job._id)} className="btn-ghost p-1.5 text-red-500 hover:text-red-600 flex-shrink-0" title="Remove">
                    <BookmarkX className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="badge-gray capitalize">{job.jobType}</span>
                  {isExpired ? <span className="badge-red">Expired</span> : <span className="badge-green">Active</span>}
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3" /> {isExpired ? 'Expired' : `Deadline: ${formatDate(job.deadline)}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
