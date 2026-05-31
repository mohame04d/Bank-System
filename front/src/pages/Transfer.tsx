import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const transferSchema = z.object({
  recipient: z.string().min(3, 'Recipient name or ID must be valid'),
  accountNumber: z.string().min(10, 'Account number must be at least 10 digits'),
  amount: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
});

type TransferForm = z.infer<typeof transferSchema>;

export function Transfer() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TransferForm>({
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
      toast.error('No account found to transfer from.');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post('/transactions/transfer', {
        fromAccountId: accounts[0].id,
        toAccountNumber: data.accountNumber,
        amount: Number(data.amount),
        description: data.notes || `Transfer to ${data.recipient}`,
      });
      
      toast.success(`Successfully transferred $${data.amount} to ${data.recipient}`);
      reset();
      
      // Invalidate queries to refresh balance
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to transfer money');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Transfer Money</h1>
        <p className="text-slate-400">Send money to anyone, anywhere instantly.</p>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Bank Transfer</h2>
            <p className="text-sm text-slate-400">Standard domestic transfer (1-2 business days)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Recipient Name"
            placeholder="John Doe"
            {...register('recipient')}
            error={errors.recipient?.message}
          />
          
          <Input
            label="Account Number"
            placeholder="0000 0000 0000"
            {...register('accountNumber')}
            error={errors.accountNumber?.message}
          />
          
          <div className="relative">
            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
              error={errors.amount?.message}
            />
          </div>

          <Input
            label="Transfer Notes (Optional)"
            placeholder="e.g. Rent payment"
            {...register('notes')}
            error={errors.notes?.message}
          />

          <Button type="submit" className="w-full mt-6" isLoading={isLoading} size="lg">
            Confirm Transfer
          </Button>
        </form>
      </Card>
    </div>
  );
}
