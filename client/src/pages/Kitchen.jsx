import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const statusColor = { preparing: 'bg-amber-100 text-amber-800', ready: 'bg-green-100 text-green-800' };
const nextStatus = { preparing: 'ready', ready: 'served' };
const nextLabel = { preparing: 'Mark Ready', ready: 'Mark Served' };

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  function load() { api.get('/kitchen').then(r => setOrders(r.data)); }
  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // auto-refresh so kitchen screen stays live
    return () => clearInterval(t);
  }, []);

  async function advance(order) {
    await api.put(`/kitchen/${order._id}/status`, { kitchenStatus: nextStatus[order.kitchenStatus] });
    load();
  }

  return (
    <div className="bg-white rounded-2xl p-5 border">
      <h2 className="font-bold text-lg text-leafdark mb-4">Kitchen Order Tickets (KOT)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {orders.length === 0 && <div className="text-gray-400 text-sm col-span-full">No active orders in the kitchen.</div>}
        {orders.map(o => (
          <div key={o._id} className="border rounded-xl p-4 bg-ivory">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-sm">Bill #{o.billNo} · {o.table?.label || o.orderType}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[o.kitchenStatus] || ''}`}>{o.kitchenStatus}</span>
            </div>
            <div className="space-y-1 mb-3">
              {o.items.map((i, idx) => (
                <div key={idx} className="text-sm flex justify-between"><span>{i.name}</span><span className="font-semibold">x{i.qty}</span></div>
              ))}
            </div>
            {o.kitchenStatus !== 'served' && (
              <button onClick={() => advance(o)} className="w-full bg-leaf text-white py-1.5 rounded-lg text-xs font-semibold">
                {nextLabel[o.kitchenStatus]}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
