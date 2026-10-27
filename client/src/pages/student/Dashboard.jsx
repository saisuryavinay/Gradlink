import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Star, FileText, TrendingUp, Clock, Zap, ArrowRight, Users, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { jobsApi, mentorshipApi, updatesApi, professionalUpdatesApi, getErrorMessage } from '../../services/api';
import { StatCard, CardSkeleton, EmptyState, StatusBadge } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { formatDate, formatRelativeTime } from '../../utils/helpers';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [mentorshipReqs, setMentorshipReqs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [profUpdates, setProfUpdates] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [appsRes, mentRes, jobsRes, updRes, profRes] = await Promise.allSettled([
          jobsApi.getMyApplications(),
          mentorshipApi.getRequests({ limit: 5 }),
          jobsApi.getJobs({ limit: 6 }),
          updatesApi.getPlacementUpdates(),
          professionalUpdatesApi.getAll({ limit: 5 }),
        ]);
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data.applications || []);
        if (mentRes.status === 'fulfilled') setMentorshipReqs(mentRes.value.data.requests || []);
        if (jobsRes.status === 'fulfilled') setRecentJobs(jobsRes.value.data.jobs || []);
        if (updRes.status === 'fulfilled') setUpdates(updRes.value.data.updates?.slice(0, 3) || []);
        if (profRes.status === 'fulfilled') setProfUpdates(profRes.value.data.updates?.slice(0, 3) || []);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const placementStatus = applications.some((a) => a.status === 'selected')
    ? 'Placed'
    : applications.some((a) => ['submitted', 'pending', 'shortlisted'].includes(a.status))
    ? 'In Progress'
    : 'Not Placed';

  const statusColor = { Placed: 'text-green-600', 'In Progress': 'text-yellow-600', 'Not Placed': 'text-slate-500' };

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{user?.department} · {user?.graduationYear} · <span className={`font-medium ${statusColor[placementStatus]}`}>{placementStatus}</span></p>
        </div>
        <Link to="ai-resume" className="btn-primary hidden sm:inline-flex">
          <Zap className="h-4 w-4" /> AI Resume Analyzer
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applications" value={applications.length} icon={FileText} color="blue" />
        <StatCard title="Shortlisted" value={applications.filter((a) => a.status === 'shortlisted').length} icon={TrendingUp} color="yellow" />
        <StatCard title="Selected" value={applications.filter((a) => a.status === 'selected').length} icon={Star} color="green" />
        <StatCard title="Mentorship Requests" value={mentorshipReqs.length} icon={Users} color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Recent Opportunities</h2>
              <Link to="jobs/placement" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentJobs.length === 0 ? (
              <EmptyState icon={Briefcase} title="No jobs yet" description="Check back soon for new opportunities." />
            ) : (
              <div className="space-y-3">
                {recentJobs.slice(0, 4).map((job) => (
                  <Link key={job._id} to={`jobs/${job._id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 transition-colors">{job.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{job.company} · {job.location}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="badge-blue capitalize hidden sm:inline-flex">{job.jobType}</span>
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-400">{formatDate(job.deadline)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Placement updates */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2"><Megaphone className="h-4 w-4 text-brand-500" />Updates</h2>
            </div>
            {updates.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No updates yet.</p>
            ) : (
              <div className="space-y-3">
                {updates.map((u) => (
                  <div key={u._id} className={`text-sm ${u.pinned ? 'text-brand-700 dark:text-brand-300 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                    {u.pinned && <span className="badge-blue mr-1">Pinned</span>}
                    {u.title}
                    <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(u.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Professional updates */}
          <div className="card p-5">
            <h2 className="section-title mb-3">Alumni Updates</h2>
            {profUpdates.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No updates from alumni yet.</p>
            ) : (
              <div className="space-y-3">
                {profUpdates.map((u) => (
                  <div key={u._id} className="flex gap-2">
                    <Avatar user={u.author} size="xs" className="flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{u.author?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applications */}
      {applications.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Applications</h2>
            <Link to="applications" className="text-sm text-brand-600 font-medium flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Company</th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Role</th>
                  <th className="text-left py-2 pr-4 font-medium text-slate-500 dark:text-slate-400">Applied</th>
                  <th className="text-left py-2 font-medium text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 4).map((app) => (
                  <tr key={app._id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">{app.job?.company}</td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{app.job?.title}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-500">{formatDate(app.submittedAt)}</td>
                    <td className="py-2"><StatusBadge status={app.status} /></td>
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
