import { getAvatarColor, getInitials } from '../utils/helpers';

const AVATAR_SVG_PATHS = {
  av_1: 'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
  av_2: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
};

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-24 w-24 text-3xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const initials = getInitials(user?.name);
  const colorClass = getAvatarColor(user?.name);

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 select-none ${className}`}
      title={user?.name}
    >
      {initials}
    </div>
  );
}
