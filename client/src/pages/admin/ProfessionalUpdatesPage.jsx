import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { professionalUpdatesApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner, StatusBadge } from '../../components/ui';
import Avatar from '../../components/Avatar';
import { formatRelativeTime } from '../../utils/helpers';

export default function AdminProfessionalUpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote] = useState('');

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await professionalUpdatesApi.getAll({ status: filter, limit: 50 });
      setUpdates(res.data.updates || []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUpdates(); }, [filter]);

  const review = async (id, status) => {
    setReviewing(id);
    try {
      await professionalUpdatesApi.review(id, { status, adminNote: note });
      toast.success(`Update ${status}.`);
      setNoteModal(null); setNote(''); fetchUpdates();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setReviewing(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Professional Updates Review</h1>
        <p className="page-subtitle">Review and approve alumni career updates.</p>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{f}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        : updates.length === 0 ? <EmptyState icon={TrendingUp} title={`No ${filter} updates`} />
        : (
          <div className="space-y-3">
            {updates.map((u) => (
              <motion.div key={u._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <div className="flex items-start gap-3">
                  <Avatar user={u.author} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{u.author?.name}</p>
                      <StatusBadge status={u.status} />
                      <span className="badge-gray capitalize">{u.type?.replace('-', ' ')}</span>
                    </div>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{u.title}</p>
                    {u.body && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">{u.body}</p>}
                    <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(u.createdAt)}</p>
                  </div>
                  {u.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => { setNoteModal({ id: u._id, action: 'approved' }); setNote(''); }} className="btn-primary text-xs"><CheckCircle className="h-3 w-3" /> Approve</button>
                      <button onClick={() => { setNoteModal({ id: u._id, action: 'rejected' }); setNote(''); }} className="btn-danger text-xs"><XCircle className="h-3 w-3" /> Reject</button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

      {noteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 max-w-sm w-full">
            <h3 className="section-title mb-3 capitalize">{noteModal.action} Update</h3>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="input resize-none mb-4" placeholder="Optional note to the alumni…" />
            <div className="flex gap-3">
              <button onClick={() => review(noteModal.id, noteModal.action)} disabled={reviewing === noteModal.id} className={noteModal.action === 'approved' ? 'btn-primary' : 'btn-danger'}>
                {reviewing === noteModal.id ? <LoadingSpinner size="sm" /> : `Confirm ${noteModal.action}`}
              </button>
              <button onClick={() => setNoteModal(null)} className="btn-secondary">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
