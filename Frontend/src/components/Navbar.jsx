import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const dashboardPath =
    user?.role === 'donor'
      ? '/donor/dashboard'
      : user?.role === 'hospital'
      ? '/hospital/dashboard'
      : '/admin/dashboard';

  return (
    <nav className="bg-white shadow-sm border-b border-red-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🩸</span>
            <span className="font-bold text-red-600 text-xl">Blood Connector</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to={dashboardPath} className="text-gray-600 hover:text-red-600 font-medium transition-colors">
                  Dashboard
                </Link>
                {user?.role !== 'admin' && (
                  <Link
                    to="/notifications"
                    className="relative text-gray-600 hover:text-red-600 transition-colors"
                    title="Notifications"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  {user.name} <span className="text-red-500 capitalize">({user.role})</span>
                </span>
                <button onClick={handleLogout} className="btn-secondary text-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-red-600 font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-red-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 space-y-2">
          {user ? (
            <>
              <Link to={dashboardPath} onClick={() => setMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-red-600 font-medium">
                Dashboard
              </Link>
              {user?.role !== 'admin' && (
                <Link to="/notifications" onClick={() => setMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-red-600 font-medium">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </Link>
              )}
              <button onClick={handleLogout} className="btn-secondary w-full mt-2">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-red-600 font-medium">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="block btn-primary text-center mt-2">
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
