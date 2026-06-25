import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [email] = useState(sessionStorage.getItem('otp_email') || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      sessionStorage.removeItem('otp_email');
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid or expired OTP'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New OTP sent! Check server console in dev mode.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend OTP'); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-4 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
            ✉️
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Verify Your Email
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
            Enter the 6-digit code sent to your email address. Check your inbox (and spam folder).
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="input-label">OTP Code</label>
              <input type="text" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •" maxLength={6}
                className="input-field text-center text-3xl tracking-[0.5em] font-bold"
                style={{ fontFamily: 'monospace', letterSpacing: '0.5em' }}
                required />
              <p className="text-xs text-slate-400 mt-1 text-center">{otp.length}/6 digits</p>
            </div>

            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full py-3.5 text-base inline-flex items-center justify-center gap-2 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#C0162C' }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Verifying…
                </span>
              ) : 'Verify & Continue →'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            <button onClick={handleResend} disabled={resending}
              className="text-sm text-[#C0162C] font-semibold hover:underline disabled:opacity-50 transition-colors">
              {resending ? 'Sending…' : '↩ Resend Code'}
            </button>
            <Link to="/login" className="text-sm text-slate-400 hover:text-[#1A1A2E] transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
