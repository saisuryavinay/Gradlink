import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md p-8">
        <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">You don't have permission to access this page.</p>
        <Link to="/login" className="btn-primary">Go to Login</Link>
      </motion.div>
    </div>
  );
}
