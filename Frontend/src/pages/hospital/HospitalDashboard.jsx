import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['Normal', 'Urgent', 'Critical'];

const statusBadge = { Pending: 'badge-pending', Fulfilled: 'badge-fulfilled', Cancelled: 'badge-cancelled' };
const urgencyClass = { Critical: 'badge-critical', Urgent: 'badge-urgent', Normal: 'badge-normal' };

const TABS = ['Post Request', 'My Requests', 'Search Donors'];

export default function HospitalDashboard() {
  const { user, profile } = useAuth();
  const { unreadCount } = useSocket();

  const [hospital, setHospital] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('Post Request');

  // Post request form
  const [requestForm, setRequestForm] = useState({
    bloodGroup: 'A+', unitsRequired: 1, urgency: 'Normal', notes: ''
  });
  const [posting, setPosting] = useState(false);

  // My requests
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Search donors
  const [donorSearch, setDonorSearch] = useState({ bloodGroup: 'A+', city: '' });
  const [donors, setDonors] = useState([]);
  const [searchingDonors, setSearchingDonors] = useState(false);
  const [donorSearchDone, setDonorSearchDone] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/hospital/profile');
      setHospital(data.data.hospital);
    } catch {
      toast.error('Failed to load hospital profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data } = await api.get('/hospital/requests');
      setMyRequests(data.data.requests);
    } catch {
      toast.error('Failed to load your requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (activeTab === 'My Requests') fetchMyRequests();
  }, [activeTab]);


  const handlePostRequest = async (e) => {
    e.preventDefault();
    if (requestForm.unitsRequired < 1) {
      toast.error('Units required must be at least 1');
      return;
    }
    setPosting(true);
    try {
      await api.post('/hospital/request', requestForm);
      toast.success('Blood request posted successfully!');
      setRequestForm({ bloodGroup: 'A+', unitsRequired: 1, urgency: 'Normal', notes: '' });
      setActiveTab('My Requests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post request');
    } finally {
      setPosting(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await api.put(`/hospital/request/${requestId}`, { status });
      toast.success(`Request marked as ${status}`);
      setMyRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, status } : r))
      );
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSearchDonors = async (e) => {
    e.preventDefault();
    setSearchingDonors(true);
    setDonorSearchDone(false);
    try {
      const params = { bloodGroup: donorSearch.bloodGroup };
      if (donorSearch.city.trim()) params.city = donorSearch.city.trim();
      const { data } = await api.get('/hospital/donors', { params });
      setDonors(data.data.donors);
      setDonorSearchDone(true);
    } catch {
      toast.error('Failed to search donors');
    } finally {
      setSearchingDonors(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hospital Dashboard</h1>
          <p className="text-gray-500 text-sm">
            {loadingProfile ? '…' : hospital?.hospitalName || user?.name}
          </p>
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
      {!loadingProfile && hospital && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-2xl">
              🏥
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-lg">{hospital.hospitalName}</p>
              <p className="text-gray-500 text-sm">{hospital.address}</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Reg. No: {hospital.licenseNumber} · Emergency: {hospital.emergencyContact}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'Post Request' && '🩸 '}
              {tab === 'My Requests' && '📋 '}
              {tab === 'Search Donors' && '🔍 '}
              {tab}
            </button>
          ))}
        </div>

        {/* Post Request Tab */}
        {activeTab === 'Post Request' && (
          <div className="card max-w-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Post a Blood Request</h2>
            <form onSubmit={handlePostRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={requestForm.bloodGroup}
                    onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}
                    className="input-field"
                  >
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units Required</label>
                  <input
                    type="number"
                    min={1}
                    value={requestForm.unitsRequired}
                    onChange={(e) => setRequestForm({ ...requestForm, unitsRequired: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                <select
                  value={requestForm.urgency}
                  onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                  className="input-field"
                >
                  {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Patient condition, special requirements, etc."
                  className="input-field resize-none"
                />
              </div>
              {(requestForm.urgency === 'Critical' || requestForm.urgency === 'Urgent') && (
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">
                  ⚡ All available matching donors will be notified immediately via real-time alerts.
                </p>
              )}
              <button type="submit" disabled={posting} className="btn-primary w-full py-2.5">
                {posting ? 'Posting…' : 'Post Blood Request'}
              </button>
            </form>
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'My Requests' && (
          <div>
            {loadingRequests ? (
              <div className="text-center py-12 text-gray-400">Loading your requests…</div>
            ) : myRequests.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500">No blood requests posted yet</p>
                <button onClick={() => setActiveTab('Post Request')} className="btn-primary mt-4 text-sm">
                  Post First Request
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <div key={req._id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center font-bold text-red-600">
                        {req.bloodGroup}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={urgencyClass[req.urgency]}>{req.urgency}</span>
                          <span className={statusBadge[req.status]}>{req.status}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {req.unitsRequired} unit(s) · {req.responses?.length || 0} donor(s) responded
                        </p>
                        <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-gray-500 text-xs flex-1 border-l-2 border-gray-200 pl-3">{req.notes}</p>
                    )}

                    {req.status === 'Pending' && (
                      <div className="flex gap-2 ml-auto flex-shrink-0">
                        <button
                          onClick={() => handleUpdateStatus(req._id, 'Fulfilled')}
                          className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                        >
                          Mark Fulfilled
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req._id, 'Cancelled')}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Donors Tab */}
        {activeTab === 'Search Donors' && (
          <div>
            <form onSubmit={handleSearchDonors} className="card max-w-xl mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Find Available Donors</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={donorSearch.bloodGroup}
                    onChange={(e) => setDonorSearch({ ...donorSearch, bloodGroup: e.target.value })}
                    className="input-field"
                  >
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City (optional)</label>
                  <input
                    type="text"
                    value={donorSearch.city}
                    onChange={(e) => setDonorSearch({ ...donorSearch, city: e.target.value })}
                    placeholder="e.g. Hyderabad"
                    className="input-field"
                  />
                </div>
              </div>
              <button type="submit" disabled={searchingDonors} className="btn-primary w-full">
                {searchingDonors ? 'Searching…' : 'Search Donors'}
              </button>
            </form>

            {donorSearchDone && (
              donors.length === 0 ? (
                <div className="card text-center py-10">
                  <div className="text-4xl mb-3">😔</div>
                  <p className="text-gray-500">No available donors found for this criteria</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">{donors.length} donor(s) found</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {donors.map((donor) => (
                      <div key={donor._id} className="card flex items-start gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center font-bold text-red-600 flex-shrink-0">
                          {donor.bloodGroup}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {donor.user?.name || 'Donor'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{donor.address}</p>
                          <p className="text-xs text-gray-400 mt-0.5">📞 {donor.user?.phone || 'N/A'}</p>
                          <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Available
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
