import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Users, Activity, DollarSign, Shield, ShieldOff, Trash2, Lock, Unlock, MoreVertical } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

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

  const queryClient = useQueryClient();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/admin/${id}`),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete user')
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string, role: string }) => api.put(`/users/admin/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('User role updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update role')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => api.put(`/users/admin/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update status')
  });

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
                  <th className="px-4 py-3">Role & Status</th>
                  <th className="px-4 py-3">Total Balance</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
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
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-300'}`}>
                            {user.role}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${user.status === 'FROZEN' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {formatCurrency(balance)}
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                          className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeMenu === user.id && (
                          <div className="absolute right-8 top-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-1 z-10 w-48 text-left">
                            <button
                              onClick={() => {
                                updateRoleMutation.mutate({ id: user.id, role: user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN' });
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded flex items-center gap-2"
                            >
                              {user.role === 'ADMIN' ? <ShieldOff size={14} /> : <Shield size={14} />}
                              {user.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => {
                                updateStatusMutation.mutate({ id: user.id, status: user.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE' });
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded flex items-center gap-2"
                            >
                              {user.status === 'ACTIVE' ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} className="text-emerald-400" />}
                              {user.status === 'ACTIVE' ? 'Freeze Account' : 'Unfreeze Account'}
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to permanently delete this user?')) {
                                  deleteUserMutation.mutate(user.id);
                                }
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-slate-700 rounded flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete User
                            </button>
                          </div>
                        )}
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
