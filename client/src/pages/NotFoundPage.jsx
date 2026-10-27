import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md p-8">
        <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
          <SearchX className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-5xl font-bold text-brand-600 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </motion.div>
    </div>
  );
}
