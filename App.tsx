/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ExamList from './components/ExamList';
import TakeExam from './components/TakeExam';
import ExamResults from './components/ExamResults';
import Reinforcement from './components/Reinforcement';
import AdminPanel from './components/AdminPanel';
import CreateExam from './components/CreateExam';
import Navbar from './components/Navbar';

export default function App() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData: any, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="min-h-screen">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Student Auth Routes */}
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register onRegister={handleLogin} /> : <Navigate to="/dashboard" />} />
            
            {/* Teacher Auth Routes (Hidden from students) */}
            <Route path="/teacher-login" element={!user ? <Login onLogin={handleLogin} isAdminRoute={true} /> : <Navigate to="/dashboard" />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/exams/:id/take" element={user ? <TakeExam user={user} /> : <Navigate to="/login" />} />
            <Route path="/results/:id" element={user ? <ExamResults user={user} /> : <Navigate to="/login" />} />
            <Route path="/reinforcement/:examId" element={user ? <Reinforcement user={user} /> : <Navigate to="/login" />} />
            
            {/* Admin Routes */}
            <Route path="/exams" element={user?.role === 'admin' ? <ExamList user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />} />
            <Route path="/admin/exams/create" element={user?.role === 'admin' ? <CreateExam /> : <Navigate to="/dashboard" />} />
            
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

