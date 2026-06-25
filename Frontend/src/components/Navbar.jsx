import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bellAnim, setBellAnim] = useState(false);

  const dashboardPath =
    user?.role === 'donor' ? '/donor/dashboard'
    : user?.role === 'hospital' ? '/hospital/dashboard'
    : '/admin/dashboard';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      setBellAnim(true);
      const t = setTimeout(() => setBellAnim(false), 800);
      return () => clearTimeout(t);
    }
  }, [unreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkCls = (path) =>
    `relative font-medium text-sm transition-all duration-200 py-1 ${
      isActive(path)
        ? 'text-[#C0162C]'
        : 'text-[#1A1A2E]/70 hover:text-[#C0162C]'
    }`;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 backdrop-blur-lg shadow-md border-b border-slate-100/80'
        : 'bg-white/80 backdrop-blur-md border-b border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 relative">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0" onClick={() => setMenuOpen(false)}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm
              group-hover:scale-105 transition-transform duration-200"
              style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
              <span className="text-lg">🩸</span>
            </div>
            <span className="font-bold text-[#1A1A2E] text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Blood <span className="text-[#C0162C]">Connector</span>
            </span>
          </Link>

          {/* Center nav links (desktop) */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <Link to="/" className={navLinkCls('/')}>Home</Link>
            <Link to="/stories" className={navLinkCls('/stories')}>Stories</Link>
            <Link to="/blogs" className={navLinkCls('/blogs')}>Blogs</Link>
            <Link to="/leaderboard" className={navLinkCls('/leaderboard')}>
              Leaderboard
            </Link>
          </div>

          {/* Right: auth / user actions (desktop) */}
          <div className="hidden md:flex items-center gap-3 min-w-0 flex-shrink-0">
            {user ? (
              <>
                <Link to={dashboardPath} className={navLinkCls(dashboardPath)}>
                  Dashboard
                  {isActive(dashboardPath) && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#C0162C] rounded-full" />
                  )}
                </Link>

                {user?.role !== 'admin' && (
                  <Link to="/notifications"
                    className={`relative flex-shrink-0 p-2 rounded-xl transition-all duration-200 ${
                      isActive('/notifications') ? 'bg-[#FFF5F5] text-[#C0162C]' : 'text-[#1A1A2E]/60 hover:bg-slate-100 hover:text-[#1A1A2E]'
                    }`}
                    title="Notifications">
                    <svg className={`w-5 h-5 ${bellAnim ? 'animate-bell' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold
                        flex items-center justify-center text-white shadow-sm"
                        style={{ background: '#C0162C', animation: 'countUp 0.3s ease-out' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-3 border-l border-slate-200 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="hidden lg:block min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A2E] leading-none truncate max-w-[130px]">{user.name}</p>
                    <p className="text-xs text-[#C0162C] capitalize font-medium">{user.role}</p>
                  </div>
                </div>

                <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4 flex-shrink-0">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 px-5">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-[#1A1A2E]/70 hover:bg-slate-100 hover:text-[#C0162C] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg px-4 py-4 space-y-2"
          style={{ animation: 'slideUp 0.2s ease-out' }}>
          <Link to="/" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-[#C0162C] font-medium transition-colors">
            🏠 Home
          </Link>
          <Link to="/stories" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-[#C0162C] font-medium transition-colors">
            📖 Stories
          </Link>
          <Link to="/blogs" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-[#C0162C] font-medium transition-colors">
            📰 Blogs
          </Link>
          <Link to="/leaderboard" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-[#C0162C] font-medium transition-colors">
            Leaderboard
          </Link>
          {user ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF5F5] mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #C0162C, #8B0000)' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A2E] text-sm">{user.name}</p>
                  <p className="text-xs text-[#C0162C] capitalize">{user.role}</p>
                </div>
              </div>
              <Link to={dashboardPath} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-[#C0162C] font-medium transition-colors">
                📊 Dashboard
              </Link>
              {user?.role !== 'admin' && (
                <Link to="/notifications" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-[#1A1A2E] hover:bg-[#FFF5F5] hover:text-[#C0162C] font-medium transition-colors">
                  🔔 Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-[#C0162C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={handleLogout} className="w-full btn-secondary mt-2 py-2.5">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="btn-secondary w-full py-2.5 justify-center">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="btn-primary w-full py-2.5 justify-center">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
