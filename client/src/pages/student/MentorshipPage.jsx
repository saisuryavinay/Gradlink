import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Star, Check, X, Clock, ArrowUpDown } from 'lucide-react';
import { mentorshipApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import { EmptyState, StatusBadge, LoadingSpinner } from '../../components/ui';
import { formatRelativeTime } from '../../utils/helpers';

export default function MentorshipPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await mentorshipApi.getRequests(params);
      setRequests(res.data.requests);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await mentorshipApi.updateStatus(id, { status });
      toast.success(`Request ${status}.`);
      fetchRequests();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  const isStudent = user?.role === 'student';
  const isAlumni = user?.role === 'alumni';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Mentorship Requests</h1>
          <p className="page-subtitle">{isStudent ? 'Track your mentorship requests' : 'Manage requests from students'}</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'accepted', 'rejected', 'withdrawn'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No mentorship requests"
          description={isStudent ? "Browse alumni and send a mentorship request to get started." : "No incoming requests yet."}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar user={isStudent ? req.alumni : req.student} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {isStudent ? req.alumni?.name : req.student?.name}
                      </p>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isStudent
                        ? `${req.alumni?.currentRole || ''} ${req.alumni?.currentCompany ? '@ ' + req.alumni.currentCompany : ''}`
                        : `${req.student?.department || ''} · ${req.student?.graduationYear || ''}`
                      }
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{req.message}</p>
                    {req.alumniNote && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">Note: {req.alumniNote}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">{formatRelativeTime(req.createdAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {isStudent && req.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(req._id, 'withdrawn')}
                      disabled={updating === req._id}
                      className="btn-secondary text-xs"
                    >
                      {updating === req._id ? <LoadingSpinner size="sm" /> : 'Withdraw'}
                    </button>
                  )}
                  {isAlumni && req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(req._id, 'accepted')}
                        disabled={updating === req._id}
                        className="btn-primary text-xs"
                      >
                        {updating === req._id ? <LoadingSpinner size="sm" /> : <><Check className="h-3 w-3" /> Accept</>}
                      </button>
                      <button
                        onClick={() => updateStatus(req._id, 'rejected')}
                        disabled={updating === req._id}
                        className="btn-danger text-xs"
                      >
                        <X className="h-3 w-3" /> Decline
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Student profile snippet for alumni */}
              {isAlumni && req.studentProfile && req.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {req.studentProfile.cgpa != null && <span>CGPA: <strong>{req.studentProfile.cgpa}</strong></span>}
                  {req.studentProfile.backlogs != null && <span>Backlogs: <strong>{req.studentProfile.backlogs}</strong></span>}
                  {req.studentProfile.skills?.length > 0 && (
                    <span>Skills: <strong>{req.studentProfile.skills.slice(0, 4).join(', ')}</strong></span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
