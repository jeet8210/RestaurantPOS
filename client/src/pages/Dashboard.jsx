import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/reports/dashboard').then(r => setData(r.data)); }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-2xl p-5 border">
      <h2 className="font-bold text-lg text-leafdark mb-4">Today's Dashboard</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-ivory rounded-xl p-4">
          <div className="text-xs text-gray-500">Today's Sales</div>
          <div className="text-xl font-bold text-leafdark">₹{data.todaySales.toFixed(2)}</div>
        </div>
        <div className="bg-ivory rounded-xl p-4">
          <div className="text-xs text-gray-500">Total Orders</div>
          <div className="text-xl font-bold text-leafdark">{data.totalOrders}</div>
        </div>
        <div className="bg-ivory rounded-xl p-4">
          <div className="text-xs text-gray-500">Total Revenue</div>
          <div className="text-xl font-bold text-leafdark">₹{data.todaySales.toFixed(2)}</div>
        </div>
      </div>
      <h3 className="font-semibold text-sm text-gray-600 mb-2">Popular Items Today</h3>
      <div className="space-y-2">
        {data.popularItems.length === 0 && <div className="text-gray-400 text-sm">No sales yet today.</div>}
        {data.popularItems.map((i, idx) => (
          <div key={idx} className="flex justify-between border-b py-2 text-sm">
            <span>{idx + 1}. {i.name}</span><span className="font-semibold">{i.qty} sold</span>
          </div>
        ))}
      </div>
    </div>
  );
}
