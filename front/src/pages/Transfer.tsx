import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ArrowRightLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const transferSchema = z.object({
  recipient: z.string().min(3, 'Recipient name or ID must be valid'),
  accountNumber: z.string().min(10, 'Account number must be at least 10 digits'),
  amount: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
});

type TransferForm = z.infer<typeof transferSchema>;

export function Transfer() {
  const [isLoading, setIsLoading] = useState(false);
  const [recentContacts, setRecentContacts] = useState<{name: string, account: string}[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    data?: TransferForm;
    sourceAccount?: any;
  }>({ isOpen: false });
  const { t } = useTranslation();
  
  useEffect(() => {
    const saved = localStorage.getItem('recentContacts');
    if (saved) {
      try {
        setRecentContacts(JSON.parse(saved));
      } catch (e) {
        setRecentContacts([]);
      }
    } else {
      // Add a default test account for easy testing
      setRecentContacts([{ name: 'Test User', account: '2222222222' }]);
    }
  }, []);
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await api.get('/accounts');
      return data;
    },
  });

  const onSubmit = async (data: TransferForm) => {
    if (!accounts || accounts.length === 0) {
      toast.error(t('transfer.noAccountError'));
      return;
    }
    
    const amountNum = Number(data.amount);
    
    // Find an account that has enough balance, prefer CHECKING
    let sourceAccount = accounts.find((acc: any) => acc.type === 'CHECKING' && Number(acc.balance) >= amountNum);
    if (!sourceAccount) {
      sourceAccount = accounts.find((acc: any) => Number(acc.balance) >= amountNum) || accounts[0];
    }
    
    setConfirmModal({ isOpen: true, data, sourceAccount });
  };

  const executeTransfer = async () => {
    setIsLoading(true);
    const data = confirmModal.data!;
    const sourceAccount = confirmModal.sourceAccount!;
    setConfirmModal({ isOpen: false });
    
    try {
      await api.post('/transactions/transfer', {
        fromAccountId: sourceAccount.id,
        toAccountNumber: data.accountNumber,
        amount: Number(data.amount),
        description: data.notes || `Transfer to ${data.recipient}`,
      });
      
      toast.success(t('transfer.successMessage', { amount: data.amount, recipient: data.recipient }));
      
      // Save to recent contacts
      const newContact = { name: data.recipient, account: data.accountNumber };
      const updatedContacts = [
        newContact,
        ...recentContacts.filter(c => c.account !== newContact.account)
      ].slice(0, 5); // Keep only last 5
      
      setRecentContacts(updatedContacts);
      localStorage.setItem('recentContacts', JSON.stringify(updatedContacts));
      
      reset();
      
      // Invalidate queries to refresh balance
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    } catch (error: any) {
      console.error('Transfer API Error:', error);
      const errorMsg = error.response?.data?.message;
      const displayMsg = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg;
      
      // If the account was not found, auto-remove it from recent contacts
      if (error.response?.status === 404 || displayMsg === 'Destination account not found') {
        const updatedContacts = recentContacts.filter(c => c.account !== data.accountNumber);
        setRecentContacts(updatedContacts);
        localStorage.setItem('recentContacts', JSON.stringify(updatedContacts));
        toast.error(t('transfer.accountDeleted'));
      } else {
        toast.error(displayMsg || error.message || t('transfer.failedMessage'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={t('transfer.confirmModalTitle')}
        message={t('transfer.confirmModalMessage', { amount: confirmModal.data?.amount, recipient: confirmModal.data?.recipient })}
        onConfirm={executeTransfer}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
      
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t('transfer.title')}</h1>
        <p className="text-slate-400">{t('transfer.subtitle')}</p>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t('transfer.bankTransfer')}</h2>
            <p className="text-sm text-slate-400">{t('transfer.bankTransferDesc')}</p>
          </div>
        </div>

        {recentContacts.length > 0 && (
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Users size={16} className="text-primary" /> {t('transfer.quickSelect')}
            </label>
            <div className="flex flex-wrap gap-2">
              {recentContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center bg-slate-800 border border-slate-700 rounded-full overflow-hidden transition-colors hover:border-primary group">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('recipient', contact.name);
                      setValue('accountNumber', contact.account);
                    }}
                    className="px-3 py-1.5 text-sm text-slate-300 group-hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    {contact.name}
                  </button>
                  <button
                    type="button"
                    title={t('transfer.removeContact')}
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = recentContacts.filter(c => c.account !== contact.account);
                      setRecentContacts(updated);
                      localStorage.setItem('recentContacts', JSON.stringify(updated));
                    }}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors border-l border-slate-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('transfer.recipientName')}
            placeholder={t('transfer.recipientPlaceholder')}
            {...register('recipient')}
            error={errors.recipient?.message}
          />
          
          <Input
            label={t('transfer.accountNumber')}
            placeholder={t('transfer.accountPlaceholder')}
            {...register('accountNumber')}
            error={errors.accountNumber?.message}
          />
          
          <div className="relative">
            <Input
              label={t('transfer.amount')}
              type="number"
              step="0.01"
              placeholder={t('transfer.amountPlaceholder')}
              {...register('amount')}
              error={errors.amount?.message}
            />
          </div>

          <Input
            label={t('transfer.notes')}
            placeholder={t('transfer.notesPlaceholder')}
            {...register('notes')}
            error={errors.notes?.message}
          />

          <Button type="submit" className="w-full mt-6" isLoading={isLoading} size="lg">
            {t('transfer.confirmTransfer')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
