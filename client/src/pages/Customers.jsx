import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [history, setHistory] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { api.get('/customers').then(r => setCustomers(r.data)); }, []);

  async function viewHistory(c) {
    setSelected(c);
    const { data } = await api.get(`/customers/${c._id}/history`);
    setHistory(data);
  }

  return (
    <div className="bg-white rounded-2xl p-5 border">
      <h2 className="font-bold text-lg text-leafdark mb-4">Customers</h2>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-500 border-b-2 border-black"><th className="py-2">Name</th><th>Phone</th><th>Orders</th><th>Total Spent</th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id} className="border-b cursor-pointer hover:bg-ivory" onClick={() => viewHistory(c)}>
                <td className="py-2">{c.name || '-'}</td>
                <td>{c.phone}</td>
                <td>{c.totalOrders}</td>
                <td>₹{c.totalSpent?.toFixed(2)}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan="4" className="text-center text-gray-400 py-8">No customers yet — phone numbers are captured at billing time.</td></tr>}
          </tbody>
        </table>

        {selected && (
          <div className="border rounded-xl p-4 bg-ivory">
            <div className="font-semibold mb-2">{selected.name || selected.phone}'s Visit History</div>
            {history === null && <div className="text-xs text-gray-400">Loading...</div>}
            {history && history.length === 0 && <div className="text-xs text-gray-400">No visits yet.</div>}
            {history && history.map(o => (
              <div key={o._id} className="text-xs border-b py-2 flex justify-between">
                <span>Bill #{o.billNo} · {new Date(o.createdAt).toLocaleDateString()}</span>
                <span className="font-semibold">₹{o.grandTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
