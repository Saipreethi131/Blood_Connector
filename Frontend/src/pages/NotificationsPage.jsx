import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useSocket } from '../context/SocketContext.jsx';

const typeCfg = {
  new_request:    { icon: '🩸', color: 'border-l-[#C0162C] bg-red-50',   dot: 'bg-[#C0162C]' },
  donor_response: { icon: '🤝', color: 'border-l-blue-500 bg-blue-50',   dot: 'bg-blue-500' },
  request_update: { icon: '📋', color: 'border-l-purple-500 bg-purple-50', dot: 'bg-purple-500' },
  general:        { icon: '🔔', color: 'border-l-slate-400 bg-slate-50',   dot: 'bg-slate-400' },
};

function SkeletonNotif() {
  return (
    <div className="card flex gap-4">
      <div className="skeleton skeleton-circle w-10 h-10" />
      <div className="flex-1 space-y-2">
        <div className="skeleton skeleton-text w-3/4" />
        <div className="skeleton skeleton-text w-1/3" />
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { refreshUnreadCount, resetUnreadCount } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
      refreshUnreadCount();
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
      refreshUnreadCount(); // keep the navbar bell badge in sync too
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      resetUnreadCount();
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to update notifications'); }
    finally { setMarkingAll(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[#C0162C] font-semibold mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll} className="btn-secondary text-sm py-2 px-4">
            {markingAll ? 'Marking…' : '✓ Mark all read'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonNotif key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl mb-4"
            style={{ background: 'linear-gradient(135deg, #FFF5F5, #ffe4e6)' }}>
            🔔
          </div>
          <h3 className="font-bold text-[#1A1A2E] text-lg mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            All Caught Up!
          </h3>
          <p className="text-slate-400 text-sm">No notifications yet. We'll let you know when something happens.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => {
            const cfg = typeCfg[n.type] || typeCfg.general;
            return (
              <div key={n._id}
                className={`card cursor-pointer border-l-4 transition-all duration-200 hover:shadow-md notif-enter
                  ${n.isRead ? 'border-l-slate-200 bg-white' : cfg.color}
                  ${!n.isRead ? 'hover:-translate-y-0.5' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => !n.isRead && markRead(n._id)}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    n.isRead ? 'bg-slate-100' : 'bg-white shadow-sm'
                  }`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${n.isRead ? 'text-slate-500' : 'text-[#1A1A2E] font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
