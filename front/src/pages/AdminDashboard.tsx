import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Users, Activity, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';

export function AdminDashboard() {
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/users/admin/all');
      return data;
    }
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions/admin/all');
      return data;
    }
  });

  const totalMoney = users.reduce((acc: number, user: any) => {
    const userTotal = user.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
    return acc + userTotal;
  }, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-400">System overview and user management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-100">{users.length}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total System Funds</p>
              <h3 className="text-2xl font-bold text-slate-100">{formatCurrency(totalMoney)}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Transactions</p>
              <h3 className="text-2xl font-bold text-slate-100">{transactions.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">All Users</h3>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 rounded-tr-lg">Total Balance</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => {
                  const balance = user.accounts.reduce((s: number, a: any) => s + a.balance, 0);
                  return (
                    <tr key={user.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{user.firstName} {user.lastName}</div>
                        <div className="text-xs">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-300'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {formatCurrency(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Global Transactions</h3>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Type</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 rounded-tr-lg">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 15).map((tx: any) => (
                  <tr key={tx.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="capitalize text-slate-200">{tx.type.toLowerCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {tx.account?.user?.email || 'System'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
