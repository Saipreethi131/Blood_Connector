import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

const TABS = ['Overview', 'Pending Approvals', 'All Hospitals', 'All Users', 'Blood Requests'];

const statusBadge = {
  pending:  'badge-pending',
  approved: 'badge-normal',
  rejected: 'badge-critical',
};
const reqStatusBadge = { Pending: 'badge-pending', Fulfilled: 'badge-fulfilled', Cancelled: 'badge-cancelled' };
const urgencyClass = { Critical: 'badge-critical', Urgent: 'badge-urgent', Normal: 'badge-normal' };

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, gradient }) {
  return (
    <div className="card p-5 animate-fade-in-up">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 ${gradient}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>{value}</p>
      <p className="text-gray-500 text-sm font-medium mt-1">{label}</p>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,46,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-up">
        <p className="text-[#1A1A2E] font-semibold mb-4 leading-relaxed">{message}</p>
        {children}
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={onConfirm}
            className={`text-sm px-5 py-2 rounded-xl font-semibold text-white transition-all duration-200 ${
              danger ? 'bg-[#C0162C] hover:bg-[#8B0000]' : 'bg-green-600 hover:bg-green-700'
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {[1,2,3,4,5].map(i => <div key={i} className="card h-32 skeleton" />)}
    </div>
  );
  if (!stats) return null;
  const { users, requests } = stats;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Users</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Donors" value={users.totalDonors} icon="🤝" gradient="bg-gradient-to-br from-red-100 to-red-200" />
          <StatCard label="Total Hospitals" value={users.totalHospitals} icon="🏥" gradient="bg-gradient-to-br from-blue-100 to-blue-200" />
          <StatCard label="Approved" value={users.approvedHospitals} icon="✅" gradient="bg-gradient-to-br from-green-100 to-green-200" />
          <StatCard label="Pending" value={users.pendingHospitals} icon="⏳" gradient="bg-gradient-to-br from-yellow-100 to-yellow-200" />
          <StatCard label="Rejected" value={users.rejectedHospitals} icon="❌" gradient="bg-gradient-to-br from-gray-100 to-gray-200" />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Blood Requests</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={requests.totalRequests} icon="📋" gradient="bg-gradient-to-br from-blue-100 to-blue-200" />
          <StatCard label="Pending" value={requests.pendingRequests} icon="🩸" gradient="bg-gradient-to-br from-yellow-100 to-yellow-200" />
          <StatCard label="Fulfilled" value={requests.fulfilledRequests} icon="✅" gradient="bg-gradient-to-br from-green-100 to-green-200" />
          <StatCard label="Cancelled" value={requests.cancelledRequests} icon="🚫" gradient="bg-gradient-to-br from-gray-100 to-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ── Pending Approvals Tab ─────────────────────────────────────────────────────
function PendingApprovalsTab({ onCountChange }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchPending = () => {
    setLoading(true);
    api.get('/admin/hospitals/pending')
      .then(({ data }) => { setHospitals(data.data.hospitals); onCountChange(data.data.count); })
      .catch(() => toast.error('Failed to load pending hospitals'))
      .finally(() => setLoading(false));
  };
  useEffect(fetchPending, []);

  const handleApprove = async (userId, name) => {
    setActionId(userId);
    try {
      await api.put(`/admin/hospitals/${userId}/approve`);
      toast.success(`${name} approved!`);
      setHospitals((prev) => prev.filter((h) => h._id !== userId));
      onCountChange((c) => Math.max(0, c - 1));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); setConfirm(null); }
  };

  const handleReject = async (userId, name) => {
    setActionId(userId);
    try {
      await api.put(`/admin/hospitals/${userId}/reject`, { reason: rejectReason });
      toast.success(`${name} rejected`);
      setHospitals((prev) => prev.filter((h) => h._id !== userId));
      onCountChange((c) => Math.max(0, c - 1));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); setRejectReason(''); setConfirm(null); }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="card h-24 skeleton"/>)}</div>;

  if (hospitals.length === 0) return (
    <div className="card text-center py-16">
      <div className="text-5xl mb-4">✅</div>
      <h3 className="font-bold text-[#1A1A2E] mb-2">All Clear!</h3>
      <p className="text-gray-400">No hospitals awaiting approval</p>
    </div>
  );

  return (
    <>
      {confirm?.type === 'approve' && (
        <ConfirmModal message={`Approve "${confirm.name}"? They can log in immediately after approval.`}
          confirmLabel="Approve" onConfirm={() => handleApprove(confirm.userId, confirm.name)} onCancel={() => setConfirm(null)} />
      )}
      {confirm?.type === 'reject' && (
        <ConfirmModal message={`Reject "${confirm.name}"?`} confirmLabel="Reject" danger
          onConfirm={() => handleReject(confirm.userId, confirm.name)} onCancel={() => setConfirm(null)}>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (optional — sent to hospital)" rows={3}
            className="input-field text-sm resize-none mb-0" />
        </ConfirmModal>
      )}

      <p className="text-sm text-gray-500 mb-4">{hospitals.length} hospital(s) awaiting approval</p>
      <div className="space-y-4">
        {hospitals.map((h) => (
          <div key={h._id} className="card border-2 border-yellow-200 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center text-2xl flex-shrink-0">🏥</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-bold text-[#1A1A2E]">{h.profile?.hospitalName || h.name}</p>
                  <span className="badge-pending">Pending</span>
                </div>
                <p className="text-sm text-gray-600">{h.email} · {h.phone}</p>
                <p className="text-sm text-gray-500 mt-0.5">{h.profile?.address}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                  <span>Reg: {h.profile?.licenseNumber || '—'}</span>
                  <span>Emergency: {h.profile?.emergencyContact || '—'}</span>
                  <span>Joined: {new Date(h.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button disabled={actionId === h._id}
                  onClick={() => setConfirm({ type: 'approve', userId: h._id, name: h.profile?.hospitalName || h.name })}
                  className="text-sm px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all disabled:opacity-50">
                  Approve
                </button>
                <button disabled={actionId === h._id}
                  onClick={() => setConfirm({ type: 'reject', userId: h._id, name: h.profile?.hospitalName || h.name })}
                  className="text-sm px-4 py-2 bg-[#C0162C] text-white rounded-xl hover:bg-[#8B0000] font-semibold transition-all disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── All Hospitals Tab ─────────────────────────────────────────────────────────
function AllHospitalsTab() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchHospitals = (status = '') => {
    setLoading(true);
    api.get('/admin/hospitals', { params: status ? { status } : {} })
      .then(({ data }) => setHospitals(data.data.hospitals))
      .catch(() => toast.error('Failed to load hospitals'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchHospitals(filter); }, [filter]);

  const handleApprove = async (userId, name) => {
    setActionId(userId);
    try {
      await api.put(`/admin/hospitals/${userId}/approve`);
      toast.success(`${name} approved`);
      setHospitals((prev) => prev.map((h) => h._id === userId ? { ...h, verificationStatus: 'approved' } : h));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  const handleReject = async (userId, name) => {
    setActionId(userId);
    try {
      await api.put(`/admin/hospitals/${userId}/reject`);
      toast.success(`${name} rejected`);
      setHospitals((prev) => prev.map((h) => h._id === userId ? { ...h, verificationStatus: 'rejected' } : h));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              filter === s ? 'bg-[#C0162C] text-white' : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#C0162C] hover:text-[#C0162C]'
            }`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="card h-20 skeleton"/>)}</div>
      ) : hospitals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No hospitals found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hospitals.map((h) => (
            <div key={h._id} className="card flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in-up">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">🏥</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-[#1A1A2E] text-sm">{h.profile?.hospitalName || h.name}</p>
                    <span className={statusBadge[h.verificationStatus] || 'badge-pending'}>{h.verificationStatus}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{h.email} · {h.phone}</p>
                  <p className="text-xs text-gray-400">{h.profile?.address}</p>
                </div>
              </div>
              {h.verificationStatus === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button disabled={actionId === h._id} onClick={() => handleApprove(h._id, h.profile?.hospitalName || h.name)}
                    className="text-xs px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold disabled:opacity-50 transition-all">Approve</button>
                  <button disabled={actionId === h._id} onClick={() => handleReject(h._id, h.profile?.hospitalName || h.name)}
                    className="text-xs px-3 py-2 bg-[#C0162C] text-white rounded-xl hover:bg-[#8B0000] font-semibold disabled:opacity-50 transition-all">Reject</button>
                </div>
              )}
              {h.verificationStatus === 'rejected' && (
                <button disabled={actionId === h._id} onClick={() => handleApprove(h._id, h.profile?.hospitalName || h.name)}
                  className="text-xs px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold disabled:opacity-50 transition-all flex-shrink-0">Re-Approve</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── All Users Tab ─────────────────────────────────────────────────────────────
function AllUsersTab() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [suspendConfirm, setSuspendConfirm] = useState(null);
  const [actionId, setActionId] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    api.get('/admin/users', { params })
      .then(({ data }) => { setUsers(data.data.users); setTotal(data.data.total); setPages(data.data.pages); })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };
  useEffect(fetchUsers, [page, roleFilter, search]);

  const handleDelete = async (id, name) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(`"${name}" deleted`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setTotal((t) => t - 1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    finally { setDeleteConfirm(null); }
  };

  const handleSuspendToggle = async (id, name, currentlySuspended) => {
    setActionId(id);
    const endpoint = currentlySuspended ? `/admin/users/${id}/unsuspend` : `/admin/users/${id}/suspend`;
    try {
      await api.put(endpoint);
      toast.success(currentlySuspended ? `${name} unsuspended` : `${name} suspended`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isSuspended: !currentlySuspended } : u));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionId(null); setSuspendConfirm(null); }
  };

  const roleColor = {
    donor:    'bg-blue-100 text-blue-700 border border-blue-200',
    hospital: 'bg-purple-100 text-purple-700 border border-purple-200',
    admin:    'bg-red-100 text-[#C0162C] border border-red-200',
  };

  return (
    <div>
      {deleteConfirm && (
        <ConfirmModal message={`Permanently delete "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete" danger
          onConfirm={() => handleDelete(deleteConfirm.id, deleteConfirm.name)}
          onCancel={() => setDeleteConfirm(null)} />
      )}
      {suspendConfirm && (
        <ConfirmModal
          message={suspendConfirm.suspended
            ? `Unsuspend "${suspendConfirm.name}"? They will regain access immediately.`
            : `Suspend "${suspendConfirm.name}"? They will be blocked from all API access.`}
          confirmLabel={suspendConfirm.suspended ? 'Unsuspend' : 'Suspend'}
          danger={!suspendConfirm.suspended}
          onConfirm={() => handleSuspendToggle(suspendConfirm.id, suspendConfirm.name, suspendConfirm.suspended)}
          onCancel={() => setSuspendConfirm(null)} />
      )}

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex gap-1.5">
          {['', 'donor', 'hospital', 'admin'].map((r) => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                roleFilter === r ? 'bg-[#C0162C] text-white' : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#C0162C]'
              }`}>
              {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email…" className="input-field text-sm h-10 w-48" />
          <button type="submit" className="btn-primary text-sm h-10 px-4">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="btn-secondary text-sm h-10 px-3">Clear</button>
          )}
        </form>
        <span className="text-sm text-gray-500 ml-auto font-medium">{total} user(s)</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="card h-14 skeleton"/>)}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border-2 border-gray-100">
            <table className="w-full text-sm">
              <thead style={{ background: 'linear-gradient(135deg, #1A1A2E, #2d1b4e)' }}>
                <tr>
                  {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-white/70 uppercase tracking-wide whitespace-nowrap text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-[#FFF0F0]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1A1A2E] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={statusBadge[u.verificationStatus] || 'badge-pending'}>{u.verificationStatus}</span>
                        {u.isSuspended && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 w-fit">
                            🚫 Suspended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && u._id !== currentAdmin?.id && (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={actionId === u._id}
                            onClick={() => setSuspendConfirm({ id: u._id, name: u.name, suspended: !!u.isSuspended })}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                              u.isSuspended
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            }`}>
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <button onClick={() => setDeleteConfirm({ id: u._id, name: u.name })}
                            className="text-xs text-[#C0162C] hover:text-[#8B0000] font-semibold hover:underline transition-colors">
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Blood Requests Tab ────────────────────────────────────────────────────────
function BloodRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/requests', { params })
      .then(({ data }) => { setRequests(data.data.requests); setTotal(data.data.total); setPages(data.data.pages); })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };
  useEffect(fetchRequests, [page, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {['', 'Pending', 'Fulfilled', 'Cancelled'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              statusFilter === s ? 'bg-[#C0162C] text-white' : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#C0162C]'
            }`}>
            {s === '' ? 'All' : s}
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-auto font-medium">{total} request(s)</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="card h-14 skeleton"/>)}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border-2 border-gray-100">
            <table className="w-full text-sm">
              <thead style={{ background: 'linear-gradient(135deg, #1A1A2E, #2d1b4e)' }}>
                <tr>
                  {['Hospital', 'Blood', 'Units', 'Urgency', 'Status', 'Responses', 'Posted'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-white/70 uppercase tracking-wide whitespace-nowrap text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-[#FFF0F0]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1A1A2E] max-w-[160px] truncate">{r.hospitalName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-white text-xs"
                        style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
                        {r.bloodGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{r.unitsRequired}</td>
                    <td className="px-4 py-3"><span className={urgencyClass[r.urgency]}>{r.urgency}</span></td>
                    <td className="px-4 py-3"><span className={reqStatusBadge[r.status]}>{r.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{r.responses?.length || 0}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="card overflow-hidden p-0">
        <div className="h-16 hero-gradient" />
        <div className="px-6 py-4 flex items-center justify-between gap-4 -mt-0">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Admin Dashboard
            </h1>
            <p className="text-gray-500 text-sm">{user?.name} · {user?.email}</p>
          </div>
          <span className="badge-critical">👑 Admin</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-gray-100 gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 -mb-0.5 relative ${
              activeTab === tab ? 'border-[#C0162C] text-[#C0162C]' : 'border-transparent text-gray-500 hover:text-[#1A1A2E]'
            }`}>
            {tab}
            {tab === 'Pending Approvals' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: '#C0162C' }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Overview'          && <OverviewTab />}
        {activeTab === 'Pending Approvals' && <PendingApprovalsTab onCountChange={setPendingCount} />}
        {activeTab === 'All Hospitals'     && <AllHospitalsTab />}
        {activeTab === 'All Users'         && <AllUsersTab />}
        {activeTab === 'Blood Requests'    && <BloodRequestsTab />}
      </div>
    </div>
  );
}
