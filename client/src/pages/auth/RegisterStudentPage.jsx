import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, User, BookOpen, Calendar } from 'lucide-react';
import { authApi, pingBackend, getErrorMessage } from '../../services/api';
import { LoadingSpinner } from '../../components/ui';
import { DEPARTMENTS, GRADUATION_YEARS, ALLOWED_DOMAINS } from '../../utils/helpers';

const schema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email').refine(
    (v) => ALLOWED_DOMAINS.includes(v.toLowerCase().split('@')[1]),
    'Must be an official college email (@acet.ac.in, @acoe.edu.in, or @aec.edu.in)'
  ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  department: z.string().min(1, 'Department is required'),
  graduationYear: z.string().min(1, 'Graduation year is required'),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export default function RegisterStudentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Creating account...');

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  // Pre-warm the Render backend as soon as the page loads so a cold-start
  // doesn't eat into the registration request timeout.
  useEffect(() => {
    pingBackend();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setLoadingMessage('Creating account...');
    const normalizedEmail = data.email.toLowerCase().trim();

    // Show a reassuring message if the request takes a while (Render cold-start)
    const slowTimer = setTimeout(() => {
      setLoadingMessage('Server is waking up, please wait…');
    }, 8000);

    try {
      const res = await authApi.register({
        name: data.name.trim(),
        email: normalizedEmail,
        password: data.password,
        role: 'student',
        department: data.department,
        graduationYear: parseInt(data.graduationYear),
      });

      clearTimeout(slowTimer);
      const responseData = res.data;

      // Both new accounts (201) and existing-unverified accounts (200 with
      // requiresVerification) should proceed to OTP verification.
      if (responseData.requiresVerification) {
        if (responseData.emailFailed) {
          // Account/OTP created in DB but email delivery failed server-side.
          // Navigate to OTP page anyway — user can resend from there.
          toast.warning('Account created, but the verification email could not be sent. Use "Resend OTP" on the next page.');
        } else if (responseData.message?.includes('unverified account already exists')) {
          toast.info('A new OTP has been sent to your email. Please verify to continue.');
        } else {
          toast.success('Account created! Check your email for the OTP.');
        }
        navigate('/verify-otp', { state: { email: responseData.email || normalizedEmail } });
      } else {
        // Fallback — navigate to OTP page
        toast.success('Account created! Check your email for the OTP.');
        navigate('/verify-otp', { state: { email: normalizedEmail } });
      }
    } catch (err) {
      clearTimeout(slowTimer);
      const status = err?.response?.status;
      const responseData = err?.response?.data;

      if (status === 409 && responseData?.alreadyVerified) {
        // Fully verified account — direct the user to log in
        toast.error('An account with this email already exists.');
        navigate('/login');
        return;
      }

      // All other errors (validation, server issues, etc.)
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMessage('Creating account...');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 dark:from-slate-900 to-white dark:to-slate-800 flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-800 dark:text-white">GradLink</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Student Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Join GradLink as a student</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input {...register('name')} className="input pl-9" placeholder="Your full name" />
              </div>
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">College Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input {...register('email')} type="email" className="input pl-9" placeholder="you@acet.ac.in" autoComplete="email" />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Department</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select {...register('department')} className="input pl-9 appearance-none">
                    <option value="">Select</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {errors.department && <p className="form-error">{errors.department.message}</p>}
              </div>
              <div>
                <label className="label">Graduation Year</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select {...register('graduationYear')} className="input pl-9 appearance-none">
                    <option value="">Select</option>
                    {GRADUATION_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {errors.graduationYear && <p className="form-error">{errors.graduationYear.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input {...register('password')} type="password" className="input pl-9" placeholder="Minimum 8 characters" />
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input {...register('confirmPassword')} type="password" className="input pl-9" placeholder="Re-enter password" />
              </div>
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" id="student-register-submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">{loadingMessage}</span>
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account? <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Registering as alumni? <Link to="/register/alumni" className="text-brand-600 hover:text-brand-700 font-medium">Alumni registration</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
