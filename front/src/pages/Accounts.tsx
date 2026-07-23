import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrency } from '../utils/format';
import { Landmark, Plus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function Accounts() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // States for closing an account
  const [isClosingAccount, setIsClosingAccount] = useState(false);
  const [accountToClose, setAccountToClose] = useState<any>(null);
  const [transferToAccountId, setTransferToAccountId] = useState<string>('');

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    isLocked: false
  });
  const { t } = useTranslation();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await api.get('/accounts');
      return data;
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async ({ type, currency }: { type: string, currency: string }) => {
      const { data } = await api.post('/accounts', { type, currency });
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

  const closeAccountMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/accounts/${accountToClose.id}/close`, {
        transferToAccountId: transferToAccountId || undefined
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Account closed successfully!');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsClosingAccount(false);
      setAccountToClose(null);
      setTransferToAccountId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to close account');
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/savings-goals/account/${selectedAccountId}`, {
        name: goalForm.name,
        targetAmount: Number(goalForm.targetAmount),
        targetDate: goalForm.targetDate || undefined,
        isLocked: goalForm.isLocked
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Savings goal created successfully!');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsCreatingGoal(false);
      setGoalForm({ name: '', targetAmount: '', targetDate: '', isLocked: false });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create goal');
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { data } = await api.delete(`/savings-goals/${goalId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Savings goal deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete goal');
    },
  });

  const [selectedAccountType, setSelectedAccountType] = useState('CHECKING');
  
  // Add Funds States
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundSourceAccountId, setFundSourceAccountId] = useState('');

  const handleCreateAccount = () => {
    setIsCreating(true);
    createAccountMutation.mutate({ type: selectedAccountType, currency: selectedCurrency });
  };

  const addFundsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/savings-goals/${selectedGoalId}/add-funds`, {
        amount: Number(fundAmount),
        sourceAccountId: fundSourceAccountId || undefined
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Funds added successfully!');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsAddingFunds(false);
      setSelectedGoalId(null);
      setFundAmount('');
      setFundSourceAccountId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add funds');
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('accounts.title')}</h1>
          <p className="text-slate-400">{t('accounts.subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedAccountType}
            onChange={(e) => setSelectedAccountType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
          >
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
          </select>
          <select 
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
          >
            <option value="USD">USD</option>
            <option value="EGP">EGP</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          <button
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {isCreating ? 'Opening...' : 'Open Account'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">{t('accounts.loading')}</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No accounts found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account: any) => {
            const lockedInGoals = account.savingsGoals?.reduce((sum: number, g: any) => sum + g.currentAmount, 0) || 0;
            const availableBalance = account.balance - lockedInGoals;

            return (
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
                        {account.type === 'CHECKING' ? t('accounts.checking') : t('accounts.savings')}
                      </h3>
                      <p className="text-sm text-slate-400 font-mono">
                        **** {account.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    {t('accounts.active')}
                  </div>
                </div>

                {account.type === 'SAVINGS' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Total Balance</p>
                        <div className="text-2xl font-bold text-slate-100">
                          {formatCurrency(account.balance, account.currency)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Available</p>
                        <div className="text-xl font-semibold text-emerald-400">
                          {formatCurrency(availableBalance, account.currency)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-slate-400 mb-1">Locked in Goals</p>
                        <div className="text-lg font-medium text-amber-400">
                          {formatCurrency(lockedInGoals, account.currency)}
                        </div>
                      </div>
                    </div>

                    {account.savingsGoals && account.savingsGoals.length > 0 && (
                      <div className="border-t border-slate-700/50 pt-4 mt-4">
                        <p className="text-sm font-medium text-slate-300 mb-3">Savings Goals</p>
                        <div className="space-y-3">
                          {account.savingsGoals.map((goal: any) => {
                            const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                            return (
                              <div key={goal.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-slate-200">{goal.name}</span>
                                  <span className="text-xs text-slate-400">{progress}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                                  <span>{formatCurrency(goal.currentAmount, account.currency)}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="mr-2">Target: {formatCurrency(goal.targetAmount, account.currency)}</span>
                                    {goal.status !== 'COMPLETED' && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            setSelectedGoalId(goal.id);
                                            setIsAddingFunds(true);
                                          }}
                                          className="px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors"
                                        >
                                          Add Funds
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (window.confirm('Are you sure you want to delete this goal? Any locked funds will become available.')) {
                                              deleteGoalMutation.mutate(goal.id);
                                            }
                                          }}
                                          className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {account.type === 'SAVINGS' && (
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setIsCreatingGoal(true);
                        }}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-primary border border-primary/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        + Create Savings Goal
                      </button>
                      <button
                        onClick={() => {
                          setAccountToClose(account);
                          setIsClosingAccount(true);
                        }}
                        className="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{t('accounts.balance')}</p>
                    <div className="text-3xl font-bold text-slate-100">
                      {formatCurrency(account.balance, account.currency)}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Creation Modal */}
      {isCreatingGoal && selectedAccountId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Create Savings Goal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Goal Name</label>
                <input 
                  type="text" 
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({...goalForm, name: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-primary"
                  placeholder="e.g. New Car"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Amount</label>
                <input 
                  type="number" 
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({...goalForm, targetAmount: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-primary"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target Date (Optional)</label>
                <input 
                  type="date" 
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm({...goalForm, targetDate: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-primary"
                />
              </div>
              
              {/* Calculate Monthly Amount if date is provided */}
              {goalForm.targetAmount && goalForm.targetDate && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary">
                  {(() => {
                    const months = Math.max(1, Math.ceil((new Date(goalForm.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
                    const monthly = Number(goalForm.targetAmount) / months;
                    return `You need to save ${formatCurrency(monthly)} per month to reach this goal.`;
                  })()}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="isLocked"
                  checked={goalForm.isLocked}
                  onChange={(e) => setGoalForm({...goalForm, isLocked: e.target.checked})}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-primary"
                />
                <label htmlFor="isLocked" className="text-sm text-slate-300">Lock these savings (prevent withdrawal)</label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  onClick={() => setIsCreatingGoal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => createGoalMutation.mutate()}
                  disabled={createGoalMutation.isPending || !goalForm.name || !goalForm.targetAmount}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Account Modal */}
      {isClosingAccount && accountToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-red-500 mb-4">Close Savings Account</h2>
            
            <p className="text-slate-300 mb-6 text-sm">
              Closing this account will permanently archive all related Savings Goals and stop all automatic transfers. This action cannot be undone.
            </p>

            {accountToClose.balance > 0 ? (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-amber-500 text-sm font-medium mb-1">Action Required</p>
                  <p className="text-amber-500/80 text-xs">
                    This account has a balance of {formatCurrency(accountToClose.balance, accountToClose.currency)}. 
                    You must transfer this balance to another active account before closing.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Transfer Balance To:</label>
                  <select
                    value={transferToAccountId}
                    onChange={(e) => setTransferToAccountId(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-primary"
                  >
                    <option value="">Select an account</option>
                    {accounts.filter((a: any) => a.id !== accountToClose.id && a.currency === accountToClose.currency).map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type} - {acc.accountNumber.slice(-4)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-emerald-400 text-sm mb-6 bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
                This account has a 0 balance and is ready to be closed.
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setIsClosingAccount(false);
                  setAccountToClose(null);
                  setTransferToAccountId('');
                }}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => closeAccountMutation.mutate()}
                disabled={closeAccountMutation.isPending || (accountToClose.balance > 0 && !transferToAccountId)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {closeAccountMutation.isPending ? 'Closing...' : 'Close Account'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Funds Modal */}
      {isAddingFunds && selectedGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Add Funds to Goal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Amount to Add</label>
                <input 
                  type="number" 
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-primary"
                  placeholder="e.g. 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Fund From:</label>
                <select
                  value={fundSourceAccountId}
                  onChange={(e) => setFundSourceAccountId(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-primary"
                >
                  <option value="">Select an account</option>
                  {accounts.map((acc: any) => {
                    const availableBalance = acc.type === 'SAVINGS' 
                      ? acc.balance - (acc.savingsGoals?.filter((g: any) => g.status !== 'CANCELLED' && g.status !== 'ARCHIVED').reduce((sum: number, g: any) => sum + g.currentAmount, 0) || 0)
                      : acc.balance;
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.type === 'CHECKING' ? 'Checking' : 'Savings'} - {acc.accountNumber.slice(-4)} (Available: {formatCurrency(availableBalance, acc.currency)})
                      </option>
                    )
                  })}
                </select>
                {accounts.length === 0 && (
                  <p className="text-amber-500 text-xs mt-2">You must open an account first to fund goals.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  onClick={() => {
                    setIsAddingFunds(false);
                    setSelectedGoalId(null);
                    setFundAmount('');
                    setFundSourceAccountId('');
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => addFundsMutation.mutate()}
                  disabled={addFundsMutation.isPending || !fundAmount || !fundSourceAccountId}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {addFundsMutation.isPending ? 'Adding...' : 'Add Funds'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
