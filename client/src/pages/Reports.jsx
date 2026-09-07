import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  function load() {
    api.get('/reports/summary', { params: { from, to } }).then(r => setSummary(r.data));
  }
  useEffect(load, []);

  function exportCSV() {
    if (!summary) return;
    let csv = 'Item,Qty,Amount\n';
    summary.itemWise.forEach(i => { csv += `${i.name},${i.qty},${i.amount.toFixed(2)}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales_report.csv'; a.click();
  }

  return (
    <div className="bg-white rounded-2xl p-5 border">
      <h2 className="font-bold text-lg text-leafdark mb-4">Sales Reports</h2>
      <div className="flex gap-2 mb-4 items-end">
        <div><label className="text-xs text-gray-500 block mb-1">From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 block mb-1">To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></div>
        <button onClick={load} className="bg-leaf text-white px-4 py-2 rounded-lg text-sm font-semibold">Apply</button>
        <button onClick={exportCSV} className="border border-leaf text-leaf px-4 py-2 rounded-lg text-sm font-semibold">Export CSV</button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-ivory rounded-xl p-4"><div className="text-xs text-gray-500">Total Sales</div><div className="text-xl font-bold text-leafdark">₹{summary.totalSales.toFixed(2)}</div></div>
            <div className="bg-ivory rounded-xl p-4"><div className="text-xs text-gray-500">Total Orders</div><div className="text-xl font-bold text-leafdark">{summary.totalOrders}</div></div>
            <div className="bg-ivory rounded-xl p-4"><div className="text-xs text-gray-500">Avg Bill</div><div className="text-xl font-bold text-leafdark">₹{summary.avgBill.toFixed(2)}</div></div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={summary.itemWise.slice(0, 10)}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="amount" fill="#2F5233" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
