import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Allowed MIME types and extensions
const ALLOWED_EXTS = ['.pdf', '.docx'];
const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword', // some browsers send this for .docx
];

// Memory storage — file is processed in-memory, not saved to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(
      new AppError('Only PDF (.pdf) and Word Document (.docx) files are accepted.', 400),
      false
    );
  }
  cb(null, true);
};

export const uploadResume = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single('resume');

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds the 5 MB limit.' });
    }
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  next(err);
};
