import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/format';
import { ArrowUpRight, ArrowDownRight, CreditCard, Send, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';

const recentTransactions = [
  { id: '1', name: 'Netflix Subscription', type: 'expense', amount: 15.99, date: 'Today, 2:45 PM', category: 'Entertainment' },
  { id: '2', name: 'Salary Deposit', type: 'income', amount: 4250.00, date: 'Yesterday, 9:00 AM', category: 'Salary' },
  { id: '3', name: 'Coffee Shop', type: 'expense', amount: 4.50, date: 'Yesterday, 8:15 AM', category: 'Food & Dining' },
  { id: '4', name: 'Transfer to Alice', type: 'expense', amount: 150.00, date: 'Oct 12, 4:30 PM', category: 'Transfer' },
];

export function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await api.get('/accounts');
      return data;
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/history');
      return data;
    },
  });

  const mainAccount = accounts?.[0] || { balance: 0 };
  const recentTransactions = history?.slice(0, 4) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400">Welcome back {user?.name}, here's your financial overview.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/deposit">
            <Button variant="outline" className="gap-2">
              <Plus size={16} /> Add Money
            </Button>
          </Link>
          <Link to="/transfer">
            <Button className="gap-2">
              <Send size={16} /> Send
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden p-8 bg-gradient-to-br from-primary to-blue-800 shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-blue-100 font-medium mb-1">Total Balance</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                {accountsLoading ? '...' : formatCurrency(mainAccount.balance)}
              </h2>
            </div>
            
            <div className="flex gap-8 mt-8">
              <div>
                <p className="text-blue-200 text-sm mb-1 flex items-center gap-1">
                  <ArrowDownRight size={16} className="text-emerald-400" /> Income
                </p>
                <p className="text-xl font-semibold text-white">{formatCurrency(4250.00)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm mb-1 flex items-center gap-1">
                  <ArrowUpRight size={16} className="text-rose-400" /> Expense
                </p>
                <p className="text-xl font-semibold text-white">{formatCurrency(1840.25)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Card info */}
        <Card className="flex flex-col justify-between bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <CreditCard size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-400 font-medium">Virtual Card</p>
              <div className="w-12 h-8 bg-slate-700/50 rounded-md flex items-center justify-center">
                <span className="text-xs font-bold italic">VISA</span>
              </div>
            </div>
            <p className="text-2xl tracking-widest font-mono text-slate-200 mb-2">•••• •••• •••• 4242</p>
            <div className="flex justify-between text-sm text-slate-400">
              <span>{user?.name || 'Cardholder'}</span>
              <span>12/28</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center relative z-10">
            <span className="text-sm text-slate-400">Status</span>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium">Active</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-100">Recent Transactions</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          
          <div className="space-y-4">
            {historyLoading ? (
              <p className="text-slate-400 p-3">Loading transactions...</p>
            ) : recentTransactions.length === 0 ? (
              <p className="text-slate-400 p-3">No recent transactions.</p>
            ) : (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'DEPOSIT' || tx.amount > 0 && tx.type !== 'TRANSFER' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {tx.type === 'DEPOSIT' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{tx.description || tx.type}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Send */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Quick Transfer</h3>
          <div className="flex justify-between mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-300">U{i}</span>
                </div>
                <span className="text-xs text-slate-400">User {i}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-4 border-t border-slate-700/50 pt-6">
            <div className="flex items-center bg-slate-800/50 rounded-lg p-2 border border-slate-700">
              <span className="text-slate-400 px-3">$</span>
              <input type="number" placeholder="0.00" className="bg-transparent border-none focus:outline-none text-white w-full font-medium" />
              <Button size="sm" className="ml-2">Send</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
