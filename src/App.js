import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WelcomeDashboard from './pages/WelcomeDashboard';  // Welcome Dashboard (Landing Page)
import AdminLogin from './pages/AdminLogin';  // Admin login page
import StudentLogin from './pages/StudentLogin';  // Student login page
import Signup from './pages/Signup';  // Student sign-up page
import AdminDashboard from './pages/AdminDashboard';  // Admin Dashboard page
import StudentDashboard from './pages/StudentDashboard';  // Student Dashboard page

function App() {
  return (
    <Router>
      <Routes>
        {/* Welcome Dashboard as the landing page */}
        <Route path="/" element={<WelcomeDashboard />} />
        
        {/* Admin Login page */}
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Student Login page */}
        <Route path="/student-login" element={<StudentLogin />} />
        
        {/* Student Sign-up page */}
        <Route path="/signup" element={<Signup />} />
        
        {/* Admin Dashboard page */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
        {/* Student Dashboard page */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
