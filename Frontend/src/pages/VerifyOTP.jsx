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
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { phone, otp });
      sessionStorage.removeItem('otp_phone');
      toast.success('Phone verified! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { phone });
      toast.success('New OTP sent! Check your phone (or server console).');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">📱</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-3">Verify Your Phone</h1>
          <p className="text-gray-500 text-sm mt-1">
            An OTP has been sent to your phone.<br />
            <span className="text-xs text-amber-600">(In development mode, check the server console for the OTP code)</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              maxLength={6}
              className="input-field text-center text-2xl tracking-widest font-mono"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend OTP'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/login" className="text-red-600 hover:underline">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
