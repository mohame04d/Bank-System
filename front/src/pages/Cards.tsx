import React, { useState } from 'react';
import { Card as UICard } from '../components/ui/Card';
import { CreditCard, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

export function Cards() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCvv, setShowCvv] = useState<Record<string, boolean>>({});

  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const res = await api.get('/cards');
      return res.data;
    }
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/accounts');
      return res.data;
    }
  });

  const createCardMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await api.post('/cards', { accountId });
    },
    onSuccess: () => {
      toast.success(t('cards.successCreate'));
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || 'Failed to create card');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await api.put(`/cards/${cardId}/toggle`);
    },
    onSuccess: () => {
      toast.success(t('cards.successStatus'));
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    }
  });

  if (cardsLoading || accountsLoading) return <div className="text-white">{t('common.loading')}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('cards.title')}</h1>
          <p className="text-slate-400">{t('cards.subtitle')}</p>
        </div>
        <Button 
          onClick={() => {
            if (!accounts || accounts.length === 0) return toast.error('No accounts found');
            createCardMutation.mutate(accounts[0].id);
          }}
          isLoading={createCardMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-2" /> {t('cards.newVirtualCard')}
        </Button>
      </div>

      {(!cards || cards.length === 0) ? (
        <UICard className="p-12 flex flex-col items-center justify-center text-center">
          <CreditCard className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-slate-200">{t('cards.noCardsFound')}</h2>
          <p className="text-slate-400 mt-2 mb-6 max-w-md">{t('cards.noCardsDesc')}</p>
        </UICard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card: any) => (
            <UICard key={card.id} className="p-6 relative overflow-hidden group">
              {card.status === 'FROZEN' && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                  <ShieldAlert className="w-12 h-12 text-rose-500 mb-2" />
                  <p className="text-white font-medium mb-4">{t('cards.cardIsFrozen')}</p>
                  <Button variant="outline" size="sm" onClick={() => toggleStatusMutation.mutate(card.id)}>
                    {t('cards.unfreezeCard')}
                  </Button>
                </div>
              )}
              
              <div className="w-full h-48 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 relative border border-slate-700/50 shadow-xl overflow-hidden mb-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-8 rounded bg-slate-200/20 backdrop-blur-sm"></div>
                    <span className="text-slate-300 font-medium">{t('cards.virtual')}</span>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-mono text-white tracking-widest mb-2">
                      {card.cardNumber.match(/.{1,4}/g)?.join(' ')}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('cards.cardHolder')}</p>
                        <p className="text-sm font-medium text-slate-200 uppercase">{t('cards.valuedCustomer')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('cards.expires')}</p>
                        <p className="text-sm font-medium text-slate-200">{card.expiry}</p>
                      </div>
                      <div className="text-right cursor-pointer" onClick={() => setShowCvv(prev => ({...prev, [card.id]: !prev[card.id]}))}>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('cards.cvv')}</p>
                        <p className="text-sm font-medium text-slate-200">{showCvv[card.id] ? card.cvv : '***'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-700/50 pt-4">
                <div>
                  <p className="text-xs text-slate-400">{t('cards.dailyLimit')}</p>
                  <p className="text-sm font-medium text-slate-200">${card.dailyLimit}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10" onClick={() => toggleStatusMutation.mutate(card.id)}>
                    {t('cards.freezeCard')}
                  </Button>
                </div>
              </div>
            </UICard>
          ))}
        </div>
      )}
    </div>
  );
}
