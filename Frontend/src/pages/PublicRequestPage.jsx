import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const urgencyConfig = {
  Critical: { cls: 'badge-critical', icon: '🚨', cardCls: 'req-card req-card-critical' },
  Urgent:   { cls: 'badge-urgent',   icon: '⚠️', cardCls: 'req-card req-card-urgent' },
  Normal:   { cls: 'badge-normal',   icon: '🩸', cardCls: 'req-card req-card-normal' },
};

export default function PublicRequestPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/requests/${id}`)
      .then(({ data }) => setRequest(data.data.request))
      .catch(() => setError('Blood request not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full skeleton mx-auto" />
          <div className="h-5 w-48 skeleton mx-auto" />
          <div className="h-4 w-32 skeleton mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full py-16">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">Request Not Found</h2>
          <p className="text-slate-500 mb-6">{error || 'This request may have been fulfilled or removed.'}</p>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const cfg = urgencyConfig[request.urgency] || urgencyConfig.Normal;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-red-50 text-[#C0162C] text-sm font-semibold px-4 py-2 rounded-full mb-4">
          🩸 Blood Request
        </div>
        <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Urgent Help Needed
        </h1>
        <p className="text-slate-500">Share this link — every response matters</p>
      </div>

      {/* Request card */}
      <div className={cfg.cardCls}>
        {/* Hospital header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm border border-slate-100 flex-shrink-0">
            🏥
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#1A1A2E]">{request.hospitalName}</h2>
            <p className="text-slate-500 text-sm">{request.address}</p>
          </div>
          <span className={cfg.cls}>{cfg.icon} {request.urgency}</span>
        </div>

        {/* Blood info */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
            <p className="text-2xl font-bold text-[#C0162C]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {request.bloodGroup}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Blood Type</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
            <p className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {request.unitsRequired}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Units Needed</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
            <p className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {request.responses?.length ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Responded</p>
          </div>
        </div>

        {request.notes && (
          <div className="bg-white rounded-xl p-4 border-l-4 border-[#C0162C]">
            <p className="text-sm text-slate-600">{request.notes}</p>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Posted {new Date(request.createdAt).toLocaleString()}</span>
          <span className={request.status === 'Pending' ? 'badge-pending' : 'badge-fulfilled'}>
            {request.status}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        {request.status === 'Pending' && (
          user ? (
            user.role === 'donor' ? (
              <Link to="/donor/dashboard" className="btn-primary w-full py-3 text-base justify-center">
                Go to Dashboard to Respond →
              </Link>
            ) : null
          ) : (
            <Link to={`/register?role=donor`} className="btn-primary w-full py-3 text-base justify-center">
              Register as Donor to Respond →
            </Link>
          )
        )}

        <button onClick={handleCopy} className="btn-secondary w-full py-3 justify-center">
          {copied ? '✅ Link Copied!' : '🔗 Copy Shareable Link'}
        </button>

        <Link to="/" className="block text-center text-sm text-slate-400 hover:text-[#C0162C] transition-colors">
          ← Back to Blood Connector
        </Link>
      </div>
    </div>
  );
}
