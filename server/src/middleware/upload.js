import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Memory storage for validation before GridFS upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf' || file.mimetype !== 'application/pdf') {
    return cb(new AppError('Only PDF files are accepted.', 400), false);
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
      return res.status(400).json({ message: 'File size exceeds the 10 MB limit.' });
    }
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  next(err);
};
