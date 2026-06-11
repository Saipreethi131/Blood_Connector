import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name}!`);
      const dest =
        from ||
        (data.user.role === 'donor'
          ? '/donor/dashboard'
          : data.user.role === 'hospital'
          ? '/hospital/dashboard'
          : '/admin/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">🩸</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Blood Connector account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-red-600 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
