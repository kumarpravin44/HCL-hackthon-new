import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ApplicationForm from './pages/ApplicationForm/ApplicationForm';
import StatusTracker from './pages/StatusTracker/StatusTracker';
import MyApplications from './pages/MyApplications/MyApplications';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (user) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/apply" element={
            <ProtectedRoute roles={['applicant']}><ApplicationForm /></ProtectedRoute>
          } />
          <Route path="/my-applications" element={
            <ProtectedRoute roles={['applicant']}><MyApplications /></ProtectedRoute>
          } />
          <Route path="/track" element={<StatusTracker />} />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin', 'approver']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/" element={
            user ? (
              ['admin', 'approver'].includes(user.role)
                ? <Navigate to="/admin" />
                : <Navigate to="/my-applications" />
            ) : <Navigate to="/login" />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <ToastContainer position="top-right" autoClose={4000} />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
