import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Users, GraduationCap, Briefcase, Star, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { adminApi, getErrorMessage } from '../../services/api';
import { StatCard, CardSkeleton, EmptyState } from '../../components/ui';
import { formatRelativeTime } from '../../utils/helpers';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then((res) => setStats(res.data.stats))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and quick actions.</p>
      </div>

      {/* User stats */}
      <div>
        <h2 className="section-title mb-3">Users</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Students" value={stats?.totalStudents} icon={GraduationCap} color="blue" />
          <StatCard title="Total Alumni" value={stats?.totalAlumni} icon={Users} color="purple" />
          <StatCard title="Active Users" value={stats?.activeUsers} icon={CheckCircle} color="green" />
          <StatCard title="Deactivated" value={stats?.deactivatedUsers} icon={AlertTriangle} color="red" />
        </div>
      </div>

      {/* Jobs & placements */}
      <div>
        <h2 className="section-title mb-3">Jobs & Placements</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pending Job Approvals" value={stats?.pendingJobs} icon={Clock} color="yellow" subtitle="Needs review" />
          <StatCard title="Active Jobs" value={stats?.activeJobs} icon={Briefcase} color="blue" />
          <StatCard title="Total Applications" value={stats?.totalApplications} icon={TrendingUp} color="green" />
          <StatCard title="Placements (Selected)" value={stats?.totalPlacements} icon={Star} color="purple" />
        </div>
      </div>

      {/* Mentorship stats */}
      <div>
        <h2 className="section-title mb-3">Mentorship</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Pending Mentorships" value={stats?.pendingMentorships} icon={Clock} color="yellow" />
          <StatCard title="Active Mentorships" value={stats?.activeMentorships} icon={Star} color="green" />
          <StatCard title="Prof. Updates Pending" value={stats?.pendingProfessionalUpdates} icon={AlertTriangle} color="yellow" subtitle="Awaiting review" />
        </div>
      </div>

      {/* Quick action links */}
      <div>
        <h2 className="section-title mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Review Job Approvals', path: 'jobs/approvals', badge: stats?.pendingJobs, color: 'yellow' },
            { label: 'Review Prof. Updates', path: 'professional-updates', badge: stats?.pendingProfessionalUpdates, color: 'yellow' },
            { label: 'Student Management', path: 'students', color: 'blue' },
            { label: 'Alumni Management', path: 'alumni', color: 'purple' },
            { label: 'Application Management', path: 'applications', color: 'green' },
            { label: 'Reports & Exports', path: 'reports', color: 'blue' },
          ].map(({ label, path, badge, color }) => (
            <Link key={path} to={path} className="card p-4 hover:shadow-md transition-shadow flex items-center justify-between group">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-600 transition-colors">{label}</span>
              {badge > 0 && (
                <span className="h-6 min-w-[1.5rem] px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
