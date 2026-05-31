import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils/format';
import { Landmark, Plus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export function Accounts() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await api.get('/accounts');
      return data;
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (type: string) => {
      const { data } = await api.post('/accounts', { type });
      return data;
    },
    onSuccess: () => {
      toast.success('Account created successfully!');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create account');
      setIsCreating(false);
    },
  });

  const handleCreateAccount = () => {
    setIsCreating(true);
    createAccountMutation.mutate('SAVINGS'); // Only savings can be created manually for MVP
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">My Accounts</h1>
          <p className="text-slate-400">Manage your checking and savings accounts</p>
        </div>
        <button
          onClick={handleCreateAccount}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          {isCreating ? 'Creating...' : 'Open Savings Account'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No accounts found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account: any) => (
            <Card key={account.id} className="p-6 relative overflow-hidden group hover:border-slate-600 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-primary">
                    {account.type === 'CHECKING' ? (
                      <Landmark className="w-6 h-6" />
                    ) : (
                      <CreditCard className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 capitalize">
                      {account.type.toLowerCase()} Account
                    </h3>
                    <p className="text-sm text-slate-400 font-mono">
                      **** {account.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                  Active
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Available Balance</p>
                <div className="text-3xl font-bold text-slate-100">
                  {formatCurrency(account.balance)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
