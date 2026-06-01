import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, CreditCard, History, Settings, LogOut, Wallet, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const { t } = useTranslation();

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
    { name: t('nav.dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: t('nav.accounts'), path: '/accounts', icon: <CreditCard size={20} /> },
    { name: t('nav.transfer'), path: '/transfer', icon: <ArrowRightLeft size={20} /> },
    { name: t('nav.deposit'), path: '/deposit', icon: <Wallet size={20} /> },
    { name: t('nav.history'), path: '/history', icon: <History size={20} /> },
    { name: t('nav.profile'), path: '/profile', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={onClose}
        />
      )}
      <aside className={`w-64 bg-surface border-slate-700/50 flex flex-col h-screen fixed md:sticky top-0 z-50 transition-transform duration-300 rtl:border-l ltr:border-r ${
        isOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full md:translate-x-0 rtl:md:translate-x-0'
      }`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50 justify-between">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            Z
          </div>
          {t('nav.ziad')}
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
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
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-purple-500/20 text-purple-400 font-medium'
                  : 'text-purple-500/60 hover:text-purple-400 hover:bg-purple-500/10'
                }`
              }
            >
              <ShieldCheck size={20} />
              {t('nav.admin')}
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
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
    </>
  );
}
