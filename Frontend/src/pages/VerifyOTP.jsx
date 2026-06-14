import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(sessionStorage.getItem('otp_phone') || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { phone, otp });
      sessionStorage.removeItem('otp_phone');
      toast.success('Phone verified! You can now log in.');
      navigate('/login');
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid or expired OTP'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!phone) { toast.error('Please enter your phone number'); return; }
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { phone });
      toast.success('New OTP sent! Check server console in dev mode.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend OTP'); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-4 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
            📱
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Verify Your Phone
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
            An OTP has been sent to your phone number.
            <span className="block text-xs text-amber-600 mt-1">
              (Dev mode: check the server console for OTP)
            </span>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="input-label">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210" className="input-field" required />
            </div>

            <div>
              <label className="input-label">OTP Code</label>
              <input type="text" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •" maxLength={6}
                className="input-field text-center text-3xl tracking-[0.5em] font-bold"
                style={{ fontFamily: 'monospace', letterSpacing: '0.5em' }}
                required />
              <p className="text-xs text-gray-400 mt-1 text-center">{otp.length}/6 digits</p>
            </div>

            <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5 text-base">
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

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
            <button onClick={handleResend} disabled={resending}
              className="text-sm text-[#C0162C] font-semibold hover:underline disabled:opacity-50 transition-colors">
              {resending ? 'Sending…' : '↩ Resend OTP'}
            </button>
            <Link to="/login" className="text-sm text-gray-400 hover:text-[#1A1A2E] transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
