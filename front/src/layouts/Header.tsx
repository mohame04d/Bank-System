import React from 'react';
import { Bell, Search, Menu, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((state) => state.user);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="h-16 border-b border-slate-700/50 bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden text-slate-400 hover:text-slate-100">
          <Menu size={24} />
        </button>
        
        <form 
          className="relative hidden sm:block"
          onSubmit={(e) => {
            e.preventDefault();
            const query = (e.target as HTMLFormElement).search.value;
            if (query.trim()) {
              window.location.href = `/history?q=${encodeURIComponent(query)}`;
            }
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            name="search"
            placeholder={t('header.search')}
            className="h-10 w-64 rounded-full bg-slate-800/50 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-slate-700 focus:border-transparent"
          />
        </form>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-primary transition-colors"
        >
          <Globe size={18} />
          <span className="text-sm font-medium">{i18n.language === 'ar' ? 'EN' : 'ع'}</span>
        </button>

        <button className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors rounded-full hover:bg-slate-800/50">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background"></span>
        </button>
        
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
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
          </Link>
      </div>
    </header>
  );
}
