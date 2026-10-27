import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, Bookmark, BookmarkCheck, ExternalLink, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { jobsApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CardSkeleton, EmptyState, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/helpers';

function JobCard({ job, onSave, onUnsave, savedIds }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSaved = savedIds.has(job._id);
  const isExpired = new Date(job.deadline) < new Date();
  const [saving, setSaving] = useState(false);

  const toggleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      if (isSaved) { await jobsApi.unsaveJob(job._id); onUnsave(job._id); }
      else { await jobsApi.saveJob(job._id); onSave(job._id); }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card-hover p-5 cursor-pointer"
      onClick={() => navigate(`../jobs/${job._id}`)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{job.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
        </div>
        {user?.role === 'student' && (
          <button onClick={toggleSave} disabled={saving} className="btn-ghost p-1.5 flex-shrink-0" aria-label={isSaved ? 'Unsave' : 'Save'}>
            {isSaved
              ? <BookmarkCheck className="h-4 w-4 text-brand-600" />
              : <Bookmark className="h-4 w-4 text-slate-400" />
            }
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="badge-gray capitalize">{job.jobType}</span>
        <span className="badge-blue capitalize">{job.category}</span>
        {isExpired && <span className="badge-red">Expired</span>}
      </div>

      {job.location && (
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
          <MapPin className="h-3 w-3" /> {job.location}
        </p>
      )}

      {job.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.requiredSkills.slice(0, 4).map((s) => <span key={s} className="badge-gray">{s}</span>)}
          {job.requiredSkills.length > 4 && <span className="badge-gray">+{job.requiredSkills.length - 4}</span>}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          <span>{isExpired ? 'Expired' : `Deadline: ${formatDate(job.deadline)}`}</span>
        </div>
        <span className="text-xs text-brand-600 font-medium">View Details →</span>
      </div>
    </motion.div>
  );
}

export default function JobsPage({ category, title }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { category, page, limit: 12 };
      if (search) params.search = search;
      const res = await jobsApi.getJobs(params);
      setJobs(res.data.jobs);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [category, page, search]);

  const fetchSaved = async () => {
    if (user?.role !== 'student') return;
    try {
      const res = await jobsApi.getSavedJobs();
      setSavedIds(new Set(res.data.savedJobs.map((s) => s.job?._id).filter(Boolean)));
    } catch { /* silent */ }
  };

  useEffect(() => { fetchJobs(); fetchSaved(); }, [fetchJobs]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{total} {total === 1 ? 'listing' : 'listings'} available</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchJobs(); }} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search by company or role…"
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs found" description="No active listings in this category right now." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((j) => (
            <JobCard
              key={j._id} job={j}
              savedIds={savedIds}
              onSave={(id) => setSavedIds((prev) => new Set([...prev, id]))}
              onUnsave={(id) => setSavedIds((prev) => { const s = new Set(prev); s.delete(id); return s; })}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
