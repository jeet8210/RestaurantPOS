import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChefHat, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  if (!user) return null;

  const tabs = [
    { to: '/dashboard', label: 'Dashboard', roles: ['admin', 'manager'] },
    { to: '/', label: 'Billing', roles: ['admin', 'manager', 'cashier'] },
    { to: '/kitchen', label: 'Kitchen', roles: ['admin', 'manager', 'cashier'] },
    { to: '/menu', label: 'Menu', roles: ['admin', 'manager'] },
    { to: '/tables', label: 'Tables', roles: ['admin', 'manager', 'cashier'] },
    { to: '/inventory', label: 'Inventory', roles: ['admin', 'manager'] },
    { to: '/customers', label: 'Customers', roles: ['admin', 'manager'] },
    { to: '/reports', label: 'Reports', roles: ['admin', 'manager'] },
    { to: '/staff', label: 'Staff', roles: ['admin'] },
    { to: '/settings', label: 'Settings', roles: ['admin'] },
  ].filter(t => t.roles.includes(user.role));

  return (
    <div className="flex items-center justify-between bg-leaf text-ivory px-6 py-3 rounded-2xl mb-4 shadow">
      <div className="flex items-center gap-2 font-bold text-lg">
        <ChefHat size={22} /> RestaurantPOS
      </div>
      <div className="flex gap-1 bg-black/15 p-1 rounded-xl">
        {tabs.map(t => (
          <Link key={t.to} to={t.to}
            className={`px-3 py-2 rounded-lg text-sm font-semibold ${loc.pathname === t.to ? 'bg-goldsoft text-leafdark' : 'opacity-80 hover:opacity-100'}`}>
            {t.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span>{user.name} · {user.role}</span>
        <button onClick={logout} className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <LogOut size={14}/> Logout
        </button>
      </div>
    </div>
  );
}
