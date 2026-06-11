import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

const TABS = ['Overview', 'Pending Approvals', 'All Hospitals', 'All Users', 'Blood Requests'];

const statusBadge = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

const reqStatusBadge = {
  Pending:   'badge-pending',
  Fulfilled: 'badge-fulfilled',
  Cancelled: 'badge-cancelled'
};

const urgencyClass = {
  Critical: 'badge-critical',
  Urgent:   'badge-urgent',
  Normal:   'badge-normal'
};

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'red' }) {
  const colors = {
    red:    'bg-red-50 border-red-200 text-red-600',
    green:  'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    blue:   'bg-blue-50 border-blue-200 text-blue-600',
    gray:   'bg-gray-50 border-gray-200 text-gray-600'
  };
  return (
    <div className={`card border ${colors[color].split(' ').slice(1).join(' ')}`}>
      <p className={`text-3xl font-bold ${colors[color].split(' ')[2]}`}>{value}</p>
      <p className="text-gray-700 font-medium mt-1 text-sm">{label}</p>
      {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <p className="text-gray-800 font-medium mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            className={`text-sm px-4 py-2 rounded-lg font-medium text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } transition-colors`}
          >
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

  if (loading) return <div className="text-center py-16 text-gray-400">Loading stats…</div>;
  if (!stats) return null;

  const { users, requests } = stats;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Users</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Donors"     value={users.totalDonors}       color="red" />
          <StatCard label="Total Hospitals"  value={users.totalHospitals}    color="blue" />
          <StatCard label="Approved"         value={users.approvedHospitals} color="green" />
          <StatCard label="Pending Approval" value={users.pendingHospitals}  color="yellow" />
          <StatCard label="Rejected"         value={users.rejectedHospitals} color="gray" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Blood Requests</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Requests"    value={requests.totalRequests}    color="blue" />
          <StatCard label="Pending"           value={requests.pendingRequests}  color="yellow" />
          <StatCard label="Fulfilled"         value={requests.fulfilledRequests} color="green" />
          <StatCard label="Cancelled"         value={requests.cancelledRequests} color="gray" />
        </div>
      </div>
    </div>
  );
}

// ── Pending Approvals Tab ─────────────────────────────────────────────────────
function PendingApprovalsTab({ onCountChange }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // { type, userId, name }
  const [rejectReason, setRejectReason] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetch = () => {
    setLoading(true);
    api.get('/admin/hospitals/pending')
      .then(({ data }) => { setHospitals(data.data.hospitals); onCountChange(data.data.count); })
      .catch(() => toast.error('Failed to load pending hospitals'))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const handleApprove = async (userId, name) => {
    setActionId(userId);
    try {
      await api.put(`/admin/hospitals/${userId}/approve`);
      toast.success(`${name} approved!`);
      setHospitals((prev) => prev.filter((h) => h._id !== userId));
      onCountChange((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionId(null);
      setConfirm(null);
    }
  };

  const handleReject = async (userId, name) => {
    setActionId(userId);
    try {
      await api.put(`/admin/hospitals/${userId}/reject`, { reason: rejectReason });
      toast.success(`${name} rejected`);
      setHospitals((prev) => prev.filter((h) => h._id !== userId));
      onCountChange((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionId(null);
      setRejectReason('');
      setConfirm(null);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>;

  if (hospitals.length === 0)
    return (
      <div className="card text-center py-16">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-gray-500">No hospitals awaiting approval</p>
      </div>
    );

  return (
    <>
      {confirm?.type === 'approve' && (
        <ConfirmModal
          message={`Approve "${confirm.name}"? They will be able to log in immediately.`}
          confirmLabel="Approve"
          onConfirm={() => handleApprove(confirm.userId, confirm.name)}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'reject' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <p className="text-gray-800 font-medium mb-3">Reject "{confirm.name}"?</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional — will be sent to hospital)"
              rows={3}
              className="input-field text-sm mb-4 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="btn-secondary text-sm">Cancel</button>
              <button
                onClick={() => handleReject(confirm.userId, confirm.name)}
                className="text-sm px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">{hospitals.length} hospital(s) awaiting approval</p>
      <div className="space-y-4">
        {hospitals.map((h) => (
          <div key={h._id} className="card border border-yellow-200 bg-yellow-50">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-full border border-yellow-200 flex items-center justify-center text-xl flex-shrink-0">
                🏥
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-bold text-gray-800">{h.profile?.hospitalName || h.name}</p>
                  <span className="badge-pending">Pending</span>
                </div>
                <p className="text-sm text-gray-600">{h.email} · {h.phone}</p>
                <p className="text-sm text-gray-500 mt-0.5">{h.profile?.address}</p>
                <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-400">
                  <span>Reg. No: {h.profile?.licenseNumber || '—'}</span>
                  <span>Emergency: {h.profile?.emergencyContact || '—'}</span>
                  <span>Registered: {new Date(h.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  disabled={actionId === h._id}
                  onClick={() => setConfirm({ type: 'approve', userId: h._id, name: h.profile?.hospitalName || h.name })}
                  className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={actionId === h._id}
                  onClick={() => setConfirm({ type: 'reject', userId: h._id, name: h.profile?.hospitalName || h.name })}
                  className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                >
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

  const fetch = (status = '') => {
    setLoading(true);
    api.get('/admin/hospitals', { params: status ? { status } : {} })
      .then(({ data }) => setHospitals(data.data.hospitals))
      .catch(() => toast.error('Failed to load hospitals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(filter); }, [filter]);

  const handleApprove = async (userId, name) => {
    setActionId(userId);
    try {
      await api.put(`/admin/hospitals/${userId}/approve`);
      toast.success(`${name} approved`);
      setHospitals((prev) => prev.map((h) =>
        h._id === userId ? { ...h, verificationStatus: 'approved', isVerified: true } : h
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionId(null); }
  };

  const handleReject = async (userId, name) => {
    setActionId(userId);
    try {
      await api.put(`/admin/hospitals/${userId}/reject`);
      toast.success(`${name} rejected`);
      setHospitals((prev) => prev.map((h) =>
        h._id === userId ? { ...h, verificationStatus: 'rejected', isVerified: false } : h
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActionId(null); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === s ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : hospitals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No hospitals found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hospitals.map((h) => (
            <div key={h._id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-800">{h.profile?.hospitalName || h.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[h.verificationStatus]}`}>
                    {h.verificationStatus}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{h.email} · {h.phone}</p>
                <p className="text-xs text-gray-400 mt-0.5">{h.profile?.address} · Reg: {h.profile?.licenseNumber}</p>
              </div>
              {h.verificationStatus === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button disabled={actionId === h._id} onClick={() => handleApprove(h._id, h.profile?.hospitalName || h.name)}
                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                    Approve
                  </button>
                  <button disabled={actionId === h._id} onClick={() => handleReject(h._id, h.profile?.hospitalName || h.name)}
                    className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50">
                    Reject
                  </button>
                </div>
              )}
              {h.verificationStatus === 'rejected' && (
                <button disabled={actionId === h._id} onClick={() => handleApprove(h._id, h.profile?.hospitalName || h.name)}
                  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex-shrink-0">
                  Re-Approve
                </button>
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

  const fetch = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;

    api.get('/admin/users', { params })
      .then(({ data }) => {
        setUsers(data.data.users);
        setTotal(data.data.total);
        setPages(data.data.pages);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, [page, roleFilter, search]);

  const handleDelete = async (id, name) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(`"${name}" deleted`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const roleColor = { donor: 'bg-blue-100 text-blue-700', hospital: 'bg-purple-100 text-purple-700', admin: 'bg-red-100 text-red-700' };

  return (
    <div>
      {deleteConfirm && (
        <ConfirmModal
          message={`Permanently delete user "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(deleteConfirm.id, deleteConfirm.name)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex gap-1">
          {['', 'donor', 'hospital', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                roleFilter === r ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
              }`}
            >
              {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email…"
            className="input-field text-sm h-9 w-48"
          />
          <button type="submit" className="btn-primary text-sm h-9 px-4">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="btn-secondary text-sm h-9 px-3">Clear</button>
          )}
        </form>
        <span className="text-sm text-gray-500 ml-auto">{total} user(s)</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[u.verificationStatus]}`}>
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && u._id !== currentAdmin?.id && (
                        <button
                          onClick={() => setDeleteConfirm({ id: u._id, name: u.name })}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
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
                  className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="btn-secondary text-sm disabled:opacity-40">Next →</button>
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

  const fetch = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/requests', { params })
      .then(({ data }) => {
        setRequests(data.data.requests);
        setTotal(data.data.total);
        setPages(data.data.pages);
      })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, [page, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {['', 'Pending', 'Fulfilled', 'Cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === s ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300'
            }`}
          >
            {s === '' ? 'All' : s}
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-auto">{total} request(s)</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {['Hospital', 'Blood', 'Units', 'Urgency', 'Status', 'Responses', 'Posted'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate">{r.hospitalName}</td>
                    <td className="px-4 py-3">
                      <span className="bg-red-50 text-red-600 font-bold text-xs px-2 py-1 rounded">{r.bloodGroup}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.unitsRequired}</td>
                    <td className="px-4 py-3">
                      <span className={urgencyClass[r.urgency]}>{r.urgency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={reqStatusBadge[r.status]}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.responses?.length || 0}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
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
                  className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="btn-secondary text-sm disabled:opacity-40">Next →</button>
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Logged in as {user?.name} · {user?.email}</p>
        </div>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          Admin
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px relative ${
              activeTab === tab
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'Pending Approvals' && pendingCount > 0 && (
              <span className="ml-1.5 bg-red-600 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
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
