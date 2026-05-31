import React from 'react';
import { Card } from '../components/ui/Card';
import { ArrowDownRight, ArrowUpRight, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function History() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/history');
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transaction History</h1>
          <p className="text-slate-400">View and manage your recent activity.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
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
              <tr className="bg-slate-800/30 text-slate-400 text-sm">
                <th className="p-4 font-medium">Transaction</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Loading transactions...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No transactions found.</td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'DEPOSIT' || tx.amount > 0 && tx.type !== 'TRANSFER' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {tx.type === 'DEPOSIT' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
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
                        {tx.status}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-semibold ${
                      tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
