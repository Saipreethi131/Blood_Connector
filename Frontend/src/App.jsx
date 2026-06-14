import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyOTP from './pages/VerifyOTP.jsx';
import DonorDashboard from './pages/donor/DonorDashboard.jsx';
import HospitalDashboard from './pages/hospital/HospitalDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import PublicRequestPage from './pages/PublicRequestPage.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/request/:id" element={<PublicRequestPage />} />

        <Route path="/donor/dashboard" element={<ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>} />
        <Route path="/hospital/dashboard" element={<ProtectedRoute role="hospital"><HospitalDashboard /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
