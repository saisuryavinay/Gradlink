/**
 * ExternalApplyConfirmModal.jsx
 *
 * Shown after a student returns to GradLink from an external job site.
 * Asks: "Did you complete your application?"
 * - Yes  → calls onConfirm() which records the application in MongoDB
 * - No   → calls onDecline() which does nothing
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from './ui';

export default function ExternalApplyConfirmModal({
  open,
  jobTitle,
  company,
  confirming,
  onConfirm,
  onDecline,
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        /* Backdrop */
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          {/* Modal panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header strip */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base leading-tight">
                  Did you complete your application?
                </h2>
                <p className="text-brand-100 text-xs mt-0.5">
                  {company} — {jobTitle}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Have you successfully submitted your application on the external website?
              </p>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  <strong>Note:</strong> GradLink cannot verify external submissions automatically.
                  This is a self-confirmation so your application is tracked in GradLink.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onConfirm}
                  disabled={confirming}
                  className="flex-1 btn-primary justify-center gap-2"
                >
                  {confirming
                    ? <LoadingSpinner size="sm" />
                    : <><CheckCircle className="h-4 w-4" /> Yes, Applied</>
                  }
                </button>
                <button
                  onClick={onDecline}
                  disabled={confirming}
                  className="flex-1 btn-secondary justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" /> No, Not Yet
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
