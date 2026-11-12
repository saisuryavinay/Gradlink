import { useState } from 'react';
import { getAvatarColor, getInitials } from '../utils/helpers';
import { profileApi } from '../services/api';

/**
 * Avatar component.
 *
 * Shows a user's profile photo when user.avatar === 'photo' and user._id is set.
 * Falls back to a colored initials badge for all other avatar values.
 *
 * Props:
 *   user       — the user object (needs .name, .avatar, ._id)
 *   size       — 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 *   className  — extra CSS classes
 *   photoUrl   — override the auto-derived URL (for local preview before upload)
 */
export default function Avatar({ user, size = 'md', className = '', photoUrl }) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    xs:  'h-6 w-6 text-xs',
    sm:  'h-8 w-8 text-xs',
    md:  'h-10 w-10 text-sm',
    lg:  'h-12 w-12 text-base',
    xl:  'h-16 w-16 text-xl',
    '2xl': 'h-24 w-24 text-3xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const initials = getInitials(user?.name);
  const colorClass = getAvatarColor(user?.name);

  // Determine if we should show a photo
  const hasPhoto = !imgError && (
    photoUrl ||                             // local preview blob URL
    (user?.avatar === 'photo' && user?._id) // persisted photo
  );

  const src = photoUrl || (user?.avatar === 'photo' && user?._id
    ? `${profileApi.getAvatarUrl(user._id)}?t=${user.updatedAt || Date.now()}`
    : null);

  if (hasPhoto && src) {
    return (
      <img
        src={src}
        alt={user?.name || 'Profile photo'}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 select-none ${className}`}
        title={user?.name}
      />
    );
  }

  // Initials fallback
  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 select-none ${className}`}
      title={user?.name}
    >
      {initials}
    </div>
  );
}
