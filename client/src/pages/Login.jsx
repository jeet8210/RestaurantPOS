import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-80">
        <h1 className="text-xl font-bold text-leafdark mb-1">RestaurantPOS</h1>
        <p className="text-xs text-gray-500 mb-5">Sign in to continue</p>
        {error && <div className="text-red-600 text-xs mb-3">{error}</div>}
        <input className="w-full border rounded-lg px-3 py-2 mb-3 text-sm" placeholder="Username"
          value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" className="w-full border rounded-lg px-3 py-2 mb-4 text-sm" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-leaf text-white py-2.5 rounded-lg font-semibold text-sm">Login</button>
      </form>
    </div>
  );
}
