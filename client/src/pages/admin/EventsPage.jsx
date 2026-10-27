import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Calendar } from 'lucide-react';
import { updatesApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import { formatDate } from '../../utils/helpers';

const EVENT_TYPES = ['seminar', 'workshop', 'job-fair', 'hackathon', 'webinar', 'alumni-meet', 'other'];
const blank = { title: '', description: '', eventType: 'seminar', startDate: '', endDate: '', time: '', venue: '', registrationLink: '' };

function EventForm({ data, onSave, onCancel, saving }) {
  const [form, setForm] = useState(data || blank);
  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return (
    <div className="card p-6 space-y-4">
      <h3 className="section-title">{data ? 'Edit Event' : 'Create Event'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Title <span className="text-red-500">*</span></label>
          <input value={form.title} onChange={f('title')} className="input" placeholder="Event title" />
        </div>
        <div>
          <label className="label">Type</label>
          <select value={form.eventType} onChange={f('eventType')} className="input">
            {EVENT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.replace('-', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Start Date <span className="text-red-500">*</span></label>
          <input type="date" value={form.startDate} onChange={f('startDate')} className="input" />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" value={form.endDate} onChange={f('endDate')} className="input" min={form.startDate} />
        </div>
        <div>
          <label className="label">Time</label>
          <input value={form.time} onChange={f('time')} className="input" placeholder="e.g. 10:00 AM – 1:00 PM" />
        </div>
        <div>
          <label className="label">Venue</label>
          <input value={form.venue} onChange={f('venue')} className="input" placeholder="e.g. Seminar Hall / Online" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea rows={3} value={form.description} onChange={f('description')} className="input resize-none" placeholder="Event details…" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Registration Link (optional)</label>
          <input value={form.registrationLink} onChange={f('registrationLink')} className="input" placeholder="https://…" type="url" />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSave(form)} disabled={saving} className="btn-primary">
          {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Save</>}
        </button>
        <button onClick={onCancel} className="btn-secondary"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try { const res = await updatesApi.getEvents(); setEvents(res.data.events || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSave = async (form) => {
    if (!form.title.trim() || !form.startDate) { toast.error('Title and start date are required.'); return; }
    setSaving(true);
    try {
      if (editing) { await updatesApi.updateEvent(editing._id, form); toast.success('Event updated.'); }
      else { await updatesApi.createEvent(form); toast.success('Event created.'); }
      setShowForm(false); setEditing(null); fetchEvents();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await updatesApi.deleteEvent(id); setEvents((prev) => prev.filter((e) => e._id !== id)); toast.success('Deleted.'); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Events</h1><p className="page-subtitle">Manage events visible to students and alumni.</p></div>
        {!showForm && <button onClick={() => { setShowForm(true); setEditing(null); }} className="btn-primary"><Plus className="h-4 w-4" /> Create Event</button>}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <EventForm data={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} saving={saving} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        : events.length === 0 ? <EmptyState icon={Calendar} title="No events yet" description="Create your first event." />
        : (
          <div className="grid sm:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev._id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex gap-2 mb-1">
                      <span className="badge-blue capitalize">{ev.eventType?.replace('-', ' ')}</span>
                      {new Date(ev.startDate) > new Date() && <span className="badge-green">Upcoming</span>}
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{ev.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(ev.startDate)}{ev.time ? ` · ${ev.time}` : ''}{ev.venue ? ` · ${ev.venue}` : ''}</p>
                    {ev.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{ev.description}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditing(ev); setShowForm(true); }} className="btn-ghost p-1.5"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(ev._id)} className="btn-ghost p-1.5 text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
