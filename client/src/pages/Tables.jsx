import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [label, setLabel] = useState('');

  function load() { api.get('/tables').then(r => setTables(r.data)); }
  useEffect(load, []);

  async function addTable() {
    if (!label) return;
    await api.post('/tables', { label });
    setLabel('');
    load();
  }
  async function toggleStatus(t) {
    await api.put(`/tables/${t._id}/status`, { status: t.status === 'free' ? 'occupied' : 'free' });
    load();
  }
  async function removeTable(id) {
    if (!confirm('Delete table?')) return;
    await api.delete(`/tables/${id}`);
    load();
  }

  return (
    <div className="bg-white rounded-2xl p-5 border">
      <h2 className="font-bold text-lg text-leafdark mb-4">Table Management</h2>
      <div className="flex gap-2 mb-5">
        <input placeholder="e.g. Table 5" value={label} onChange={e => setLabel(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <button onClick={addTable} className="bg-leaf text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Add Table</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {tables.map(t => (
          <div key={t._id} className={`rounded-xl p-4 text-center border cursor-pointer ${t.status === 'free' ? 'bg-ivory' : 'bg-rust/10 border-rust'}`}
            onClick={() => toggleStatus(t)}>
            <div className="font-bold">{t.label}</div>
            <div className={`text-xs mt-1 ${t.status === 'free' ? 'text-leaf' : 'text-red-700'}`}>{t.status}</div>
            <button onClick={(e) => { e.stopPropagation(); removeTable(t._id); }} className="text-[10px] text-red-500 mt-1">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
