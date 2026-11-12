import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler.js';

// ── Shared storage (memory — file processed in-memory, not saved to disk) ──
const storage = multer.memoryStorage();

// ── Resume upload (PDF + DOCX, 5 MB) ────────────────────────────────────────
const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_RESUME_EXTS = ['.pdf', '.docx'];
const ALLOWED_RESUME_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const resumeFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_RESUME_EXTS.includes(ext) || !ALLOWED_RESUME_MIMES.includes(file.mimetype)) {
    return cb(
      new AppError('Only PDF (.pdf) and Word Document (.docx) files are accepted.', 400),
      false
    );
  }
  cb(null, true);
};

export const uploadResume = multer({
  storage,
  limits: { fileSize: MAX_RESUME_SIZE },
  fileFilter: resumeFileFilter,
}).single('resume');

// ── Avatar upload (JPG/JPEG/PNG/WEBP, 5 MB) ──────────────────────────────────
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_AVATAR_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_AVATAR_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const avatarFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_AVATAR_EXTS.includes(ext) || !ALLOWED_AVATAR_MIMES.includes(file.mimetype)) {
    return cb(
      new AppError('Only JPG, JPEG, PNG, and WEBP image files are accepted.', 400),
      false
    );
  }
  cb(null, true);
};

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: avatarFileFilter,
}).single('avatar');

// ── Shared multer error handler ───────────────────────────────────────────────
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds the 5 MB limit.' });
    }
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  next(err);
};
