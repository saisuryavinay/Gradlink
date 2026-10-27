import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, UserX, UserCheck, Shield, RefreshCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner, StatusBadge } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { formatDate, DEPARTMENTS, downloadBlob } from '../../utils/helpers';

function UserRow({ user, onDeactivate, onReactivate, onToggleMentorship, onResetPassword, onDownloadPDF, actingOn }) {
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  return (
    <tr className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Avatar user={user} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{user.department || '—'}</td>
      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{user.graduationYear || '—'}</td>
      <td className="py-3 px-4">
        <span className={user.isActive ? 'badge-green' : 'badge-red'}>{user.isActive ? 'Active' : 'Inactive'}</span>
      </td>
      <td className="py-3 px-4 text-xs text-slate-400">{formatDate(user.createdAt)}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 flex-wrap">
          {user.isActive ? (
            <button onClick={() => onDeactivate(user._id)} disabled={actingOn === user._id} className="btn-danger text-xs px-2 py-1">
              {actingOn === user._id ? <LoadingSpinner size="sm" /> : <UserX className="h-3 w-3" />}
            </button>
          ) : (
            <button onClick={() => onReactivate(user._id)} disabled={actingOn === user._id} className="btn-primary text-xs px-2 py-1">
              {actingOn === user._id ? <LoadingSpinner size="sm" /> : <UserCheck className="h-3 w-3" />}
            </button>
          )}
          <button onClick={() => onToggleMentorship(user._id)} disabled={actingOn === user._id} title={user.mentorshipRestricted ? 'Remove restriction' : 'Restrict mentorship'} className="btn-secondary text-xs px-2 py-1">
            <Shield className="h-3 w-3" />
          </button>
          <button onClick={() => setShowReset(!showReset)} className="btn-secondary text-xs px-2 py-1" title="Reset password">
            <RefreshCw className="h-3 w-3" />
          </button>
          <button onClick={() => onDownloadPDF(user._id, user.name)} className="btn-secondary text-xs px-2 py-1" title="Download profile PDF">
            <Download className="h-3 w-3" />
          </button>
        </div>
        {showReset && (
          <div className="flex gap-1 mt-2">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input text-xs py-1 flex-1" placeholder="New password (min 8)" />
            <button onClick={() => { onResetPassword(user._id, newPassword); setShowReset(false); setNewPassword(''); }} className="btn-primary text-xs px-2">Set</button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function StudentsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actingOn, setActingOn] = useState(null);
  const [exportingCSV, setExportingCSV] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { role: 'student', page, limit: 20 };
      if (search) params.search = search;
      if (dept) params.department = dept;
      const res = await adminApi.getUsers(params);
      setUsers(res.data.users);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, dept, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const deactivate = async (id) => {
    setActingOn(id);
    try { await adminApi.deactivateUser(id); toast.success('User deactivated.'); fetchUsers(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActingOn(null); }
  };

  const reactivate = async (id) => {
    setActingOn(id);
    try { await adminApi.reactivateUser(id); toast.success('User reactivated.'); fetchUsers(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActingOn(null); }
  };

  const toggleMentorship = async (id) => {
    setActingOn(id);
    try { await adminApi.toggleMentorshipRestrict(id); toast.success('Mentorship restriction toggled.'); fetchUsers(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActingOn(null); }
  };

  const resetPassword = async (id, pw) => {
    if (!pw || pw.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    try { await adminApi.resetPassword(id, { newPassword: pw }); toast.success('Password reset.'); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  const downloadPDF = async (id, name) => {
    try {
      const res = await adminApi.exportStudentProfilePDF(id);
      downloadBlob(res.data, `${name.replace(/\s+/g, '_')}_profile.pdf`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const exportCSV = async () => {
    setExportingCSV(true);
    try {
      const res = await adminApi.exportStudentsCSV();
      downloadBlob(res.data, 'students_export.csv');
      toast.success('CSV exported.');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setExportingCSV(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">{total} students registered</p>
        </div>
        <button onClick={exportCSV} disabled={exportingCSV} className="btn-secondary">
          {exportingCSV ? <LoadingSpinner size="sm" /> : <><Download className="h-4 w-4" /> Export CSV</>}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-9" placeholder="Search students…" />
        </div>
        <select value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }} className="input max-w-[160px]">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={null} title="No students found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Year</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow
                    key={u._id} user={u}
                    onDeactivate={deactivate} onReactivate={reactivate}
                    onToggleMentorship={toggleMentorship} onResetPassword={resetPassword}
                    onDownloadPDF={downloadPDF} actingOn={actingOn}
                  />
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
