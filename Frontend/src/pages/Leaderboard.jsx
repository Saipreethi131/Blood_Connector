import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { computeBadges } from '../utils/badges.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const rankMedal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

function LeaderboardRow({ entry, isMe }) {
  const badges = computeBadges(entry.totalDonations);
  const topBadge = badges[badges.length - 1];
  const medal = rankMedal(entry.rank);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
      isMe ? 'border-[#C0162C] bg-[#FFF5F5]' : 'border-slate-100 bg-white hover:border-slate-200'
    }`}>
      <div className="w-10 text-center font-bold text-lg flex-shrink-0" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {medal || `#${entry.rank}`}
      </div>
      <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
        {entry.bloodGroup}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#1A1A2E] text-sm truncate">
          {entry.name} {isMe && <span className="text-[#C0162C] text-xs font-semibold">(You)</span>}
        </p>
        <p className="text-xs text-slate-400 truncate">{entry.city || 'Location not set'}</p>
      </div>
      {topBadge && (
        <span className="badge-gold flex-shrink-0">{topBadge.icon} {topBadge.label}</span>
      )}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-[#C0162C] text-lg leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {entry.totalDonations}
        </p>
        <p className="text-xs text-slate-400">donation{entry.totalDonations !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myEntry, setMyEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ city: '', bloodGroup: '' });

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.city.trim()) params.city = filters.city.trim();
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;
      const { data } = await api.get('/leaderboard', { params });
      setLeaderboard(data.data.leaderboard);
      setMyEntry(data.data.myEntry);
    } catch (err) {
      const message = !err.response
        ? 'Cannot connect to server. Check your connection and try again.'
        : err.response.data?.message || 'Something went wrong loading the leaderboard.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, []);

  const myRankInTop10 = myEntry && leaderboard.some((e) => e.rank === myEntry.rank);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🏆</div>
        <h1 className="text-3xl font-bold text-[#1A1A2E]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Donor Leaderboard
        </h1>
        <p className="text-slate-500">Celebrating our top blood donors — every donation saves lives</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchLeaderboard(); }}
        className="card flex flex-wrap gap-3 items-end p-4">
        <div className="flex-1 min-w-[150px]">
          <label className="input-label text-xs">City</label>
          <input type="text" placeholder="e.g. Hyderabad" value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="input-field text-sm py-2" />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="input-label text-xs">Blood Group</label>
          <select value={filters.bloodGroup} onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
            className="input-field text-sm py-2">
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary text-sm py-2 px-5 h-[42px]">Filter</button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="card h-20 skeleton" />)}
        </div>
      ) : error ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="font-bold text-[#1A1A2E] mb-2">Couldn't Load the Leaderboard</h3>
          <p className="text-slate-400 text-sm mb-5">{error}</p>
          <button onClick={fetchLeaderboard} className="btn-secondary text-sm py-2 px-5">
            Retry
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🩸</div>
          <h3 className="font-bold text-[#1A1A2E] mb-2">No Donors Yet</h3>
          <p className="text-slate-400 text-sm">No donors yet. Be the first to donate!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {leaderboard.map((entry) => (
            <LeaderboardRow key={entry.rank} entry={entry} isMe={user?.role === 'donor' && myEntry?.rank === entry.rank} />
          ))}
        </div>
      )}

      {myEntry && !myRankInTop10 && (
        <div>
          <p className="text-xs text-slate-400 mb-2 text-center">···</p>
          <LeaderboardRow entry={myEntry} isMe />
        </div>
      )}

      {!user && (
        <div className="card text-center py-8 space-y-3" style={{ borderLeft: '4px solid #C0162C' }}>
          <p className="font-bold text-[#1A1A2E]">Want to see your name here?</p>
          <p className="text-sm text-slate-500">Register as a donor and start saving lives today.</p>
          <Link to="/register?role=donor" className="btn-primary inline-flex">Join as Donor →</Link>
        </div>
      )}
    </div>
  );
}
