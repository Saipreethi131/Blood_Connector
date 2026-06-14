import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { computeBadges, nextBadge } from '../../utils/badges.js';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RADIUS_OPTIONS = [
  { label: '5 km', value: '5' },
  { label: '10 km', value: '10' },
  { label: '25 km', value: '25' },
  { label: '50 km', value: '50' },
];

const urgencyCardCls = {
  Critical: 'req-card req-card-critical',
  Urgent:   'req-card req-card-urgent',
  Normal:   'req-card req-card-normal',
};
const urgencyCfg = {
  Critical: { badge: 'badge-critical', icon: '🚨' },
  Urgent:   { badge: 'badge-urgent',   icon: '⚠️' },
  Normal:   { badge: 'badge-normal',   icon: '🟢' },
};

const formatDistance = (m) => {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
};

const getExpiryLabel = (expiresAt) => {
  const diff = new Date(expiresAt) - Date.now();
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 1) return 'very soon';
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.ceil(hours / 24)}d`;
};

function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <div className="flex gap-3">
        <div className="skeleton skeleton-circle w-10 h-10" />
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-text w-3/4" />
          <div className="skeleton skeleton-text w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-16 flex-1 rounded-xl" />
        <div className="skeleton h-16 flex-1 rounded-xl" />
      </div>
      <div className="skeleton h-9 rounded-xl" />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="card flex gap-4">
      <div className="skeleton skeleton-circle w-20 h-20" />
      <div className="flex-1 space-y-2">
        <div className="skeleton skeleton-title w-40" />
        <div className="skeleton skeleton-text w-56" />
        <div className="skeleton skeleton-text w-32" />
      </div>
    </div>
  );
}

export default function DonorDashboard() {
  const { user, updateProfile } = useAuth();
  const { unreadCount } = useSocket();

  const [donor, setDonor] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [requests, setRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [filters, setFilters] = useState({ bloodGroup: '', city: '' });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState('10');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [lowerTab, setLowerTab] = useState('requests');
  const [copiedId, setCopiedId] = useState(null);

  // Blood camps
  const [publicCamps, setPublicCamps] = useState([]);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [registeringCampId, setRegisteringCampId] = useState(null);
  const [registeredCamps, setRegisteredCamps] = useState(new Set());

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/donor/profile');
      setDonor(data.data.donor);
      setEligibility(data.data.eligibility ?? null);
      setEditForm({ bloodGroup: data.data.donor.bloodGroup || '', address: data.data.donor.address || '' });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoadingProfile(false); }
  };

  const fetchRequests = async (location = userLocation, rad = radius) => {
    setLoadingRequests(true);
    try {
      const params = {};
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;
      if (location) { params.lat = location.lat; params.lng = location.lng; params.radius = rad; }
      else if (filters.city.trim()) { params.city = filters.city.trim(); }
      const { data } = await api.get('/donor/requests', { params });
      setRequests(data.data.requests);
    } catch { toast.error('Failed to load blood requests'); }
    finally { setLoadingRequests(false); }
  };

  const fetchDonations = async () => {
    try {
      const { data } = await api.get('/donor/donations');
      setDonations(data.data.donations);
    } catch { toast.error('Failed to load donation history'); }
    finally { setLoadingDonations(false); }
  };

  const fetchPublicCamps = async () => {
    setLoadingCamps(true);
    try {
      const { data } = await api.get('/camps');
      const camps = data.data.camps || [];
      setPublicCamps(camps);
    } catch { toast.error('Failed to load blood camps'); }
    finally { setLoadingCamps(false); }
  };

  const handleRegisterCamp = async (campId) => {
    setRegisteringCampId(campId);
    try {
      await api.post(`/camps/${campId}/register`);
      toast.success('Registered for the camp! Hospital has been notified.');
      setRegisteredCamps((prev) => new Set([...prev, campId]));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register');
    } finally {
      setRegisteringCampId(null);
    }
  };

  useEffect(() => { fetchProfile(); fetchDonations(); }, []);
  useEffect(() => { fetchRequests(); }, []);
  useEffect(() => { if (lowerTab === 'camps') fetchPublicCamps(); }, [lowerTab]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocating(false);
        toast.success('Location detected — showing nearby requests');
        fetchRequests(loc, radius);
      },
      () => { setLocating(false); toast.error('Could not get location. Allow location access.'); },
      { timeout: 10000 }
    );
  };

  const handleClearLocation = () => { setUserLocation(null); fetchRequests(null, radius); };

  const handleRadiusChange = (e) => {
    const r = e.target.value; setRadius(r);
    if (userLocation) fetchRequests(userLocation, r);
  };

  const handleToggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      const { data } = await api.put('/donor/availability');
      setDonor((p) => ({ ...p, isAvailable: data.data.isAvailable }));
      toast.success(data.message);
    } catch { toast.error('Failed to update availability'); }
    finally { setTogglingAvail(false); }
  };

  const handleRespond = async (requestId) => {
    setRespondingId(requestId);
    try {
      await api.post(`/donor/respond/${requestId}`);
      toast.success('Response sent! The hospital has been notified.');
      setRequests((prev) => prev.map((r) =>
        r._id === requestId
          ? { ...r, hasResponded: true, myResponse: { status: 'Pending', respondedAt: new Date().toISOString() } }
          : r
      ));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to respond'); }
    finally { setRespondingId(null); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.post('/donor/profile', editForm);
      setDonor(data.data.donor); updateProfile(data.data.donor); setEditMode(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const handleCopyLink = (reqId) => {
    navigator.clipboard.writeText(`${window.location.origin}/request/${reqId}`);
    setCopiedId(reqId);
    toast.success('Link copied!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCertificate = (donation) => {
    const donorName = user?.name || 'Donor';
    const hospital = donation.hospitalName || 'Hospital';
    const bloodGroup = donation.bloodGroup || '';
    const date = new Date(donation.donationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const certId = donation._id?.slice(-8).toUpperCase();

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Donation Certificate</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#f8f8f8;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
  .cert{width:794px;background:#fff;border:2px solid #C0162C;border-radius:8px;padding:60px;text-align:center;position:relative;box-shadow:0 4px 32px rgba(0,0,0,0.12)}
  .cert::before{content:'';position:absolute;inset:8px;border:1px solid rgba(192,22,44,0.3);border-radius:4px;pointer-events:none}
  .logo{font-size:28px;font-weight:700;color:#C0162C;letter-spacing:-0.5px;font-family:'Playfair Display',serif;margin-bottom:4px}
  .logo span{color:#1A1A2E}
  .subtitle{color:#666;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:40px}
  .title{font-family:'Playfair Display',serif;font-size:36px;color:#1A1A2E;margin-bottom:8px}
  .present{color:#888;font-size:14px;letter-spacing:1px;text-transform:uppercase;margin-bottom:24px}
  .name{font-family:'Playfair Display',serif;font-size:42px;color:#C0162C;border-bottom:3px solid #C0162C;display:inline-block;padding-bottom:8px;margin-bottom:32px}
  .body{color:#444;font-size:16px;line-height:1.8;max-width:560px;margin:0 auto 32px}
  .body strong{color:#1A1A2E;font-weight:600}
  .badge{display:inline-flex;align-items:center;gap:10px;background:#fff0f3;border:2px solid #C0162C;border-radius:50px;padding:12px 28px;margin-bottom:36px}
  .badge-bg{font-size:28px;font-weight:700;color:#C0162C;font-family:'Playfair Display',serif}
  .badge-label{font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px}
  .footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;border-top:1px solid #eee;padding-top:24px}
  .sig{text-align:center}
  .sig-line{width:160px;border-top:2px solid #1A1A2E;margin:0 auto 6px}
  .sig-label{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px}
  .cert-id{font-size:11px;color:#bbb;text-align:right}
  .print-btn{display:block;margin:24px auto 0;padding:12px 32px;background:#C0162C;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:0.5px}
  @media print{body{background:#fff;padding:0}.print-btn{display:none}.cert{box-shadow:none;border-radius:0;width:100%}}
</style></head><body>
<div class="cert">
  <div class="logo">Blood<span>Connector</span></div>
  <div class="subtitle">Blood Donor Recognition Program</div>
  <div class="title">Certificate of Appreciation</div>
  <div class="present">This Certificate is Proudly Presented To</div>
  <div class="name">${donorName}</div>
  <p class="body">
    In recognition of your selfless act of donating blood at<br>
    <strong>${hospital}</strong><br>
    Your generous donation of <strong>${bloodGroup}</strong> blood on <strong>${date}</strong><br>
    has the potential to save precious lives.
  </p>
  <div class="badge">
    <span class="badge-bg">${bloodGroup}</span>
    <div><div style="font-size:15px;font-weight:700;color:#1A1A2E">Life Saver</div><div class="badge-label">Blood Donor</div></div>
  </div>
  <div class="footer">
    <div class="sig"><div class="sig-line"></div><div class="sig-label">Blood Connector</div></div>
    <div class="cert-id">Certificate ID: BC-${certId}<br>Issued: ${date}</div>
    <div class="sig"><div class="sig-line"></div><div class="sig-label">Authorised Signatory</div></div>
  </div>
</div>
<button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`);
    win.document.close();
    win.focus();
  };

  const badges = donor ? computeBadges(donor.totalDonations) : [];
  const next = donor ? nextBadge(donor.totalDonations) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Donor Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, <span className="font-semibold text-[#C0162C]">{user?.name}</span></p>
        </div>
        <Link to="/notifications"
          className="relative inline-flex items-center gap-2 bg-white border-2 border-gray-200 text-[#1A1A2E] px-4 py-2.5 rounded-xl font-semibold text-sm hover:border-[#C0162C] hover:text-[#C0162C] transition-all duration-200">
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
      {loadingProfile ? <ProfileSkeleton /> : !donor ? (
        <div className="card text-center py-10">
          <p className="text-gray-500">Profile not found. Please contact support.</p>
        </div>
      ) : editMode ? (
        <div className="card">
          <h2 className="text-lg font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Edit Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
            <div>
              <label className="input-label">Blood Group</label>
              <select value={editForm.bloodGroup} onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })} className="input-field">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Address</label>
              <input type="text" value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="input-field" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden shadow-md" style={{ animation: 'fadeInUp 0.35s ease-out' }}>
          {/* Full-gradient profile header — all content on dark bg with white text */}
          <div className="hero-gradient px-6 pt-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {/* Blood group avatar */}
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-white text-xl flex-shrink-0
                  border-2 shadow-xl"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    borderColor: 'rgba(255,255,255,0.6)',
                    fontFamily: 'Poppins, sans-serif',
                  }}>
                  {donor.bloodGroup}
                </div>
                <div className="min-w-0 pt-1 flex flex-col gap-0.5">
                  <p className="font-bold text-white text-lg leading-tight truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {user?.name}
                  </p>
                  <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{donor.address || 'No address set'}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {donor.lastDonationDate
                      ? `Last donated: ${new Date(donor.lastDonationDate).toLocaleDateString()}`
                      : 'Never donated yet'}
                    {' · '}
                    <span className="font-semibold text-white">{donor.totalDonations}</span> donation{donor.totalDonations !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap flex-shrink-0">
                {/* Availability toggle */}
                <div className="flex items-center gap-2">
                  <button onClick={handleToggleAvailability} disabled={togglingAvail}
                    className="toggle-track"
                    style={{ background: donor.isAvailable ? '#16a34a' : 'rgba(255,255,255,0.25)' }}>
                    <span className="toggle-knob"
                      style={{ transform: donor.isAvailable ? 'translateX(28px)' : 'translateX(4px)' }} />
                  </button>
                  <span className="text-sm font-semibold text-white">
                    {togglingAvail ? '…' : donor.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <button onClick={() => setEditMode(true)}
                  className="text-sm py-2 px-4 rounded-xl font-semibold transition-all duration-200"
                  style={{ border: '2px solid rgba(255,255,255,0.7)', color: '#fff', background: 'rgba(255,255,255,0.1)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {badges.map((b) => (
                  <span key={b.id} title={b.description} className="badge-gold">
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            )}
            {next && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 rounded-full h-2 overflow-hidden max-w-[200px]"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((donor.totalDonations / next.threshold) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                    }} />
                </div>
                <p className="text-xs text-white">
                  {next.icon} {next.threshold - donor.totalDonations} more to <strong>{next.label}</strong>
                </p>
              </div>
            )}

            {/* Eligibility badge */}
            {eligibility && (
              <div className="mt-3">
                {eligibility.isEligible ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(22,163,74,0.25)', color: '#86efac', border: '1px solid rgba(134,239,172,0.3)' }}>
                    ✅ Eligible to donate
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' }}>
                    🚫 Eligible from {new Date(eligibility.nextEligibleDate).toLocaleDateString()} · {eligibility.daysUntilEligible}d to go
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex border-b-2 border-gray-100 gap-1 overflow-x-auto">
        {[['requests', '🩸 Blood Requests'], ['history', '📋 Donation History'], ['camps', '⛺ Blood Camps']].map(([tab, label]) => (
          <button key={tab} onClick={() => setLowerTab(tab)}
            className={`px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-0.5 ${
              lowerTab === tab
                ? 'border-[#C0162C] text-[#C0162C]'
                : 'border-transparent text-gray-500 hover:text-[#1A1A2E]'
            }`}>
            {label}
            {tab === 'history' && donations.length > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                {donations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Blood Requests Tab ───────────────────────────────────────────── */}
      {lowerTab === 'requests' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="section-title">Open Blood Requests</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
              {requests.length} found
            </span>
          </div>

          {/* Filters */}
          <form onSubmit={(e) => { e.preventDefault(); fetchRequests(); }}
            className="card mb-4 flex flex-wrap gap-3 items-end p-4">
            <div className="flex-1 min-w-[130px]">
              <label className="input-label text-xs">Blood Group</label>
              <select value={filters.bloodGroup} onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                className="input-field text-sm py-2">
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg || 'All groups'}</option>)}
              </select>
            </div>

            {!userLocation ? (
              <div className="flex-1 min-w-[150px]">
                <label className="input-label text-xs">City</label>
                <input type="text" placeholder="e.g. Hyderabad" value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="input-field text-sm py-2" />
              </div>
            ) : (
              <div className="flex-1 min-w-[150px]">
                <label className="input-label text-xs">Radius</label>
                <select value={radius} onChange={handleRadiusChange} className="input-field text-sm py-2">
                  {RADIUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary text-sm py-2 px-5 h-[42px]">Search</button>

            <button type="button" onClick={handleGetLocation} disabled={locating}
              className={`text-sm py-2 px-4 h-[42px] rounded-xl font-semibold transition-all duration-200 ${
                userLocation ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' : 'btn-ghost border-2 border-gray-200'
              }`}>
              {locating ? '⌛ Locating…' : userLocation ? '📍 Near Me' : '📍 Use Location'}
            </button>

            {userLocation && (
              <button type="button" onClick={handleClearLocation} className="btn-secondary text-sm py-2 px-4 h-[42px]">
                Clear
              </button>
            )}
          </form>

          {userLocation && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-2.5 rounded-xl mb-4">
              📍 Showing requests within <strong>{radius} km</strong> of your location, sorted by distance
            </div>
          )}

          {loadingRequests ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🩸</div>
              <h3 className="font-bold text-[#1A1A2E] mb-2">No Requests Found</h3>
              <p className="text-gray-400 text-sm">
                {userLocation ? `No open requests within ${radius} km` : 'No open blood requests match your filters'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((req) => {
                const cfg = urgencyCfg[req.urgency] || urgencyCfg.Normal;
                return (
                  <div key={req._id} className={urgencyCardCls[req.urgency] || 'req-card req-card-normal'}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-[#1A1A2E] text-sm leading-snug truncate">{req.hospitalName}</h3>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{req.address}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={cfg.badge}>{cfg.icon} {req.urgency}</span>
                        {req.distance != null && (
                          <span className="text-xs text-blue-600 font-semibold">📍 {formatDistance(req.distance)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 bg-white/80 rounded-xl p-3 text-center border border-current/10">
                        <p className="font-bold text-[#C0162C] text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{req.bloodGroup}</p>
                        <p className="text-gray-400 text-xs">Blood Type</p>
                      </div>
                      <div className="flex-1 bg-white/80 rounded-xl p-3 text-center border border-gray-100">
                        <p className="font-bold text-[#1A1A2E] text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{req.unitsRequired}</p>
                        <p className="text-gray-400 text-xs">Units Needed</p>
                      </div>
                    </div>

                    {/* Compatibility badge */}
                    {req.compatibility === 'exact' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 w-fit">
                        ✓ Exact Blood Match
                      </span>
                    )}
                    {req.compatibility === 'compatible' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 w-fit">
                        ✓ Compatible Type
                      </span>
                    )}

                    {req.notes && (
                      <p className="text-gray-500 text-xs border-l-2 border-[#C0162C]/30 pl-3">{req.notes}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                      <span>{req.responses?.length || 0} responded</span>
                      <div className="flex items-center gap-2">
                        {req.expiresAt && (
                          <span className="text-orange-500 font-medium">
                            ⏱ Expires {getExpiryLabel(req.expiresAt)}
                          </span>
                        )}
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Accepted alert — shown above buttons */}
                    {req.hasResponded && req.myResponse?.status === 'Accepted' && (
                      <div className="flex items-start gap-2 bg-green-50 border-2 border-green-200 rounded-xl p-3">
                        <span className="flex-shrink-0 text-green-600">✅</span>
                        <div>
                          <p className="text-xs font-bold text-green-800">You've been accepted!</p>
                          <p className="text-xs text-green-700 mt-0.5">
                            Contact <strong>{req.hospitalName}</strong> directly to confirm your donation.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {req.hasResponded ? (
                        req.myResponse?.status === 'Accepted' ? (
                          <div className="flex-1 py-2.5 text-center rounded-xl text-sm font-semibold bg-green-100 text-green-700 border-2 border-green-200">
                            ✅ Accepted
                          </div>
                        ) : req.myResponse?.status === 'Rejected' ? (
                          <div className="flex-1 py-2.5 text-center rounded-xl text-sm font-medium bg-gray-100 text-gray-500 border-2 border-gray-200">
                            Not needed this time
                          </div>
                        ) : (
                          <div className="flex-1 py-2.5 text-center rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 border-2 border-amber-200">
                            ⏳ Response Pending
                          </div>
                        )
                      ) : eligibility && !eligibility.isEligible ? (
                        <div className="flex-1 py-2.5 text-center rounded-xl text-xs font-semibold bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
                          title={`You can donate again on ${new Date(eligibility.nextEligibleDate).toLocaleDateString()}`}>
                          🚫 Eligible {getExpiryLabel(eligibility.nextEligibleDate).replace('in ', 'in ')}
                        </div>
                      ) : (
                        <button onClick={() => handleRespond(req._id)} disabled={respondingId === req._id}
                          className="btn-primary flex-1 py-2.5 text-sm">
                          {respondingId === req._id ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Sending…
                            </span>
                          ) : 'Respond'}
                        </button>
                      )}
                      <button onClick={() => handleCopyLink(req._id)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                          copiedId === req._id ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200 hover:border-[#C0162C] hover:text-[#C0162C]'
                        }`}
                        title="Copy shareable link">
                        {copiedId === req._id ? '✓' : '🔗'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Blood Camps Tab ──────────────────────────────────────────────── */}
      {lowerTab === 'camps' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Upcoming Blood Camps</h2>
            <button onClick={fetchPublicCamps} disabled={loadingCamps}
              className="text-sm btn-secondary py-1.5 px-4">
              {loadingCamps ? '…' : 'Refresh'}
            </button>
          </div>

          {loadingCamps ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : publicCamps.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">⛺</div>
              <h3 className="font-bold text-[#1A1A2E] mb-2">No Upcoming Camps</h3>
              <p className="text-gray-400 text-sm">Check back later for blood donation drives near you</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicCamps.map((camp) => {
                const isRegistered = registeredCamps.has(camp._id);
                const isRegistering = registeringCampId === camp._id;
                const statusColor = camp.status === 'Ongoing'
                  ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }
                  : { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
                return (
                  <div key={camp._id} className="card flex flex-col gap-3 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-[#1A1A2E] text-sm leading-snug flex-1">{camp.title}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0"
                        style={{ background: statusColor.bg, borderColor: statusColor.border, color: statusColor.text }}>
                        {camp.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 font-medium">🏥 {camp.hospitalName}</p>
                      <p className="text-xs text-gray-500">📅 {new Date(camp.date).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">📍 {camp.address}</p>
                    </div>

                    {camp.description && (
                      <p className="text-xs text-gray-500 border-l-2 border-[#C0162C]/30 pl-2 line-clamp-2">
                        {camp.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {camp.targetBloodGroups?.map((bg) => (
                        <span key={bg} className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#FFF0F0', color: '#C0162C', border: '1px solid #ffcdd2' }}>
                          {bg}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                      <span>{camp.registrations?.length || 0} registered</span>
                    </div>

                    <button
                      onClick={() => handleRegisterCamp(camp._id)}
                      disabled={isRegistered || isRegistering}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                        isRegistered
                          ? 'bg-green-50 border-green-200 text-green-700 cursor-not-allowed'
                          : 'border-[#C0162C] text-[#C0162C] hover:bg-[#C0162C] hover:text-white'
                      }`}>
                      {isRegistering ? 'Registering…' : isRegistered ? '✅ Registered' : 'Register'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Donation History Tab ─────────────────────────────────────────── */}
      {lowerTab === 'history' && (
        <div>
          <h2 className="section-title mb-6">Donation History</h2>

          {badges.length > 0 && (
            <div className="card mb-6">
              <p className="text-sm font-bold text-[#1A1A2E] mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                🏆 Badges Earned
              </p>
              <div className="flex flex-wrap gap-4">
                {badges.map((b) => (
                  <div key={b.id} className="flex flex-col items-center gap-2 p-4 rounded-2xl min-w-[90px]"
                    style={{ background: 'linear-gradient(135deg, #FFF9E6, #FFFACD)', border: '2px solid #FFD700' }}>
                    <span className="text-3xl">{b.icon}</span>
                    <span className="text-xs font-bold text-[#1A1A2E]">{b.label}</span>
                    <span className="text-xs text-gray-500 text-center leading-tight">{b.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingDonations ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card flex gap-4">
                  <div className="skeleton skeleton-circle w-12 h-12" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton skeleton-text w-1/2" />
                    <div className="skeleton skeleton-text w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : donations.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">💉</div>
              <h3 className="font-bold text-[#1A1A2E] mb-2">No Donations Yet</h3>
              <p className="text-gray-400 text-sm">Respond to a blood request to start your donation journey</p>
              <button onClick={() => setLowerTab('requests')} className="btn-primary mt-4 text-sm">
                Browse Requests →
              </button>
            </div>
          ) : (
            <div className="relative">
              {donations.map((d, i) => (
                <div key={d._id} className="timeline-item">
                  <div className="timeline-dot">{d.bloodGroup}</div>
                  <div className="card-hover ml-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-[#1A1A2E] text-sm">{d.hospitalName}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {d.bloodGroup} · {d.units || 1} unit{d.units !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={d.status === 'Verified' ? 'badge-gold' : 'badge-fulfilled'}>
                          {d.status === 'Verified' ? '⭐ Verified' : '✅ Completed'}
                        </span>
                        <p className="text-xs text-gray-400">
                          {new Date(d.donationDate).toLocaleDateString()}
                        </p>
                        <button onClick={() => handleCertificate(d)}
                          className="text-xs px-3 py-1 rounded-lg font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
                          🏆 Certificate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
