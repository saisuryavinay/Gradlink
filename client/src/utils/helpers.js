import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const DEPARTMENTS = [
  'CSE', 'CSE-AI', 'CSE-AIML', 'CSE-DS', 'CSE-Cyber Security',
  'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'MBA', 'MCA', 'Other',
];

export const GRADUATION_YEARS = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() - 3 + i
);

export const ALLOWED_DOMAINS = ['acet.ac.in', 'acoe.edu.in', 'aec.edu.in'];

export const validateCollegeEmail = (email) => {
  const domain = email?.toLowerCase().split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
};

export const AVATARS = [
  'av_1', 'av_2', 'av_3', 'av_4', 'av_5', 'av_6', 'av_7', 'av_8',
  'av_9', 'av_10', 'av_11', 'av_12',
];

export const AVATAR_COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
  'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
];

export const getAvatarColor = (name) => {
  if (!name) return 'bg-brand-500';
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export const STATUS_COLORS = {
  pending: 'badge-yellow',
  approved: 'badge-green',
  rejected: 'badge-red',
  accepted: 'badge-green',
  withdrawn: 'badge-gray',
  cancelled: 'badge-gray',
  submitted: 'badge-blue',
  shortlisted: 'badge-purple',
  selected: 'badge-green',
  'in-progress': 'badge-yellow',
  'not-placed': 'badge-gray',
  placed: 'badge-green',
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
