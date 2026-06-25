import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { downloadCSV, openPrintTable } from '../../utils/exportHelpers.js';
import RateModal from '../../components/RateModal.jsx';
import { RatingStars } from '../../components/RatingStars.jsx';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CAMP_STATUS_COLORS = {
  Upcoming:  { bg: 'bg-blue-50',   text: 'text-blue-700',  border: 'border-blue-200' },
  Ongoing:   { bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-200' },
  Completed: { bg: 'bg-slate-50',   text: 'text-slate-600',  border: 'border-slate-200' },
  Cancelled: { bg: 'bg-red-50',    text: 'text-red-600',   border: 'border-red-200' },
};
const URGENCY_LEVELS = ['Normal', 'Urgent', 'Critical'];
const RADIUS_OPTIONS = [
  { label: '5 km', value: '5' },
  { label: '10 km', value: '10' },
  { label: '25 km', value: '25' },
  { label: '50 km', value: '50' },
];

const formatDistance = (m) => {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
};

const urgencyCfg = {
  Critical: { badge: 'badge-critical', icon: '🚨' },
  Urgent:   { badge: 'badge-urgent',   icon: '⚠️' },
  Normal:   { badge: 'badge-normal',   icon: '🟢' },
};
const statusBadge = {
  Pending:   'badge-pending',
  Fulfilled: 'badge-fulfilled',
  Cancelled: 'badge-cancelled',
};

function SkeletonRow() {
  return (
    <div className="card flex gap-4">
      <div className="skeleton skeleton-circle w-12 h-12" />
      <div className="flex-1 space-y-2">
        <div className="skeleton skeleton-title w-1/3" />
        <div className="skeleton skeleton-text w-1/2" />
      </div>
    </div>
  );
}

function HospitalProfileSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md">
      <div className="px-6 pt-6 pb-6 bg-slate-100 flex items-center gap-4">
        <div className="skeleton skeleton-circle w-16 h-16" />
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-title w-48" />
          <div className="skeleton skeleton-text w-64" />
        </div>
      </div>
    </div>
  );
}

