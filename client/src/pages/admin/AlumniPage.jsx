// Alumni management reuses the same table structure, just filtered by role=alumni
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, UserX, UserCheck, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { formatDate, DEPARTMENTS } from '../../utils/helpers';

export default function AlumniPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actingOn, setActingOn] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role: 'alumni', page, limit: 20 };
      if (search) params.search = search;
      const res = await adminApi.getUsers(params);
      setUsers(res.data.users);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deactivate = async (id) => {
    setActingOn(id);
    try { await adminApi.deactivateUser(id); toast.success('Account deactivated.'); fetchUsers(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActingOn(null); }
  };

  const reactivate = async (id) => {
    setActingOn(id);
    try { await adminApi.reactivateUser(id); toast.success('Account reactivated.'); fetchUsers(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActingOn(null); }
  };

  const toggleMentorship = async (id) => {
    setActingOn(id);
    try { await adminApi.toggleMentorshipRestrict(id); toast.success('Mentorship status updated.'); fetchUsers(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActingOn(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Alumni Management</h1>
          <p className="page-subtitle">{total} alumni registered</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-9" placeholder="Search alumni…" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={null} title="No alumni found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Alumni</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Company / Role</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Dept / Year</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar user={u} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{u.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[160px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{u.currentRole || '—'}</p>
                      <p className="text-xs text-slate-500">{u.currentCompany || ''}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                      {u.department} / {u.graduationYear}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                        {u.mentorshipRestricted && <span className="badge-red flex items-center gap-1 mt-1"><Shield className="h-3 w-3" />Restricted</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {u.isActive
                          ? <button onClick={() => deactivate(u._id)} disabled={actingOn === u._id} className="btn-danger text-xs px-2 py-1"><UserX className="h-3 w-3" /></button>
                          : <button onClick={() => reactivate(u._id)} disabled={actingOn === u._id} className="btn-primary text-xs px-2 py-1"><UserCheck className="h-3 w-3" /></button>
                        }
                        <button onClick={() => toggleMentorship(u._id)} disabled={actingOn === u._id} title={u.mentorshipRestricted ? 'Remove restriction' : 'Restrict mentorship'} className="btn-secondary text-xs px-2 py-1">
                          <Shield className="h-3 w-3" />
                        </button>
                      </div>
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
          <span className="text-sm text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
