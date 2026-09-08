import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Signup() {
  const [form, setForm] = useState({
    restaurantName: '',
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (
      !form.restaurantName ||
      !form.name ||
      !form.username ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('Please fill all fields');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/signup', {
        restaurantName: form.restaurantName,
        name: form.name,
        username: form.username,
        password: form.password,
      });

      setSuccess('Restaurant account created successfully!');

      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-leafdark mb-1">
          Create Your Restaurant
        </h1>

        <p className="text-xs text-gray-500 mb-6">
          Create your restaurant and admin account
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">
          Restaurant Name
        </label>

        <input
          name="restaurantName"
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          placeholder="Enter restaurant name"
          value={form.restaurantName}
          onChange={handleChange}
        />

        <label className="block text-sm font-medium mb-1">
          Admin Name
        </label>

        <input
          name="name"
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          placeholder="Enter your name"
          value={form.name}
          onChange={handleChange}
        />

        <label className="block text-sm font-medium mb-1">
          Admin ID / Username
        </label>

        <input
          name="username"
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          placeholder="Create admin ID"
          value={form.username}
          onChange={handleChange}
        />

        <label className="block text-sm font-medium mb-1">
          Password
        </label>

        <input
          type="password"
          name="password"
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
          placeholder="Minimum 8 characters"
          value={form.password}
          onChange={handleChange}
        />

        <label className="block text-sm font-medium mb-1">
          Confirm Password
        </label>

        <input
          type="password"
          name="confirmPassword"
          className="w-full border rounded-lg px-3 py-2 mb-5 text-sm"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-leaf text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-60"
        >
          {loading ? 'Creating Account...' : 'Create Restaurant Account'}
        </button>

        <div className="text-center mt-5 text-sm text-gray-500">
          Already have an account?
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="ml-1 text-leafdark font-semibold hover:underline"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}