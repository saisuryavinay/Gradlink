import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8', xl: 'h-12 w-12' };
  return <Loader2 className={`animate-spin text-brand-600 ${sizes[size]} ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="xl" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      </div>
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`skeleton h-4 flex-1 ${j === 0 ? 'max-w-[40px] rounded-full' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state"
    >
      {Icon && (
        <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
          <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>}
      {action}
    </motion.div>
  );
}

export function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colors = {
    blue: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value ?? 0}</p>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function Badge({ children, variant = 'gray' }) {
  const variants = {
    blue: 'badge-blue',
    green: 'badge-green',
    yellow: 'badge-yellow',
    red: 'badge-red',
    gray: 'badge-gray',
    purple: 'badge-purple',
  };
  return <span className={variants[variant] || 'badge-gray'}>{children}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', variant: 'yellow' },
    approved: { label: 'Approved', variant: 'green' },
    rejected: { label: 'Rejected', variant: 'red' },
    accepted: { label: 'Accepted', variant: 'green' },
    withdrawn: { label: 'Withdrawn', variant: 'gray' },
    cancelled: { label: 'Cancelled', variant: 'gray' },
    submitted: { label: 'Submitted', variant: 'blue' },
    shortlisted: { label: 'Shortlisted', variant: 'purple' },
    selected: { label: 'Selected', variant: 'green' },
    placed: { label: 'Placed', variant: 'green' },
    'not-placed': { label: 'Not Placed', variant: 'gray' },
    'in-progress': { label: 'In Progress', variant: 'yellow' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'gray' };
  return <Badge variant={variant}>{label}</Badge>;
}
