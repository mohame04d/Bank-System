import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 border-b border-slate-700/50 bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-400 hover:text-slate-100">
          <Menu size={24} />
        </button>
        
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-64 rounded-full bg-slate-800/50 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-slate-700 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors rounded-full hover:bg-slate-800/50">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background"></span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-200">{user?.name || 'Guest User'}</p>
            <p className="text-xs text-slate-500">Free Plan</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-slate-300">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
