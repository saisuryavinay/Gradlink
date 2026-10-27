import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { updatesApi, getErrorMessage } from '../../services/api';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import { formatDate } from '../../utils/helpers';
import { motion } from 'framer-motion';

function EventCard({ event }) {
  const isUpcoming = new Date(event.startDate) > new Date();
  const isLive = new Date(event.startDate) <= new Date() && (!event.endDate || new Date(event.endDate) >= new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {isLive && <span className="badge-green flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse-slow" />Live</span>}
            {isUpcoming && <span className="badge-blue">Upcoming</span>}
            {!isUpcoming && !isLive && <span className="badge-gray">Past</span>}
            <span className="badge-gray capitalize">{event.eventType}</span>
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-3">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(event.startDate)}{event.endDate && event.endDate !== event.startDate ? ` — ${formatDate(event.endDate)}` : ''}
            </span>
            {event.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.time}</span>}
            {event.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>}
          </div>
        </div>
      </div>
      {event.registrationLink && isUpcoming && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">
            <ExternalLink className="h-3 w-3" /> Register
          </a>
        </div>
      )}
    </motion.div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | upcoming | past

  useEffect(() => {
    updatesApi.getEvents()
      .then((res) => setEvents(res.data.events || []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const filtered = events.filter((e) => {
    if (filter === 'upcoming') return new Date(e.startDate) > now;
    if (filter === 'past') return new Date(e.startDate) <= now;
    return true;
  });

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Events</h1>
        <p className="page-subtitle">Workshops, seminars, job fairs, and more.</p>
      </div>

      <div className="flex gap-2">
        {['all', 'upcoming', 'past'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No events" description="Events will appear here once published by your institution." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((e) => <EventCard key={e._id} event={e} />)}
        </div>
      )}
    </div>
  );
}
