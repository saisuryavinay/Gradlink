import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Star, Eye } from 'lucide-react';
import { mentorshipApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner, StatusBadge } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { formatRelativeTime } from '../../utils/helpers';

export default function AdminMentorshipPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await mentorshipApi.adminGetAll(params);
      setRequests(res.data.requests || []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [statusFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Mentorship Monitoring</h1>
        <p className="page-subtitle">Observe all mentorship activity across the platform.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'accepted', 'rejected', 'withdrawn'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        : requests.length === 0 ? <EmptyState icon={Star} title="No mentorship requests" />
        : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Alumni</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Message</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">When</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req._id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar user={req.student} size="xs" />
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{req.student?.name}</p>
                            <p className="text-xs text-slate-500">{req.student?.department} · {req.student?.graduationYear}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar user={req.alumni} size="xs" />
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{req.alumni?.name}</p>
                            <p className="text-xs text-slate-500">{req.alumni?.currentCompany}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={req.status} /></td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="text-xs text-slate-500 truncate">{req.message}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{formatRelativeTime(req.createdAt)}</td>
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