/* ─── Responses Modal ─────────────────────────────────────────────────────── */
function ResponsesModal({ request, onClose, onAction, processingDonorId }) {
  const responses = request.responses || [];
  const acceptedCount = responses.filter((r) => r.status === 'Accepted').length;
  const rejectedCount = responses.filter((r) => r.status === 'Rejected').length;
  const pendingCount  = responses.filter((r) => r.status === 'Pending').length;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
        style={{ animation: 'slideUp 0.2s ease-out' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#1A1A2E] text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Donor Responses
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {request.bloodGroup} · {request.unitsRequired} unit(s) needed
            </p>
            <div className="flex gap-3 mt-1">
              <span className="text-xs font-semibold text-amber-600">{pendingCount} pending</span>
              <span className="text-xs font-semibold text-green-600">{acceptedCount} accepted</span>
              <span className="text-xs font-semibold text-slate-400">{rejectedCount} rejected</span>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center
              transition-colors text-slate-600 font-bold text-lg flex-shrink-0">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {responses.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-5xl mb-3">🔔</div>
              <p className="font-semibold text-[#1A1A2E]">No responses yet</p>
              <p className="text-sm text-slate-400 mt-1">Donors will appear here once they respond</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map((resp) => {
                const donorId = resp.donorId?.toString?.() || String(resp.donorId);
                const isProcessing = processingDonorId === donorId;
                const isAccepted = resp.status === 'Accepted';
                const isRejected = resp.status === 'Rejected';
                const initial = resp.donorName?.trim()?.[0]?.toUpperCase() || '?';

                return (
                  <div key={resp._id || donorId}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                      isAccepted ? 'border-green-200 bg-green-50'
                      : isRejected ? 'border-slate-200 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>

                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
                      {initial}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1A1A2E] text-sm leading-snug truncate">
                        {resp.donorName?.trim() || 'Unknown Donor'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {resp.bloodGroup && (
                          <span className="text-xs font-bold text-[#C0162C] bg-[#FFF5F5] px-2 py-0.5 rounded-full border border-red-100">
                            {resp.bloodGroup}
                          </span>
                        )}
                        {resp.phone && (
                          <span className="text-xs text-slate-600 font-medium">📞 {resp.phone}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(resp.respondedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Action area — buttons OR status badge */}
                    <div className="flex-shrink-0">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl
                          bg-green-100 text-green-700 border-2 border-green-200">
                          ✅ Accepted
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl
                          bg-slate-100 text-slate-500 border-2 border-slate-200">
                          ✗ Rejected
                        </span>
                      ) : request.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAction(donorId, 'accept')}
                            disabled={!!processingDonorId}
                            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-xl font-semibold
                              hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isProcessing ? '…' : '✓ Accept'}
                          </button>
                          <button
                            onClick={() => onAction(donorId, 'reject')}
                            disabled={!!processingDonorId}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-xl font-semibold
                              hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isProcessing ? '…' : '✗ Reject'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-400">
            {responses.length} total · {acceptedCount} accepted · {rejectedCount} rejected
          </p>
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-5">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function HospitalDashboard() {
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  const [hospital, setHospital] = useState(null);
  const [profileCompleteness, setProfileCompleteness] = useState(null);
  const [hospitalRating, setHospitalRating] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ address: '', emergencyContact: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [ratingRequest, setRatingRequest] = useState(null);
  const [ratedRequestIds, setRatedRequestIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('Post Request');
  const [stats, setStats] = useState(null);

  const [requestForm, setRequestForm] = useState({ bloodGroup: 'A+', unitsRequired: 1, urgency: 'Normal', notes: '' });
  const [posting, setPosting] = useState(false);

  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [donorSearch, setDonorSearch] = useState({ bloodGroup: 'A+', city: '' });
  const [showCompatible, setShowCompatible] = useState(false);
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [donorSort, setDonorSort] = useState('default');
  const [donors, setDonors] = useState([]);
  const [searchingDonors, setSearchingDonors] = useState(false);
  const [donorSearchDone, setDonorSearchDone] = useState(false);
  const [donorLocation, setDonorLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [donorRadius, setDonorRadius] = useState('10');
  const [copiedId, setCopiedId] = useState(null);

  // Inventory tab
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);

  // Blood Camps tab
  const [camps, setCamps] = useState([]);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [campForm, setCampForm] = useState({
    title: '', description: '', date: '', address: '', city: '', expectedDonors: '', targetBloodGroups: [],
  });
  const [creatingCamp, setCreatingCamp] = useState(false);
  const [updatingCampId, setUpdatingCampId] = useState(null);

  // Responses modal
  const [viewingRequestId, setViewingRequestId] = useState(null);
  const [processingDonorId, setProcessingDonorId] = useState(null);
  const viewingRequest = viewingRequestId ? myRequests.find((r) => r._id === viewingRequestId) : null;

  const fetchProfile = async () => {
    setLoadingProfile(true);
    setProfileError(false);
    try {
      const { data } = await api.get('/hospital/profile');
      const profile = data.data.hospital ?? null;
      setHospital(profile);
      setProfileCompleteness(data.data.profileCompleteness ?? null);
      setHospitalRating(data.data.rating ?? null);
      if (profile) {
        setEditForm({
          address: profile.address || '',
          emergencyContact: profile.emergencyContact || '',
        });
      }
    } catch {
      setProfileError(true);
      toast.error('Failed to load hospital profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.post('/hospital/profile', editForm);
      setHospital(data.data.hospital);
      setProfileCompleteness(data.data.profileCompleteness ?? null);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data } = await api.get('/hospital/requests');
      const reqs = data.data.requests;
      setMyRequests(reqs);
      const fulfilledCount = reqs.filter((r) => r.status === 'Fulfilled').length;
      setStats({
        total: reqs.length,
        open: reqs.filter((r) => r.status === 'Pending').length,
        fulfilled: fulfilledCount,
        responses: reqs.reduce((s, r) => s + (r.responses?.length || 0), 0),
        fulfillmentRate: reqs.length > 0 ? Math.round((fulfilledCount / reqs.length) * 100) : 0,
      });
    } catch { toast.error('Failed to load your requests'); }
    finally { setLoadingRequests(false); }
  };

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const { data } = await api.get('/hospital/inventory');
      setInventory(data.data.inventory.inventory || []);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoadingInventory(false); }
  };

  const fetchCamps = async () => {
    setLoadingCamps(true);
    try {
      const { data } = await api.get('/camps/mine');
      setCamps(data.data.camps || []);
    } catch { toast.error('Failed to load camps'); }
    finally { setLoadingCamps(false); }
  };

  useEffect(() => { fetchProfile(); fetchMyRequests(); fetchInventory(); }, []);
  useEffect(() => {
    if (activeTab === 'My Requests') fetchMyRequests();
    if (activeTab === 'Inventory') fetchInventory();
    if (activeTab === 'Blood Camps') fetchCamps();
  }, [activeTab]);

  const handlePostRequest = async (e) => {
    e.preventDefault();
    if (requestForm.unitsRequired < 1) { toast.error('Units required must be at least 1'); return; }
    setPosting(true);
    try {
      await api.post('/hospital/request', requestForm);
      toast.success('Blood request posted! Donors are being notified.');
      setRequestForm({ bloodGroup: 'A+', unitsRequired: 1, urgency: 'Normal', notes: '' });
      setActiveTab('My Requests');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post request'); }
    finally { setPosting(false); }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await api.put(`/hospital/request/${requestId}`, { status });
      toast.success(`Request marked as ${status}`);
      fetchMyRequests(); // Refetch to get fulfilledBy + updated data
    } catch { toast.error('Failed to update status'); }
  };

  const handleDonorAction = async (donorId, action) => {
    setProcessingDonorId(donorId);
    try {
      await api.put(`/hospital/request/${viewingRequestId}/response/${donorId}`, { action });
      const newStatus = action === 'accept' ? 'Accepted' : 'Rejected';
      toast.success(action === 'accept' ? 'Donor accepted and notified!' : 'Response rejected.');
      // Update local state — viewingRequest is derived so it auto-updates
      setMyRequests((prev) =>
        prev.map((r) =>
          r._id === viewingRequestId
            ? {
                ...r,
                responses: r.responses.map((resp) =>
                  resp.donorId?.toString() === donorId ? { ...resp, status: newStatus } : resp
                ),
              }
            : r
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update response');
    } finally {
      setProcessingDonorId(null);
    }
  };

  const handleGetDonorLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setDonorLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); toast.success('Location detected'); },
      () => { setLocating(false); toast.error('Could not get location.'); },
      { timeout: 10000 }
    );
  };

  const handleSearchDonors = async (e) => {
    e.preventDefault(); setSearchingDonors(true); setDonorSearchDone(false);
    try {
      const params = { bloodGroup: donorSearch.bloodGroup };
      if (showCompatible) params.compatible = 'true';
      if (includeUnavailable) params.includeUnavailable = 'true';
      if (donorLocation) { params.lat = donorLocation.lat; params.lng = donorLocation.lng; params.radius = donorRadius; }
      else if (donorSearch.city.trim()) { params.city = donorSearch.city.trim(); }
      const { data } = await api.get('/hospital/donors', { params });
      setDonors(data.data.donors); setDonorSearchDone(true);
    } catch { toast.error('Failed to search donors'); }
    finally { setSearchingDonors(false); }
  };

  const handleSaveInventory = async () => {
    setSavingInventory(true);
    try {
      await api.put('/hospital/inventory', { inventory });
      toast.success('Inventory saved!');
    } catch { toast.error('Failed to save inventory'); }
    finally { setSavingInventory(false); }
  };

  const handleInventoryChange = (bloodGroup, value) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.bloodGroup === bloodGroup ? { ...item, units: Math.max(0, parseInt(value) || 0) } : item
      )
    );
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    if (campForm.targetBloodGroups.length === 0) {
      toast.error('Select at least one target blood group'); return;
    }
    setCreatingCamp(true);
    try {
      await api.post('/camps', { ...campForm, expectedDonors: parseInt(campForm.expectedDonors, 10) || 0 });
      toast.success('Blood camp created! Donors are being notified.');
      setCampForm({ title: '', description: '', date: '', address: '', city: '', expectedDonors: '', targetBloodGroups: [] });
      fetchCamps();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create camp'); }
    finally { setCreatingCamp(false); }
  };

  const handleCampStatusUpdate = async (campId, status) => {
    setUpdatingCampId(campId);
    try {
      await api.put(`/camps/${campId}/status`, { status });
      toast.success(`Camp marked as ${status}`);
      fetchCamps();
    } catch { toast.error('Failed to update camp status'); }
    finally { setUpdatingCampId(null); }
  };

  const toggleTargetGroup = (bg) => {
    setCampForm((prev) => ({
      ...prev,
      targetBloodGroups: prev.targetBloodGroups.includes(bg)
        ? prev.targetBloodGroups.filter((g) => g !== bg)
        : [...prev.targetBloodGroups, bg],
    }));
  };

  const handleCopyLink = (reqId) => {
    navigator.clipboard.writeText(`${window.location.origin}/request/${reqId}`);
    setCopiedId(reqId);
    toast.success('Shareable link copied!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportCSV = () => {
    if (myRequests.length === 0) { toast.error('No requests to export'); return; }
    downloadCSV('blood-requests.csv', myRequests.map((r) => ({
      BloodGroup: r.bloodGroup,
      UnitsRequired: r.unitsRequired,
      Urgency: r.urgency,
      Status: r.status,
      Responses: r.responses?.length || 0,
      PostedOn: new Date(r.createdAt).toLocaleString(),
    })));
  };

  const handleExportPDF = () => {
    if (myRequests.length === 0) { toast.error('No requests to export'); return; }
    openPrintTable('My Blood Requests', [
      { key: 'bloodGroup', label: 'Blood Group' },
      { key: 'unitsRequired', label: 'Units' },
      { key: 'urgency', label: 'Urgency' },
      { key: 'status', label: 'Status' },
      { key: 'responses', label: 'Responses' },
      { key: 'postedOn', label: 'Posted On' },
    ], myRequests.map((r) => ({
      bloodGroup: r.bloodGroup,
      unitsRequired: r.unitsRequired,
      urgency: r.urgency,
      status: r.status,
      responses: r.responses?.length || 0,
      postedOn: new Date(r.createdAt).toLocaleDateString(),
    })));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {ratingRequest && (
        <RateModal
          requestId={ratingRequest._id}
          targetLabel={ratingRequest.fulfilledBy?.donorName || 'Donor'}
          onClose={() => setRatingRequest(null)}
          onSubmitted={() => setRatedRequestIds((prev) => new Set([...prev, ratingRequest._id]))}
        />
      )}

      {/* Responses modal */}
      {viewingRequest && (
        <ResponsesModal
          request={viewingRequest}
          onClose={() => setViewingRequestId(null)}
          onAction={handleDonorAction}
          processingDonorId={processingDonorId}
        />
      )}

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Hospital Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            <span className="font-semibold text-[#C0162C]">{loadingProfile ? '…' : hospital?.hospitalName || user?.name}</span>
          </p>
        </div>
        <Link to="/notifications"
          className="relative inline-flex items-center gap-2 bg-white border-2 border-slate-200 text-[#1A1A2E] px-4 py-2.5 rounded-xl font-semibold text-sm hover:border-[#C0162C] hover:text-[#C0162C] transition-all duration-200">
          🔔 Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ background: '#C0162C' }}>
              {unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* ─── Profile Card ─────────────────────────────────────────────────── */}
      {loadingProfile ? <HospitalProfileSkeleton /> : editMode ? (
        <div className="card">
          <h2 className="text-lg font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Edit Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
            <div>
              <label className="input-label">Address</label>
              <input type="text" required value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="input-label">Emergency Contact</label>
              <input type="tel" required value={editForm.emergencyContact}
                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                placeholder="+91 9999999999" className="input-field" />
            </div>
            <p className="text-xs text-slate-400">
              Hospital name and license number are set at registration and verified by an administrator — contact support to change them.
            </p>
            <div className="flex gap-3">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      ) : !hospital ? (
        <div className="card text-center py-10 space-y-4">
          <div className="text-5xl">{profileError ? '⚠️' : '🏥'}</div>
          <h2 className="text-lg font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {profileError ? "Couldn't Load Your Profile" : 'Hospital Profile Not Found'}
          </h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {profileError
              ? 'Check your connection and try again.'
              : 'Your hospital profile could not be found. Please contact support.'}
          </p>
          {profileError && (
            <button onClick={fetchProfile} className="btn-secondary text-sm px-6 py-2.5">Retry</button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden shadow-md" style={{ animation: 'fadeInUp 0.35s ease-out' }}>
          <div className="px-6 pt-6 pb-6"
            style={{ background: 'linear-gradient(135deg, #C0162C 0%, #8B0000 100%)' }}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '2px solid rgba(255,255,255,0.5)',
                  }}>
                  🏥
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-white text-xl leading-tight truncate"
                      style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {hospital.hospitalName}
                    </h2>
                    {user?.verificationStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(34,197,94,0.2)', color: '#86efac', border: '1px solid rgba(134,239,172,0.3)' }}>
                        ✅ Verified
                      </span>
                    )}
                    <RatingStars rating={hospitalRating} />
                  </div>
                  <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    📍 {hospital.address}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Reg: {hospital.licenseNumber} · 📞 {hospital.emergencyContact}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditMode(true)}
                className="text-sm py-2 px-4 rounded-xl font-semibold transition-all duration-200 flex-shrink-0"
                style={{ border: '2px solid rgba(255,255,255,0.7)', color: '#fff', background: 'rgba(255,255,255,0.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                Edit Profile
              </button>
            </div>

            {profileCompleteness != null && profileCompleteness < 100 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">Profile {profileCompleteness}% complete</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${profileCompleteness}%`, background: profileCompleteness < 80 ? '#FFD700' : '#86efac' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Stats Row ────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests',  value: stats.total,     icon: '📋', accentColor: '#3b82f6', iconBg: '#eff6ff' },
            { label: 'Open Requests',   value: stats.open,      icon: '🩸', accentColor: '#C0162C', iconBg: '#FFF5F5' },
            { label: 'Fulfilled',       value: stats.fulfilled, icon: '✅', accentColor: '#16a34a', iconBg: '#f0fdf4' },
            { label: 'Total Responses', value: stats.responses, icon: '🤝', accentColor: '#7c3aed', iconBg: '#f5f3ff' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-4"
              style={{
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${s.accentColor}`,
                animation: 'fadeInUp 0.35s ease-out',
              }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: s.iconBg }}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#1A1A2E] leading-none"
                  style={{ fontSize: '2rem', fontFamily: 'Poppins, sans-serif' }}>
                  {s.value}
                </p>
                <p className="font-medium text-slate-500 mt-0.5 truncate" style={{ fontSize: '0.75rem' }}>
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex border-b-2 border-slate-100 gap-0 overflow-x-auto">
        {[
          { id: 'Post Request',  icon: '🩸' },
          { id: 'My Requests',   icon: '📋' },
          { id: 'Search Donors', icon: '🔍' },
          { id: 'Inventory',     icon: '🏦' },
          { id: 'Blood Camps',   icon: '⛺' },
        ].map(({ id, icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-6 py-3.5 text-sm whitespace-nowrap transition-all duration-200 border-b-2 -mb-0.5 ${
              activeTab === id
                ? 'border-[#C0162C] text-[#C0162C] font-bold'
                : 'border-transparent text-slate-500 font-medium hover:text-[#1A1A2E] hover:bg-slate-50'
            }`}>
            {icon} {id}
          </button>
        ))}
      </div>

      {/* ─── Post Request Tab ─────────────────────────────────────────────── */}
      {activeTab === 'Post Request' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form */}
          <div className="lg:col-span-2 card">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-5" style={{ fontFamily: 'Poppins, sans-serif' }}>
              🩸 Post a Blood Request
            </h2>
            <form onSubmit={handlePostRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Blood Group</label>
                  <select value={requestForm.bloodGroup}
                    onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })} className="input-field">
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                  {(() => {
                    const own = inventory.find((i) => i.bloodGroup === requestForm.bloodGroup);
                    if (!own) return null;
                    return (
                      <p className="text-xs text-slate-400 mt-1.5">
                        🏦 You currently have <strong className={own.units === 0 ? 'text-[#C0162C]' : own.units < 5 ? 'text-orange-500' : 'text-green-600'}>
                          {own.units} unit{own.units !== 1 ? 's' : ''}
                        </strong> of {requestForm.bloodGroup} in your own inventory
                      </p>
                    );
                  })()}
                </div>
                <div>
                  <label className="input-label">Units Required</label>
                  <input type="number" min={1} value={requestForm.unitsRequired}
                    onChange={(e) => setRequestForm({ ...requestForm, unitsRequired: parseInt(e.target.value) || 1 })}
                    className="input-field" />
                </div>
              </div>

              <div>
                <label className="input-label">Urgency Level</label>
                <div className="flex gap-2 mt-1">
                  {URGENCY_LEVELS.map((u) => (
                    <button key={u} type="button" onClick={() => setRequestForm({ ...requestForm, urgency: u })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                        requestForm.urgency === u
                          ? u === 'Critical' ? 'bg-red-50 border-[#C0162C] text-[#C0162C]'
                            : u === 'Urgent' ? 'bg-orange-50 border-orange-500 text-orange-600'
                            : 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      {u === 'Critical' ? '🚨' : u === 'Urgent' ? '⚠️' : '🟢'} {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">Notes (optional)</label>
                <textarea value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  rows={3} placeholder="Patient condition, special requirements…" className="input-field resize-none" />
              </div>

              {(requestForm.urgency === 'Critical' || requestForm.urgency === 'Urgent') && (
                <div className="flex items-start gap-3 bg-red-50 border-2 border-[#C0162C]/30 rounded-xl p-3">
                  <span className="text-[#C0162C] mt-0.5">⚡</span>
                  <p className="text-sm text-[#C0162C] font-medium">
                    All donors with matching blood group will be notified immediately via real-time alerts.
                  </p>
                </div>
              )}

              <button type="submit" disabled={posting}
                className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)', boxShadow: '0 4px 15px rgba(192,22,44,0.25)' }}>
                {posting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Posting…
                  </span>
                ) : '🩸 Post Blood Request'}
              </button>
            </form>
          </div>

          {/* Right panel: tips + summary */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="card" style={{ borderLeft: '4px solid #C0162C' }}>
              <h3 className="font-bold text-[#1A1A2E] mb-3 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                💡 Tips for a Good Request
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">🩸</span>
                  <span>Double-check the blood group before posting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">⚡</span>
                  <span>Use <strong className="text-[#C0162C]">Critical</strong> only for emergencies — all matched donors get instant alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">📝</span>
                  <span>Add patient condition in Notes to help donors decide quickly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">✅</span>
                  <span>Mark as <strong>Fulfilled</strong> once you have enough donors</span>
                </li>
              </ul>
            </div>

            {stats && (
              <div className="card">
                <h3 className="font-bold text-[#1A1A2E] mb-3 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  📊 Your Request Summary
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Total Posted',   value: stats.total,     color: '#1A1A2E' },
                    { label: 'Active Now',      value: stats.open,      color: '#C0162C' },
                    { label: 'Fulfilled',       value: stats.fulfilled, color: '#16a34a' },
                    { label: 'Donor Responses', value: stats.responses, color: '#7c3aed' },
                    { label: 'Fulfillment Rate', value: `${stats.fulfillmentRate}%`, color: '#16a34a' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{row.label}</span>
                      <span className="font-bold text-sm" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── My Requests Tab ──────────────────────────────────────────────── */}
      {activeTab === 'My Requests' && (
        <div>
          {myRequests.length > 0 && (
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={handleExportCSV} className="btn-secondary text-xs py-2 px-4">📄 Export CSV</button>
              <button onClick={handleExportPDF} className="btn-secondary text-xs py-2 px-4">🖨 Export PDF</button>
            </div>
          )}
          {loadingRequests ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>
          ) : myRequests.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="font-bold text-[#1A1A2E] mb-2">No Requests Yet</h3>
              <p className="text-slate-400 text-sm mb-6">Post your first blood request to find matching donors</p>
              <button onClick={() => setActiveTab('Post Request')} className="btn-primary text-sm">
                Post First Request →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => {
                const cfg = urgencyCfg[req.urgency] || urgencyCfg.Normal;
                const hasAccepted = req.responses?.some((r) => r.status === 'Accepted');
                const responseCount = req.responses?.length || 0;
                return (
                  <div key={req._id} className="card hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                      {/* Blood group avatar + info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)', fontFamily: 'Poppins, sans-serif' }}>
                          {req.bloodGroup}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cfg.badge}>{cfg.icon} {req.urgency}</span>
                            <span className={statusBadge[req.status]}>{req.status}</span>
                            {hasAccepted && req.status === 'Pending' && (
                              <span className="badge-fulfilled">✓ Donor Accepted</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 font-medium">
                            {req.unitsRequired} unit(s) · {responseCount} donor(s) responded
                          </p>
                          {req.status === 'Fulfilled' && req.fulfilledBy?.donorName && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-green-600 font-semibold">
                                ✅ Fulfilled by {req.fulfilledBy.donorName}
                              </p>
                              {!ratedRequestIds.has(req._id) && (
                                <button onClick={() => setRatingRequest(req)} className="text-xs font-bold text-amber-700 underline">
                                  ⭐ Rate donor
                                </button>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(req.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      {req.notes && (
                        <p className="text-slate-500 text-xs sm:flex-1 sm:max-w-[200px] border-l-2 border-slate-200 pl-3 truncate">
                          {req.notes}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                        {/* View responses button */}
                        <button
                          onClick={() => setViewingRequestId(req._id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 ${
                            responseCount > 0
                              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}>
                          👥 {responseCount}
                        </button>

                        <button onClick={() => handleCopyLink(req._id)}
                          className={`p-2.5 rounded-xl border-2 text-sm transition-all duration-200 ${
                            copiedId === req._id
                              ? 'bg-green-50 border-green-300 text-green-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-[#C0162C] hover:text-[#C0162C]'
                          }`}
                          title="Copy shareable link">
                          {copiedId === req._id ? '✓' : '🔗'}
                        </button>

                        {req.status === 'Pending' && (
                          <>
                            <button onClick={() => handleUpdateStatus(req._id, 'Fulfilled')}
                              className="text-xs px-3 py-2 bg-green-100 text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-200 font-semibold transition-all duration-200">
                              ✓ Fulfilled
                            </button>
                            <button onClick={() => handleUpdateStatus(req._id, 'Cancelled')}
                              className="text-xs px-3 py-2 bg-slate-100 text-slate-600 border-2 border-slate-200 rounded-xl hover:bg-slate-200 font-semibold transition-all duration-200">
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Inventory Tab ────────────────────────────────────────────────── */}
      {activeTab === 'Inventory' && (
        <div className="max-w-2xl">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                🏦 Blood Inventory
              </h2>
              <button onClick={handleSaveInventory} disabled={savingInventory || loadingInventory}
                className="btn-primary text-sm py-2 px-5 disabled:opacity-60">
                {savingInventory ? 'Saving…' : 'Save Inventory'}
              </button>
            </div>

            {loadingInventory ? (
              <div className="space-y-3">
                {BLOOD_GROUPS.map((bg) => (
                  <div key={bg} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {inventory.map((item) => (
                  <div key={item.bloodGroup}
                    className="flex items-center gap-4 p-3 rounded-xl border-2 border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)', fontFamily: 'Poppins, sans-serif' }}>
                      {item.bloodGroup}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1A1A2E]">{item.bloodGroup}</p>
                      <p className="text-xs text-slate-400">
                        {item.lastUpdated ? `Updated ${new Date(item.lastUpdated).toLocaleDateString()}` : 'Never updated'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={0} max={10000}
                        value={item.units}
                        onChange={(e) => handleInventoryChange(item.bloodGroup, e.target.value)}
                        className="input-field w-24 text-center font-bold text-[#1A1A2E]"
                        style={{ padding: '8px' }}
                      />
                      <span className="text-sm text-slate-500">units</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      item.units === 0 ? 'bg-red-500' : item.units < 5 ? 'bg-orange-400' : 'bg-green-500'
                    }`} title={item.units === 0 ? 'Critical' : item.units < 5 ? 'Low' : 'OK'} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-full bg-red-500" /> Critical (0 units)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-full bg-orange-400" /> Low (&lt;5 units)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-full bg-green-500" /> OK (5+ units)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Blood Camps Tab ──────────────────────────────────────────────── */}
      {activeTab === 'Blood Camps' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Create Camp Form */}
          <div className="lg:col-span-2 card self-start">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              ⛺ Create Blood Camp
            </h2>
            <form onSubmit={handleCreateCamp} className="space-y-4">
              <div>
                <label className="input-label">Camp Title</label>
                <input type="text" value={campForm.title} required maxLength={200}
                  onChange={(e) => setCampForm({ ...campForm, title: e.target.value })}
                  placeholder="e.g. Ramadan Blood Drive 2026" className="input-field" />
              </div>
              <div>
                <label className="input-label">Date & Time</label>
                <input type="datetime-local" value={campForm.date} required
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setCampForm({ ...campForm, date: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="input-label">Location / Address</label>
                <input type="text" value={campForm.address} required
                  onChange={(e) => setCampForm({ ...campForm, address: e.target.value })}
                  placeholder="Hall, Street, City" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">City (for targeted alerts)</label>
                  <input type="text" value={campForm.city}
                    onChange={(e) => setCampForm({ ...campForm, city: e.target.value })}
                    placeholder="e.g. Hyderabad" className="input-field" />
                </div>
                <div>
                  <label className="input-label">Expected Donors</label>
                  <input type="number" min={0} value={campForm.expectedDonors}
                    onChange={(e) => setCampForm({ ...campForm, expectedDonors: e.target.value })}
                    placeholder="e.g. 50" className="input-field" />
                </div>
              </div>
              <div>
                <label className="input-label">Description (optional)</label>
                <textarea value={campForm.description} rows={2} maxLength={1000}
                  onChange={(e) => setCampForm({ ...campForm, description: e.target.value })}
                  placeholder="Free refreshments, walk-ins welcome…" className="input-field resize-none" />
              </div>
              <div>
                <label className="input-label mb-2">Target Blood Groups</label>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button key={bg} type="button" onClick={() => toggleTargetGroup(bg)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                        campForm.targetBloodGroups.includes(bg)
                          ? 'bg-[#C0162C] border-[#C0162C] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-[#C0162C]'
                      }`}>
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={creatingCamp}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
                {creatingCamp ? 'Creating…' : '⛺ Create Camp'}
              </button>
            </form>
          </div>

          {/* Camp List */}
          <div className="lg:col-span-3">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              My Blood Camps ({camps.length})
            </h2>
            {loadingCamps ? (
              <div className="space-y-3">{[1, 2].map((i) => <SkeletonRow key={i} />)}</div>
            ) : camps.length === 0 ? (
              <div className="card text-center py-14">
                <div className="text-5xl mb-3">⛺</div>
                <p className="font-semibold text-[#1A1A2E]">No Camps Yet</p>
                <p className="text-sm text-slate-400 mt-1">Create your first blood donation camp</p>
              </div>
            ) : (
              <div className="space-y-3">
                {camps.map((camp) => {
                  const sc = CAMP_STATUS_COLORS[camp.status] || CAMP_STATUS_COLORS.Upcoming;
                  return (
                    <div key={camp._id} className="card hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-[#1A1A2E] text-sm">{camp.title}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                              {camp.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">📅 {new Date(camp.date).toLocaleString()}</p>
                          <p className="text-xs text-slate-500 mt-0.5">📍 {camp.address}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {camp.targetBloodGroups?.map((bg) => (
                              <span key={bg} className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: '#FFF5F5', color: '#C0162C', border: '1px solid #ffcdd2' }}>
                                {bg}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {camp.registrations?.length || 0} registered
                            {camp.expectedDonors > 0 && ` / ${camp.expectedDonors} expected`}
                          </p>
                        </div>

                        {camp.status === 'Upcoming' && (
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <button onClick={() => handleCampStatusUpdate(camp._id, 'Ongoing')}
                              disabled={updatingCampId === camp._id}
                              className="text-xs px-3 py-1.5 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl font-semibold hover:bg-green-100 transition-colors disabled:opacity-50">
                              Start
                            </button>
                            <button onClick={() => handleCampStatusUpdate(camp._id, 'Cancelled')}
                              disabled={updatingCampId === camp._id}
                              className="text-xs px-3 py-1.5 bg-slate-50 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50">
                              Cancel
                            </button>
                          </div>
                        )}
                        {camp.status === 'Ongoing' && (
                          <button onClick={() => handleCampStatusUpdate(camp._id, 'Completed')}
                            disabled={updatingCampId === camp._id}
                            className="text-xs px-3 py-1.5 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50 flex-shrink-0">
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Search Donors Tab ────────────────────────────────────────────── */}
      {activeTab === 'Search Donors' && (
        <div>
          <form onSubmit={handleSearchDonors} className="card max-w-xl mb-6">
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              🔍 Find Available Donors
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="input-label">Blood Group</label>
                <select value={donorSearch.bloodGroup}
                  onChange={(e) => setDonorSearch({ ...donorSearch, bloodGroup: e.target.value })} className="input-field">
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              {!donorLocation ? (
                <div>
                  <label className="input-label">City (optional)</label>
                  <input type="text" value={donorSearch.city}
                    onChange={(e) => setDonorSearch({ ...donorSearch, city: e.target.value })}
                    placeholder="e.g. Hyderabad" className="input-field" />
                </div>
              ) : (
                <div>
                  <label className="input-label">Search Radius</label>
                  <select value={donorRadius} onChange={(e) => setDonorRadius(e.target.value)} className="input-field">
                    {RADIUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mb-4">
              <button type="button" onClick={handleGetDonorLocation} disabled={locating}
                className={`flex-1 text-sm py-2.5 rounded-xl font-semibold transition-all duration-200 border-2 ${
                  donorLocation ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-[#C0162C] hover:text-[#C0162C]'
                }`}>
                {locating ? '⌛ Locating…' : donorLocation ? '📍 Location Set' : '📍 Use My Location'}
              </button>
              {donorLocation && (
                <button type="button" onClick={() => setDonorLocation(null)}
                  className="text-sm py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold border-2 border-slate-200 transition-all duration-200">
                  Clear
                </button>
              )}
            </div>

            {donorLocation && (
              <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl mb-4">
                📍 Will search within <strong>{donorRadius} km</strong> of your location
              </div>
            )}

            {/* Compatible types toggle */}
            <button type="button" onClick={() => setShowCompatible((v) => !v)}
              className={`w-full mb-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                showCompatible
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300'
              }`}>
              {showCompatible ? '✓' : '+'} Include Compatible Blood Types
              {showCompatible && <span className="text-xs opacity-70">(also shows donors who can donate to {donorSearch.bloodGroup})</span>}
            </button>

            {/* Include unavailable toggle */}
            <button type="button" onClick={() => setIncludeUnavailable((v) => !v)}
              className={`w-full mb-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                includeUnavailable
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-300'
              }`}>
              {includeUnavailable ? '✓' : '+'} Include Currently Unavailable Donors
            </button>

            <button type="submit" disabled={searchingDonors} className="btn-primary w-full py-3">
              {searchingDonors ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Searching…
                </span>
              ) : 'Search Donors →'}
            </button>
          </form>

          {donorSearchDone && (
            donors.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">😔</div>
                <h3 className="font-bold text-[#1A1A2E] mb-2">No Donors Found</h3>
                <p className="text-slate-400 text-sm">
                  {donorLocation ? `No available donors within ${donorRadius} km` : 'No available donors match this criteria'}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <p className="text-sm text-slate-500 font-medium">
                    {donors.length} donor(s) found
                  </p>
                  <select value={donorSort} onChange={(e) => setDonorSort(e.target.value)} className="input-field text-sm py-1.5 w-auto">
                    <option value="default">Sort: Default</option>
                    <option value="mostDonations">Sort: Most Donations</option>
                    <option value="leastRecentDonation">Sort: Longest Since Donated</option>
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {donors.slice().sort((a, b) => {
                    if (donorSort === 'mostDonations') return (b.totalDonations || 0) - (a.totalDonations || 0);
                    if (donorSort === 'leastRecentDonation') {
                      const at = a.lastDonationDate ? new Date(a.lastDonationDate).getTime() : 0;
                      const bt = b.lastDonationDate ? new Date(b.lastDonationDate).getTime() : 0;
                      return at - bt;
                    }
                    return 0;
                  }).map((donor) => (
                    <div key={donor._id} className="card-hover flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)', fontFamily: 'Poppins, sans-serif' }}>
                        {donor.bloodGroup}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-[#1A1A2E] text-sm truncate">{donor.user?.name || 'Donor'}</p>
                          {donor.distance != null && (
                            <span className="text-xs text-blue-600 font-semibold flex-shrink-0">
                              📍 {formatDistance(donor.distance)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{donor.address}</p>
                        <p className="text-xs text-slate-400 mt-0.5">📞 {donor.user?.phone || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={donor.isAvailable ? 'badge-normal' : 'badge-cancelled'}>
                            {donor.isAvailable ? '✅ Available' : '🚫 Unavailable'}
                          </span>
                          {showCompatible && donor.bloodGroup !== donorSearch.bloodGroup && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                              ✓ Compatible
                            </span>
                          )}
                          {donor.totalDonations > 0 && (
                            <span className="text-xs text-slate-400">{donor.totalDonations} donation{donor.totalDonations !== 1 ? 's' : ''}</span>
                          )}
                        </div>
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
  );
}
