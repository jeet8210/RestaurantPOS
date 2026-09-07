import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', unit: 'kg', quantity: '', lowStockThreshold: 5 });

  function load() { api.get('/inventory').then(r => setItems(r.data)); }
  useEffect(load, []);

  async function addItem() {
    if (!form.name) return alert('Enter item name');
    await api.post('/inventory', form);
    setForm({ name: '', unit: 'kg', quantity: '', lowStockThreshold: 5 });
    load();
  }
  async function updateQty(id, quantity) {
    await api.put(`/inventory/${id}`, { quantity });
    load();
  }
  async function removeItem(id) {
    if (!confirm('Delete this stock item?')) return;
    await api.delete(`/inventory/${id}`);
    load();
  }

  return (
    <div className="bg-white rounded-2xl p-5 border">
      <h2 className="font-bold text-lg text-leafdark mb-4">Inventory / Stock</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        <input placeholder="e.g. Rice, Oil, Batter, Coconut" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
        <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
          <option value="kg">kg</option><option value="litre">litre</option><option value="pcs">pcs</option>
        </select>
        <input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-28" />
        <input placeholder="Low stock alert at" type="number" value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-36" />
        <button onClick={addItem} className="bg-leaf text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Add Stock Item</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-gray-500 border-b-2 border-black"><th className="py-2">Item</th><th>Quantity</th><th>Unit</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {items.map(i => {
            const low = i.quantity <= i.lowStockThreshold;
            return (
              <tr key={i._id} className="border-b">
                <td className="py-2">{i.name}</td>
                <td>
                  <input defaultValue={i.quantity} type="number" onBlur={e => updateQty(i._id, parseFloat(e.target.value))}
                    className="w-20 border rounded px-2 py-1 text-xs" />
                </td>
                <td>{i.unit}</td>
                <td>{low ? <span className="text-red-600 font-semibold text-xs">Low stock</span> : <span className="text-green-700 text-xs">OK</span>}</td>
                <td><button onClick={() => removeItem(i._id)} className="text-red-600 text-xs font-semibold">Delete</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
