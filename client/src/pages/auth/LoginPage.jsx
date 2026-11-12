import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { authApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      const role = res.data.user.role;
      navigate(`/dashboard/${role}`, { replace: true });
    } catch (err) {
      const errData = err?.response?.data;
      if (errData?.requiresVerification) {
        toast.error('Please verify your email first.');
        navigate('/verify-otp', { state: { email: errData.email } });
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 dark:from-slate-900 to-white dark:to-slate-800 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-800 dark:text-white">GradLink</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="email" type="email" {...register('email')} className="input pl-9" placeholder="you@acet.ac.in or admin email" autoComplete="email" />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} className="input pl-9 pr-10" placeholder="••••••••" autoComplete="current-password" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button type="submit" id="login-submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : <><LogIn className="h-4 w-4" /> Sign In</>}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New student?{' '}
              <Link to="/register/student" className="text-brand-600 hover:text-brand-700 font-medium">Register here</Link>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Alumni?{' '}
              <Link to="/register/alumni" className="text-brand-600 hover:text-brand-700 font-medium">Create alumni account</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Students and alumni must sign in with their official college email.
        </p>
      </motion.div>
    </div>
  );
}
