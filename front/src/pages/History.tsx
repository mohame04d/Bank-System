import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { ArrowDownRight, ArrowUpRight, Search, Filter, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../utils/format';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const { t } = useTranslation();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/history');
      return data;
    },
  });

  // Sync state with URL
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ q: searchQuery });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const lowerQuery = searchQuery.toLowerCase();
    return transactions.filter((tx: any) => 
      tx.description?.toLowerCase().includes(lowerQuery) ||
      tx.type?.toLowerCase().includes(lowerQuery) ||
      tx.amount?.toString().includes(lowerQuery)
    );
  }, [transactions, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('history.title')}</h1>
          <p className="text-slate-400">{t('history.subtitle')}</p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={async () => {
            try {
              const res = await api.get('/transactions/export');
              const blob = new Blob([res.data], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'transactions_export.csv';
              a.click();
              window.URL.revokeObjectURL(url);
              toast.success('Export started!');
            } catch (e) {
              toast.error('Export failed');
            }
          }}
        >
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('header.search')}
              className="h-10 w-full rounded-lg bg-slate-800/50 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-slate-700 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-sm rtl:text-right">
                <th className="p-4 font-medium">{t('history.description')}</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">{t('history.date')}</th>
                <th className="p-4 font-medium">{t('history.status')}</th>
                <th className="p-4 font-medium rtl:text-left ltr:text-right">{t('history.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">{t('history.loading')}</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">{t('history.noTransactions')}</td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => {
                  const isLegacyOutgoing = tx.type === 'TRANSFER' && tx.amount > 0 && tx.description?.startsWith('Transfer to');
                  const isIncoming = tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER' && tx.amount > 0 && !isLegacyOutgoing);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isIncoming ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {isIncoming ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <span className="font-medium text-slate-200">{tx.description || tx.type}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">{tx.type}</td>
                      <td className="p-4 text-slate-400 text-sm">{formatDate(tx.createdAt)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {t(`dashboard.${tx.status.toLowerCase()}`, { defaultValue: tx.status })}
                        </span>
                      </td>
                      <td className={`p-4 rtl:text-left ltr:text-right font-semibold ${
                        isIncoming ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {isIncoming ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), tx.account?.currency || 'USD')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
