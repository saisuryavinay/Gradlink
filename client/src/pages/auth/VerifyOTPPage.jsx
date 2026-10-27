import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { GraduationCap, CheckCircle } from 'lucide-react';
import { authApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/ui';

export default function VerifyOTPPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Please enter the 6-digit OTP.'); return; }

    setLoading(true);
    try {
      const res = await authApi.verifyOTP({ email, otp: code });
      login(res.data.token, res.data.user);
      toast.success('Email verified! Welcome to GradLink.');
      navigate(`/dashboard/${res.data.user.role}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendOTP({ email });
      toast.success('A new OTP has been sent to your email.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300 mb-4">No email provided. Please register first.</p>
          <Link to="/register/student" className="btn-primary">Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 dark:from-slate-900 to-white dark:to-slate-800 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verify Your Email</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            We sent a 6-digit OTP to <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">OTP expires in 5 minutes.</p>
        </div>

        <div className="card p-8 shadow-xl">
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
              />
            ))}
          </div>

          <button
            id="verify-otp-submit"
            onClick={handleVerify}
            className="btn-primary w-full py-2.5 mb-4"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Verify OTP'}
          </button>

          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Didn't receive it?{' '}
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </p>
            <p className="text-xs text-slate-400 mt-3">
              Maximum 3 resends allowed.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          <Link to="/login" className="text-brand-600 hover:text-brand-700">Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}
