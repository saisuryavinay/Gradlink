import { useState, useEffect } from 'react';
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
 *   photoUrl   — override URL (e.g. a local blob URL after upload for instant display).
 *                When provided and truthy, it is used as-is (no cache-busting needed).
 *   cacheBust  — number/string appended as ?t=<value> to the backend URL to bypass
 *                the browser's HTTP cache after a re-upload. Pass Date.now() after upload.
 */
export default function Avatar({ user, size = 'md', className = '', photoUrl, cacheBust }) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    xs:    'h-6 w-6 text-xs',
    sm:    'h-8 w-8 text-xs',
    md:    'h-10 w-10 text-sm',
    lg:    'h-12 w-12 text-base',
    xl:    'h-16 w-16 text-xl',
    '2xl': 'h-24 w-24 text-3xl',
  };

  const sizeClass = sizes[size] || sizes.md;
  const initials = getInitials(user?.name);
  const colorClass = getAvatarColor(user?.name);

  // Build the backend URL for the persisted photo.
  // Always append a cache-buster: prefer the explicit cacheBust prop (set after
  // fresh upload), then user.updatedAt (changes after every profile save), then
  // Date.now() as a last-resort so stale cached 404 responses are never served.
  const backendUrl =
    user?.avatar === 'photo' && user?._id
      ? `${profileApi.getAvatarUrl(user._id)}?t=${cacheBust ?? user.updatedAt ?? Date.now()}`
      : null;

  // Final src: prefer the local blob URL (instant display, no network), then the backend URL.
  const src = photoUrl || backendUrl;

  // Reset imgError whenever src changes so a corrected URL always gets a fresh try.
  // This handles: upload → new blob URL, refresh → new backend URL with fresh cacheBust.
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const hasPhoto = !!src && !imgError;

  if (hasPhoto) {
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
