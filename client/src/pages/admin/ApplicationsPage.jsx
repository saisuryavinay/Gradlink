import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FolderOpen, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { adminApi, jobsApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner, StatusBadge } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { formatDate } from '../../utils/helpers';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getAllApplications(params);
      setApplications(res.data.applications || []);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await jobsApi.updateApplicationStatus(id, { status });
      toast.success(`Status updated to ${status}.`);
      fetchApps();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUpdatingId(null); }
  };

  const statuses = ['', 'submitted', 'shortlisted', 'selected', 'rejected'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Application Management</h1>
        <p className="page-subtitle">{total} total applications</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-9" placeholder="Search company/student…" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input max-w-[160px]">
          <option value="">All Statuses</option>
          {['submitted', 'shortlisted', 'selected', 'rejected'].map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        : applications.length === 0 ? <EmptyState icon={FolderOpen} title="No applications found" />
        : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Company / Role</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Applied</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar user={app.student} size="xs" />
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{app.student?.name}</p>
                            <p className="text-xs text-slate-500">{app.student?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{app.job?.company}</p>
                        <p className="text-xs text-slate-500">{app.job?.title}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{formatDate(app.submittedAt)}</td>
                      <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                      <td className="py-3 px-4">
                        <select
                          defaultValue={app.status}
                          disabled={updatingId === app._id}
                          onChange={(e) => updateStatus(app._id, e.target.value)}
                          className="input text-xs py-1 max-w-[130px]"
                        >
                          {['submitted', 'shortlisted', 'selected', 'rejected'].map((s) => (
                            <option key={s} value={s} className="capitalize">{s}</option>
                          ))}
                        </select>
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
