/**
 * AvatarUpload.jsx
 *
 * Wraps the Avatar component with an upload overlay.
 *
 * Fix summary (Nov 2026):
 * - After a successful save the blob preview URL is kept alive in `savedPhotoUrl`
 *   and fed to <Avatar photoUrl=...> so the photo shows immediately without
 *   waiting for a backend round-trip that could fail on a cold Render start.
 * - The blob URL is only revoked when the user uploads a newer photo or removes
 *   the photo (at which point we fall back to the fresh backend URL or initials).
 * - A fresh cacheBust timestamp is passed to <Avatar> after every upload so the
 *   browser does not serve a stale cached 404 response.
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Trash2, X, CheckCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Avatar from './Avatar';
import { LoadingSpinner } from './ui';
import { profileApi, getErrorMessage } from '../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function AvatarUpload({ user, size = 'xl', onSaved }) {
  const fileRef = useRef(null);

  // Blob URL for preview in the modal
  const [preview, setPreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  // After a successful upload we keep the blob URL here so Avatar displays
  // the photo immediately without depending on the backend img endpoint.
  const [savedPhotoUrl, setSavedPhotoUrl] = useState(null);
  // Timestamp passed to Avatar as cache-buster after each upload.
  const [cacheBust, setCacheBust] = useState(null);

  // When the user prop changes (e.g. logout → login as different user), clear
  // the cached local preview so we don't show the wrong photo.
  useEffect(() => {
    if (user?.avatar !== 'photo') {
      // User removed their photo server-side or logged in without a photo
      if (savedPhotoUrl) {
        URL.revokeObjectURL(savedPhotoUrl);
        setSavedPhotoUrl(null);
        setCacheBust(null);
      }
    }
  }, [user?._id, user?.avatar]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      // Note: savedPhotoUrl is intentionally NOT revoked here because the
      // Avatar component (rendered in the topbar etc.) might still be using it.
    };
  }, []);

  const validateFile = (f) => {
    if (!f) return false;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_TYPES.includes(f.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP image files are accepted.');
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('Image size must be 5 MB or less.');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f || !validateFile(f)) return;
    // Revoke previous preview blob (not the saved one)
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setPreviewFile(f);
    setModalOpen(true);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!previewFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', previewFile);
      const res = await profileApi.uploadAvatar(fd);

      // ── KEY FIX ──────────────────────────────────────────────────────────
      // Keep the blob URL alive so Avatar renders the photo instantly.
      // Revoke the old savedPhotoUrl first (if any).
      if (savedPhotoUrl) URL.revokeObjectURL(savedPhotoUrl);
      setSavedPhotoUrl(preview);        // transfer ownership to savedPhotoUrl
      setCacheBust(Date.now());         // force backend URL cache-bust too
      // ─────────────────────────────────────────────────────────────────────

      // Update global user context with returned user (avatar='photo' etc.)
      onSaved?.(res.data.user);

      toast.success('Profile photo updated!');

      // Close modal WITHOUT revoking the preview blob (now owned by savedPhotoUrl)
      setPreview(null);
      setPreviewFile(null);
      setModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await profileApi.removeAvatar();
      // Clear local preview — fall back to initials
      if (savedPhotoUrl) {
        URL.revokeObjectURL(savedPhotoUrl);
        setSavedPhotoUrl(null);
        setCacheBust(null);
      }
      onSaved?.(res.data.user);
      toast.success('Profile photo removed.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const closeModal = () => {
    // Revoke the modal preview blob (not the savedPhotoUrl)
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPreviewFile(null);
    setModalOpen(false);
  };

  const hasPhoto = user?.avatar === 'photo';

  return (
    <>
      {/* Clickable avatar with camera overlay */}
      <div className="relative group inline-block flex-shrink-0">
        {/*
          Pass savedPhotoUrl as photoUrl so the photo shows instantly after upload
          without waiting for the backend image endpoint.
          Pass cacheBust to force a fresh fetch on subsequent page loads.
        */}
        <Avatar
          user={user}
          size={size}
          photoUrl={savedPhotoUrl}
          cacheBust={cacheBust}
        />

        {/* Camera overlay — appears on hover */}
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="Change profile photo"
          type="button"
          aria-label="Change profile photo"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Remove button — only shown when a photo is set */}
      {hasPhoto && !removing && (
        <button
          onClick={handleRemove}
          className="mt-2 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          type="button"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove photo
        </button>
      )}
      {removing && (
        <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <LoadingSpinner size="xs" /> Removing…
        </span>
      )}

      {/* Preview modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="avatar-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              key="avatar-modal-panel"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">
                  Preview Profile Photo
                </h2>
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="btn-ghost p-1.5 rounded-lg"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Circular preview */}
              <div className="p-6 flex flex-col items-center gap-5">
                <div className="h-36 w-36 rounded-full overflow-hidden border-4 border-brand-200 dark:border-brand-700 shadow-lg flex-shrink-0">
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    This is how your profile photo will appear.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    The photo will be cropped to a circle. Center your face for best results.
                  </p>
                </div>

                {/* Choose different photo */}
                <button
                  onClick={() => {
                    closeModal();
                    setTimeout(() => fileRef.current?.click(), 50);
                  }}
                  disabled={uploading}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  type="button"
                >
                  <Upload className="h-3.5 w-3.5" /> Choose a different photo
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 px-5 pb-5">
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className="btn-secondary flex-1 justify-center"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={uploading}
                  className="btn-primary flex-1 justify-center"
                  type="button"
                >
                  {uploading
                    ? <><LoadingSpinner size="sm" /> Saving…</>
                    : <><CheckCircle className="h-4 w-4" /> Save Photo</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
