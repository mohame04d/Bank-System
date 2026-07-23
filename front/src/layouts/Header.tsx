import React from 'react';
import { Bell, Search, Menu, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((state) => state.user);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  const [showNotifications, setShowNotifications] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
    enabled: !!user,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Close dropdown when clicking outside
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors rounded-full hover:bg-slate-800/50"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-background text-[8px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute end-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-100">{t('header.notifications')}</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('header.markAllAsRead')}
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    {t('header.noNotifications')}
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${!notif.isRead ? 'bg-slate-800/20' : ''}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-sm ${!notif.isRead ? 'font-semibold text-slate-200' : 'text-slate-300'}`}>
                          {t(`notifications.${notif.title.replace(/\s+/g, '')}`, notif.title) as any}
                        </h4>
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                         {t(`notifications.${notif.title.replace(/\s+/g, '')}Message`, notif.message, { amount: notif.message.match(/\$(\d+(\.\d+)?)/)?.[1] || '', from: notif.message.split('from ')[1] || '' }) as any}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2">
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
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
