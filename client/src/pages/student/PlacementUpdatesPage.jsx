import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Megaphone, Pin, Calendar } from 'lucide-react';
import { updatesApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import { motion } from 'framer-motion';

function UpdateCard({ update }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`card p-5 ${update.pinned ? 'border-brand-300 dark:border-brand-700 bg-brand-50/40 dark:bg-brand-900/10' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${update.pinned ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
          {update.pinned ? <Pin className="h-4 w-4 text-brand-600" /> : <Megaphone className="h-4 w-4 text-slate-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {update.pinned && <span className="badge-blue">Pinned</span>}
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{update.title}</h3>
          </div>
          {update.body && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{update.body}</p>
          )}
          {update.link && (
            <a href={update.link} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:text-brand-700 mt-2 inline-block">
              View more →
            </a>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{formatRelativeTime(update.publishedAt || update.createdAt)}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function PlacementUpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updatesApi.getPlacementUpdates()
      .then((res) => setUpdates(res.data.updates || []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  const pinned = updates.filter((u) => u.pinned);
  const rest = updates.filter((u) => !u.pinned);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Placement Updates</h1>
        <p className="page-subtitle">Official announcements from the placement cell.</p>
      </div>

      {updates.length === 0 ? (
        <EmptyState icon={Megaphone} title="No updates yet" description="Placement updates will appear here once published." />
      ) : (
        <div className="space-y-3">
          {pinned.map((u) => <UpdateCard key={u._id} update={u} />)}
          {rest.map((u) => <UpdateCard key={u._id} update={u} />)}
        </div>
      )}
    </div>
  );
}
