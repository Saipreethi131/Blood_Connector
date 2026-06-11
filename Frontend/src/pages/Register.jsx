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
  { name: 'Lucknow', coordinates: [80.9462, 26.8467] }
];

const defaultDonor = {
  name: '', email: '', password: '', phone: '',
  bloodGroup: '', city: 'Hyderabad', address: ''
};

const defaultHospital = {
  name: '', email: '', password: '', phone: '',
  hospitalName: '', licenseNumber: '', emergencyContact: '',
  city: 'Hyderabad', address: ''
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const initialRole = searchParams.get('role') === 'hospital' ? 'hospital' : 'donor';
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState(initialRole === 'donor' ? defaultDonor : defaultHospital);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(role === 'donor' ? defaultDonor : defaultHospital);
  }, [role]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getCoords = (cityName) => {
    const city = CITIES.find((c) => c.name === cityName);
    return city ? city.coordinates : CITIES[0].coordinates;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const coordinates = getCoords(form.city);
      const payload = { ...form, coordinates };
      delete payload.city;

      const endpoint = role === 'donor' ? '/auth/register/donor' : '/auth/register/hospital';
      const { data } = await api.post(endpoint, payload);

      if (role === 'donor') {
        // Donor needs OTP verification
        sessionStorage.setItem('otp_phone', form.phone);
        toast.success('Registered! Please verify your phone number.');
        navigate('/verify-otp');
      } else {
        // Hospital awaits admin approval
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
    <div className="min-h-screen bg-red-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">🩸</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join Blood Connector and help save lives</p>
        </div>

        {/* Role Selector */}
        <div className="flex rounded-lg overflow-hidden border border-red-200 mb-6">
          {['donor', 'hospital'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 font-semibold text-sm transition-colors capitalize ${
                role === r ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              {r === 'donor' ? '🤝 Donor' : '🏥 Hospital'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" required value={form.name} onChange={handleChange}
                placeholder="John Doe" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" required value={form.phone} onChange={handleChange}
                placeholder="+91 9876543210" className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              placeholder="you@example.com" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" required minLength={6} value={form.password}
              onChange={handleChange} placeholder="Min. 6 characters" className="input-field" />
          </div>

          {/* Donor-specific */}
          {role === 'donor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select name="bloodGroup" required value={form.bloodGroup} onChange={handleChange}
                className="input-field">
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          )}

          {/* Hospital-specific */}
          {role === 'hospital' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                <input type="text" name="hospitalName" required value={form.hospitalName}
                  onChange={handleChange} placeholder="Apollo Hospital" className="input-field" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License / Reg. Number</label>
                  <input type="text" name="licenseNumber" required value={form.licenseNumber}
                    onChange={handleChange} placeholder="HOSP-2024-001" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                  <input type="tel" name="emergencyContact" required value={form.emergencyContact}
                    onChange={handleChange} placeholder="+91 9999999999" className="input-field" />
                </div>
              </div>
            </>
          )}

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select name="city" value={form.city} onChange={handleChange} className="input-field">
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
              <input type="text" name="address" required value={form.address} onChange={handleChange}
                placeholder="Street, Area, City" className="input-field" />
            </div>
          </div>

          {role === 'hospital' && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
              ⚠️ Hospital accounts require admin verification before login. You will be notified once approved.
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Creating account…' : `Register as ${role === 'donor' ? 'Donor' : 'Hospital'}`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-red-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
