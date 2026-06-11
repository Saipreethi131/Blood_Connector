import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const urgencyClass = { Critical: 'badge-critical', Urgent: 'badge-urgent', Normal: 'badge-normal' };

export default function DonorDashboard() {
  const { user, profile, updateProfile } = useAuth();
  const { unreadCount } = useSocket();

  const [donor, setDonor] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ bloodGroup: '', city: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [togglingAvail, setTogglingAvail] = useState(false);

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/donor/profile');
      setDonor(data.data.donor);
      setEditForm({
        bloodGroup: data.data.donor.bloodGroup || '',
        address: data.data.donor.address || ''
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const params = {};
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;
      if (filters.city.trim()) params.city = filters.city.trim();
      const { data } = await api.get('/donor/requests', { params });
      setRequests(data.data.requests);
    } catch {
      toast.error('Failed to load blood requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => { fetchRequests(); }, []);


  const handleToggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      const { data } = await api.put('/donor/availability');
      setDonor((prev) => ({ ...prev, isAvailable: data.data.isAvailable }));
      toast.success(data.message);
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setTogglingAvail(false);
    }
  };

  const handleRespond = async (requestId) => {
    setRespondingId(requestId);
    try {
      await api.post(`/donor/respond/${requestId}`);
      toast.success('Response sent to hospital!');
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, hasResponded: true } : r))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setRespondingId(null);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.post('/donor/profile', editForm);
      setDonor(data.data.donor);
      updateProfile(data.data.donor);
      setEditMode(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFilterSearch = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Donor Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
        </div>
        <Link to="/notifications" className="btn-secondary text-sm flex items-center gap-1">
          🔔 Notifications
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* Profile Card */}
      <div className="card">
        {loadingProfile ? (
          <div className="text-gray-400 text-center py-8">Loading profile…</div>
        ) : donor ? (
          editMode ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Edit Profile</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  className="input-field"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={savingProfile} className="btn-primary">
                  {savingProfile ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-2xl font-bold text-red-600">
                  {donor.bloodGroup}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{user?.name}</p>
                  <p className="text-gray-500 text-sm">{donor.address}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Last donated:{' '}
                    {donor.lastDonationDate
                      ? new Date(donor.lastDonationDate).toLocaleDateString()
                      : 'Never'}
                    {' · '}Total donations: {donor.totalDonations}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleToggleAvailability}
                  disabled={togglingAvail}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    donor.isAvailable
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {togglingAvail ? '…' : donor.isAvailable ? '✅ Available' : '🔴 Unavailable'}
                </button>
                <button onClick={() => setEditMode(true)} className="btn-secondary text-sm">
                  Edit Profile
                </button>
              </div>
            </div>
          )
        ) : (
          <p className="text-gray-500">Profile not found.</p>
        )}
      </div>

      {/* Blood Requests */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-800">Open Blood Requests</h2>
          <span className="text-sm text-gray-500">{requests.length} requests found</span>
        </div>

        {/* Filters */}
        <form onSubmit={handleFilterSearch} className="card mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Blood Group</label>
            <select
              value={filters.bloodGroup}
              onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
              className="input-field text-sm"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg || 'All groups'}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">City / Location</label>
            <input
              type="text"
              placeholder="e.g. Hyderabad"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <button type="submit" className="btn-primary text-sm h-[38px] px-5">
            Search
          </button>
          <button
            type="button"
            onClick={() => { setFilters({ bloodGroup: '', city: '' }); setTimeout(fetchRequests, 0); }}
            className="btn-secondary text-sm h-[38px] px-5"
          >
            Clear
          </button>
        </form>

        {loadingRequests ? (
          <div className="text-center py-12 text-gray-400">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🩸</div>
            <p className="text-gray-500">No open blood requests found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <div key={req._id} className="card hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{req.hospitalName}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">{req.address}</p>
                  </div>
                  <span className={urgencyClass[req.urgency] || 'badge-normal'}>{req.urgency}</span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="bg-red-50 rounded-lg px-3 py-2 text-center flex-1">
                    <p className="font-bold text-red-600 text-lg">{req.bloodGroup}</p>
                    <p className="text-gray-500 text-xs">Blood Type</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 text-center flex-1">
                    <p className="font-bold text-gray-700 text-lg">{req.unitsRequired}</p>
                    <p className="text-gray-500 text-xs">Units Needed</p>
                  </div>
                </div>

                {req.notes && (
                  <p className="text-gray-500 text-xs border-l-2 border-red-200 pl-2">{req.notes}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                  <span>{req.responses?.length || 0} donor(s) responded</span>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>

                {req.hasResponded ? (
                  <button disabled className="w-full py-2 rounded-lg text-sm bg-green-100 text-green-700 font-medium cursor-default">
                    ✅ Responded
                  </button>
                ) : (
                  <button
                    onClick={() => handleRespond(req._id)}
                    disabled={respondingId === req._id}
                    className="btn-primary w-full py-2 text-sm"
                  >
                    {respondingId === req._id ? 'Sending…' : 'Respond to Request'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
