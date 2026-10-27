import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { TrendingUp, Users, Star, Briefcase, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mentorshipApi, jobsApi, professionalUpdatesApi, getErrorMessage } from '../../services/api';
import { StatCard, CardSkeleton, EmptyState, StatusBadge } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { formatRelativeTime } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function AlumniDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mentorships, setMentorships] = useState([]);
  const [jobSubmissions, setJobSubmissions] = useState([]);
  const [myUpdates, setMyUpdates] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [mentRes, jobRes, updRes] = await Promise.allSettled([
        mentorshipApi.getRequests({ limit: 10 }),
        jobsApi.getMyJobSubmissions(),
        professionalUpdatesApi.getMine(),
      ]);
      if (mentRes.status === 'fulfilled') setMentorships(mentRes.value.data.requests || []);
      if (jobRes.status === 'fulfilled') setJobSubmissions(jobRes.value.data.jobs || []);
      if (updRes.status === 'fulfilled') setMyUpdates(updRes.value.data.updates || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const pendingMentorships = mentorships.filter((m) => m.status === 'pending');
  const acceptedMentorships = mentorships.filter((m) => m.status === 'accepted');
  const approvedJobs = jobSubmissions.filter((j) => j.status === 'approved');

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">{user?.currentRole || 'Alumni'}{user?.currentCompany ? ` @ ${user.currentCompany}` : ''}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Pending Mentorship" value={pendingMentorships.length} icon={Star} color="yellow" subtitle="Requests awaiting your review" />
        <StatCard title="Active Mentorships" value={acceptedMentorships.length} icon={Users} color="green" />
        <StatCard title="Approved Job Posts" value={approvedJobs.length} icon={CheckCircle} color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending mentorship requests */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Pending Requests</h2>
            <Link to="mentorship" className="text-sm text-brand-600 font-medium">View all →</Link>
          </div>
          {pendingMentorships.length === 0 ? (
            <EmptyState icon={Star} title="No pending requests" description="New mentorship requests will appear here." />
          ) : (
            <div className="space-y-3">
              {pendingMentorships.slice(0, 4).map((req) => (
                <div key={req._id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                  <Avatar user={req.student} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{req.student?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{req.message?.slice(0, 80)}…</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(req.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job submissions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Job Submissions</h2>
            <Link to="job-submissions" className="text-sm text-brand-600 font-medium">View all →</Link>
          </div>
          {jobSubmissions.length === 0 ? (
            <EmptyState icon={Briefcase} title="No job submissions" description="Post job vacancies from your company." />
          ) : (
            <div className="space-y-2">
              {jobSubmissions.slice(0, 5).map((job) => (
                <div key={job._id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{job.company}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Professional updates */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">My Professional Updates</h2>
          <Link to="professional-updates" className="text-sm text-brand-600 font-medium">Manage →</Link>
        </div>
        {myUpdates.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No updates yet" description="Share your career milestones with the college community." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {myUpdates.slice(0, 4).map((u) => (
              <div key={u._id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={u.status} />
                  <span className="badge-gray capitalize">{u.type}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{u.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(u.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
