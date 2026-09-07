import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'cashier' });

  function load() { api.get('/auth/staff').then(r => setStaff(r.data)); }
  useEffect(load, []);

  async function addStaff() {
    if (!form.name || !form.username || !form.password) return alert('Fill all fields');
    await api.post('/auth/staff', form);
    setForm({ name: '', username: '', password: '', role: 'cashier' });
    load();
  }
  async function removeStaff(id) {
    if (!confirm('Deactivate this staff member?')) return;
    await api.delete(`/auth/staff/${id}`);
    load();
  }

  return (
    <div className="bg-white rounded-2xl p-5 border">
      <h2 className="font-bold text-lg text-leafdark mb-4">Staff Management</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={addStaff} className="bg-leaf text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Add Staff</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-gray-500 border-b-2 border-black"><th className="py-2">Name</th><th>Username</th><th>Role</th><th></th></tr></thead>
        <tbody>
          {staff.map(s => (
            <tr key={s._id} className="border-b">
              <td className="py-2">{s.name}</td><td>{s.username}</td>
              <td><span className="bg-goldsoft text-leafdark text-xs px-2 py-0.5 rounded-full">{s.role}</span></td>
              <td><button onClick={() => removeStaff(s._id)} className="text-red-600 text-xs font-semibold">Deactivate</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-3">Cashier: billing only · Manager: billing + reports + menu · Admin: everything + staff + settings + audit log.</p>
    </div>
  );
}
