import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, CreditCard, History, Settings, LogOut, Wallet, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);

  const getRole = () => {
    if (!token) return 'CUSTOMER';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (e) {
      return 'CUSTOMER';
    }
  };

  const isAdmin = getRole() === 'ADMIN';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Accounts', path: '/accounts', icon: <CreditCard size={20} /> },
    { name: 'Transfer', path: '/transfer', icon: <ArrowRightLeft size={20} /> },
    { name: 'Deposit', path: '/deposit', icon: <Wallet size={20} /> },
    { name: 'History', path: '/history', icon: <History size={20} /> },
    { name: 'Profile', path: '/profile', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-slate-700/50 flex flex-col h-screen sticky top-0 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            N
          </div>
          NeonBank
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
        
        {isAdmin && (
          <>
            <div className="my-4 border-t border-slate-700/50" />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-400 font-medium'
                    : 'text-purple-500/60 hover:text-purple-400 hover:bg-purple-500/10'
                }`
              }
            >
              <ShieldCheck size={20} />
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
