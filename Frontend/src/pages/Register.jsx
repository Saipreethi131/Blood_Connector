import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = [
  { name: 'Hyderabad', coordinates: [78.4867, 17.3850] },
  { name: 'Mumbai', coordinates: [72.8777, 19.0760] },
  { name: 'Delhi', coordinates: [77.1025, 28.7041] },
  { name: 'Bangalore', coordinates: [77.5946, 12.9716] },
  { name: 'Chennai', coordinates: [80.2707, 13.0827] },
  { name: 'Kolkata', coordinates: [88.3639, 22.5726] },
  { name: 'Pune', coordinates: [73.8567, 18.5204] },
  { name: 'Ahmedabad', coordinates: [72.5714, 23.0225] },
  { name: 'Jaipur', coordinates: [75.7873, 26.9124] },
  { name: 'Lucknow', coordinates: [80.9462, 26.8467] },
];

const defaultDonor = { name: '', email: '', password: '', phone: '', bloodGroup: '', city: 'Hyderabad', address: '' };
const defaultHospital = { name: '', email: '', password: '', phone: '', hospitalName: '', licenseNumber: '', emergencyContact: '', city: 'Hyderabad', address: '' };

function Field({ label, children }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const initialRole = searchParams.get('role') === 'hospital' ? 'hospital' : 'donor';
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState(initialRole === 'donor' ? defaultDonor : defaultHospital);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { setForm(role === 'donor' ? defaultDonor : defaultHospital); }, [role]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getCoords = (cityName) => {
    const city = CITIES.find((c) => c.name === cityName);
    return city ? city.coordinates : CITIES[0].coordinates;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const coordinates = getCoords(form.city);
      const payload = { ...form, coordinates };
      delete payload.city;
      const endpoint = role === 'donor' ? '/auth/register/donor' : '/auth/register/hospital';
      await api.post(endpoint, payload);
      if (role === 'donor') {
        sessionStorage.setItem('otp_phone', form.phone);
        toast.success('Registered! A verification code has been sent to your email.');
        navigate('/verify-otp');
      } else {
        toast.success('Hospital registered! Awaiting admin verification before login.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
              🩸
            </div>
            <span className="text-xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Blood <span className="text-[#C0162C]">Connector</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Create Account
          </h1>
          <p className="text-gray-500 text-sm mt-1">Join the community saving lives every day</p>
        </div>

        <div className="card">
          {/* Role selector */}
          <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 mb-6">
            {['donor', 'hospital'].map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-3 font-semibold text-sm transition-all duration-200 ${
                  role === r
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#C0162C]'
                }`}
                style={role === r ? { background: 'linear-gradient(135deg, #C0162C, #8B0000)' } : {}}>
                {r === 'donor' ? '🤝 Donor' : '🏥 Hospital'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name">
                <input type="text" name="name" required value={form.name} onChange={handleChange}
                  placeholder="John Doe" className="input-field" />
              </Field>
              <Field label="Phone Number">
                <input type="tel" name="phone" required value={form.phone} onChange={handleChange}
                  placeholder="+91 9876543210" className="input-field" />
              </Field>
            </div>

            <Field label="Email Address">
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                placeholder="you@example.com" className="input-field" />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} name="password" required minLength={6}
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters" className="input-field pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C0162C] transition-colors text-sm">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </Field>

            {role === 'donor' && (
              <Field label="Blood Group">
                <select name="bloodGroup" required value={form.bloodGroup} onChange={handleChange} className="input-field">
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </Field>
            )}

            {role === 'hospital' && (
              <>
                <Field label="Hospital Name">
                  <input type="text" name="hospitalName" required value={form.hospitalName}
                    onChange={handleChange} placeholder="Apollo Hospital" className="input-field" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="License / Reg. Number">
                    <input type="text" name="licenseNumber" required value={form.licenseNumber}
                      onChange={handleChange} placeholder="HOSP-2024-001" className="input-field" />
                  </Field>
                  <Field label="Emergency Contact">
                    <input type="tel" name="emergencyContact" required value={form.emergencyContact}
                      onChange={handleChange} placeholder="+91 9999999999" className="input-field" />
                  </Field>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City">
                <select name="city" value={form.city} onChange={handleChange} className="input-field">
                  {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Full Address">
                <input type="text" name="address" required value={form.address} onChange={handleChange}
                  placeholder="Street, Area, City" className="input-field" />
              </Field>
            </div>

            {role === 'hospital' && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <span className="text-amber-500 mt-0.5">⚠️</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Hospital accounts require admin verification before login. You will be notified once approved.
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : `Register as ${role === 'donor' ? 'Donor' : 'Hospital'} →`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#C0162C] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
