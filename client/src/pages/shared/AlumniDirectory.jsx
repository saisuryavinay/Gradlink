import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Users, MapPin, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { profileApi, getErrorMessage } from '../../services/api';
import { CardSkeleton, EmptyState } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { DEPARTMENTS, GRADUATION_YEARS } from '../../utils/helpers';
import { toast } from 'sonner';

function AlumniCard({ alumni }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover p-5"
      onClick={() => navigate(`${alumni._id}`)}
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar user={alumni} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{alumni.name}</h3>
          {alumni.currentRole && (
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
              <Briefcase className="h-3 w-3 flex-shrink-0" />
              {alumni.currentRole}
            </p>
          )}
          {alumni.currentCompany && (
            <p className="text-xs text-brand-600 dark:text-brand-400 truncate">{alumni.currentCompany}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {alumni.department && <span className="badge-gray">{alumni.department}</span>}
        {alumni.graduationYear && <span className="badge-gray">{alumni.graduationYear}</span>}
      </div>
      {alumni.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {alumni.skills.slice(0, 3).map((s) => (
            <span key={s} className="badge-blue">{s}</span>
          ))}
          {alumni.skills.length > 3 && <span className="badge-gray">+{alumni.skills.length - 3}</span>}
        </div>
      )}
    </motion.div>
  );
}

export default function AlumniDirectory() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', role: '', company: '', department: '', graduationYear: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filters.name) params.name = filters.name;
      if (filters.role) params.role = filters.role;
      if (filters.company) params.company = filters.company;
      if (filters.department) params.department = filters.department;
      if (filters.graduationYear) params.graduationYear = filters.graduationYear;
      const res = await profileApi.getAlumniDirectory(params);
      setAlumni(res.data.alumni);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAlumni();
  };

  const clearFilters = () => {
    setFilters({ name: '', role: '', company: '', department: '', graduationYear: '' });
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Discover Alumni</h1>
          <p className="page-subtitle">{total} alumni found</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="input pl-9 max-w-md"
            placeholder="Search alumni by name…"
          />
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <div>
              <label className="label text-xs">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="input text-sm"
              >
                <option value="">All</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Graduation Year</label>
              <select
                value={filters.graduationYear}
                onChange={(e) => setFilters({ ...filters, graduationYear: e.target.value })}
                className="input text-sm"
              >
                <option value="">All</option>
                {[...GRADUATION_YEARS].reverse().map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Job Role</label>
              <input
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="input text-sm"
                placeholder="e.g. Engineer"
              />
            </div>
            <div>
              <label className="label text-xs">Company</label>
              <input
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                className="input text-sm"
                placeholder="e.g. Google"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end">
              <button type="button" onClick={clearFilters} className="btn-secondary text-xs">Clear</button>
              <button type="submit" className="btn-primary text-xs">Apply Filters</button>
            </div>
          </motion.div>
        )}
      </form>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : alumni.length === 0 ? (
        <EmptyState icon={Users} title="No alumni found" description="Try adjusting your filters or search terms." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {alumni.map((a) => <AlumniCard key={a._id} alumni={a} />)}
        </div>
      )}

      {/* Pagination */}
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
