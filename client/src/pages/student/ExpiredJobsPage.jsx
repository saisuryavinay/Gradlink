import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, Briefcase } from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function ExpiredJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsApi.getJobs({ expired: 'true', limit: 50 })
      .then((res) => setJobs(res.data.jobs || []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Expired Jobs</h1>
        <p className="page-subtitle">These listings are no longer accepting applications.</p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={Clock} title="No expired jobs" description="Past job listings will appear here." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-t border-slate-100 dark:border-slate-700 opacity-70">
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{job.company}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{job.title}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-500 capitalize">{job.category}</td>
                    <td className="py-3 px-4 text-slate-400 dark:text-slate-500">{formatDate(job.deadline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
