import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Billing from './pages/Billing';
import Menu from './pages/Menu';
import Tables from './pages/Tables';
import Reports from './pages/Reports';
import Staff from './pages/Staff';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import Kitchen from './pages/Kitchen';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';

export default function App() {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute roles={['admin','manager']}><Menu /></ProtectedRoute>} />
        <Route path="/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['admin','manager']}><Reports /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute roles={['admin']}><Staff /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute roles={['admin','manager']}><Dashboard /></ProtectedRoute>} />
        <Route path="/kitchen" element={<ProtectedRoute><Kitchen /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute roles={['admin','manager']}><Inventory /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute roles={['admin','manager']}><Customers /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
