// Off-Campus Admin Page — browse and manage all approved off-campus jobs
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Briefcase, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function AdminOffCampusPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { category: 'off-campus', page, limit: 20 };
      if (search) params.search = search;
      const res = await jobsApi.getJobs(params);
      setJobs(res.data.jobs || []);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job listing?')) return;
    try {
      await jobsApi.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      toast.success('Job deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Off-Campus Jobs</h1>
        <p className="page-subtitle">{total} listings</p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-9" placeholder="Search…" />
      </div>

      {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        : jobs.length === 0 ? <EmptyState icon={Briefcase} title="No off-campus jobs" />
        : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Company / Role</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Deadline</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4">
                        <Link to={`../jobs/${job._id}`} className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-brand-600">{job.title}</Link>
                        <p className="text-xs text-slate-500">{job.company}</p>
                      </td>
                      <td className="py-3 px-4"><span className="badge-gray capitalize">{job.jobType}</span></td>
                      <td className="py-3 px-4 text-xs text-slate-500">{formatDate(job.deadline)}</td>
                      <td className="py-3 px-4"><StatusBadge status={job.status} /></td>
                      <td className="py-3 px-4">
                        <button onClick={() => deleteJob(job._id)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-slate-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
