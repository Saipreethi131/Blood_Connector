import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP.jsx'));
const DonorDashboard = lazy(() => import('./pages/donor/DonorDashboard.jsx'));
const HospitalDashboard = lazy(() => import('./pages/hospital/HospitalDashboard.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const PublicRequestPage = lazy(() => import('./pages/PublicRequestPage.jsx'));
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
const Stories = lazy(() => import('./pages/Stories.jsx'));
const Blogs = lazy(() => import('./pages/Blogs.jsx'));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[#FFF5F5] border-t-[#C0162C] animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/request/:id" element={<PublicRequestPage />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/blogs" element={<Blogs />} />

          <Route path="/donor/dashboard" element={<ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>} />
          <Route path="/hospital/dashboard" element={<ProtectedRoute role="hospital"><HospitalDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
