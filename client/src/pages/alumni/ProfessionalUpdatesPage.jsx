import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { professionalUpdatesApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner, StatusBadge } from '../../components/ui';
import { formatDate, formatRelativeTime } from '../../utils/helpers';

const UPDATE_TYPES = ['promotion', 'new-job', 'achievement', 'certification', 'project', 'other'];

function UpdateForm({ initialData, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initialData || { title: '', body: '', type: 'achievement', link: '' });

  return (
    <div className="card p-6 space-y-4">
      <h3 className="section-title">{initialData ? 'Edit Update' : 'Share an Update'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Update Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
            {UPDATE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.replace('-', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Title <span className="text-red-500">*</span></label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. Joined Google as Senior Engineer" />
        </div>
      </div>
      <div>
        <label className="label">Details</label>
        <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="input resize-none" maxLength={1500} placeholder="Share more details about this milestone…" />
        <p className="text-xs text-slate-400 mt-1">{form.body.length}/1500</p>
      </div>
      <div>
        <label className="label">Link (optional)</label>
        <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="input" placeholder="https://..." type="url" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSave(form)} disabled={saving} className="btn-primary">
          {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> {initialData ? 'Update' : 'Share'}</>}
        </button>
        <button onClick={onCancel} className="btn-secondary"><X className="h-4 w-4" /> Cancel</button>
      </div>
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">Your update will be reviewed by an admin before it appears publicly. Editing a published update will require re-approval.</p>
      </div>
    </div>
  );
}

export default function ProfessionalUpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await professionalUpdatesApi.getMine();
      setUpdates(res.data.updates || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUpdates(); }, []);

  const handleSave = async (form) => {
    if (!form.title.trim()) { toast.error('Title is required.'); return; }
    setSaving(true);
    try {
      if (editingUpdate) {
        await professionalUpdatesApi.edit(editingUpdate._id, form);
        toast.success('Update submitted for re-approval.');
      } else {
        await professionalUpdatesApi.create(form);
        toast.success('Update submitted for admin approval.');
      }
      setShowForm(false);
      setEditingUpdate(null);
      fetchUpdates();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this update?')) return;
    setDeletingId(id);
    try {
      await professionalUpdatesApi.delete(id);
      setUpdates((prev) => prev.filter((u) => u._id !== id));
      toast.success('Update deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const TYPE_BADGES = {
    promotion: 'badge-green', 'new-job': 'badge-blue', achievement: 'badge-purple',
    certification: 'badge-yellow', project: 'badge-gray', other: 'badge-gray',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Professional Updates</h1>
          <p className="page-subtitle">Share your career milestones with the college community.</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditingUpdate(null); }} className="btn-primary">
            <Plus className="h-4 w-4" /> Share Update
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <UpdateForm
              initialData={editingUpdate}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingUpdate(null); }}
              saving={saving}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : updates.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No updates yet" description="Share your first career milestone with students and alumni." />
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <motion.div key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <StatusBadge status={u.status} />
                    <span className={`${TYPE_BADGES[u.type] || 'badge-gray'} capitalize`}>{u.type?.replace('-', ' ')}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{u.title}</h3>
                  {u.body && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{u.body}</p>}
                  {u.adminNote && <p className="text-xs text-red-500 dark:text-red-400 mt-1">Admin note: {u.adminNote}</p>}
                  <p className="text-xs text-slate-400 mt-2">{formatRelativeTime(u.createdAt)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {(u.status === 'pending' || u.status === 'rejected') && (
                    <button onClick={() => { setEditingUpdate(u); setShowForm(true); }} className="btn-ghost p-1.5">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(u._id)} disabled={deletingId === u._id} className="btn-ghost p-1.5 text-red-500">
                    {deletingId === u._id ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
