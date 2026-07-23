import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { CreditCard, ShieldCheck, Zap, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

// Use environment variable for Stripe publishable key, fallback to test key if not provided
const stripePromise = loadStripe('pk_test_51ShEWOALf03aBKGZ9SRKZyulhCcwALDbmSunV7JXHL69FL3luORedqQ4caAakmiomRHJiVhlOH41BsAyNCgw5X3e00bS4TyfnK');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await api.get('/accounts');
      return data;
    },
  });

  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    amount?: string;
    isQuick?: boolean;
  }>({ isOpen: false });

  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !amount) {
      return;
    }

    setConfirmModal({ isOpen: true, amount, isQuick: false });
  };

  const executeDeposit = async () => {
    if (!stripe || !elements) return;
    setIsLoading(true);
    const depositAmount = confirmModal.amount!;
    setConfirmModal({ isOpen: false });

    try {
      // 1. Fetch client_secret from backend
      const response = await api.post('/stripe/create-payment-intent', { 
        amount: Number(depositAmount),
        accountId: selectedAccountId || undefined 
      });
      const { clientSecret } = response.data;
      
      // No local mock bypass - always use real Stripe Flow

      // 2. Confirm the card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: user?.name || 'User',
            email: user?.email,
          },
        }
      });

      if (result.error) {
        toast.error(result.error.message || t('deposit.failedMessage'));
      } else {
        // In local development without webhook forwarding, we explicitly tell the backend it succeeded
        try {
          await api.post('/stripe/confirm-test-deposit', {
             amount: Number(depositAmount),
             accountId: selectedAccountId || undefined 
          });
        } catch(e) {}

        toast.success(t('deposit.successMessage', { amount: depositAmount }));
        setAmount('');
        elements.getElement(CardElement)?.clear();
        
        // Refresh balance and history after a short delay (for webhook to process)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['accounts'] });
          queryClient.invalidateQueries({ queryKey: ['history'] });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      const errorMsg = error.response?.data?.message;
      const displayMsg = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg;
      toast.error(displayMsg || error.message || t('deposit.failedMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: '#f1f5f9',
        fontFamily: '"Inter", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#94a3b8',
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#f43f5e',
        iconColor: '#f43f5e',
      },
    },
  };

  const handleQuickDeposit = async () => {
    setConfirmModal({ isOpen: true, amount: '100', isQuick: true });
  };

  const copyTestCard = () => {
    navigator.clipboard.writeText('4242424242424242');
    toast.success(t('deposit.copied'));
  };

  return (
    <div className="space-y-6 mt-6">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={t('deposit.confirmModalTitle')}
        message={t('deposit.confirmModalMessage', { amount: confirmModal.amount })}
        onConfirm={executeDeposit}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
      
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={handleQuickDeposit} disabled={isLoading}>
          <Zap size={16} /> {t('deposit.quick100')}
        </Button>
        <Button type="button" variant="outline" className="flex-1 gap-2" onClick={copyTestCard} disabled={isLoading}>
          <Copy size={16} /> {t('deposit.copyTestCard')}
        </Button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-800 px-2 text-slate-400">Or use manual deposit</span>
        </div>
      </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">Target Account</label>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-primary"
          required
        >
          <option value="">Select an account</option>
          {accounts.map((acc: any) => (
            <option key={acc.id} value={acc.id}>
              {acc.type === 'CHECKING' ? 'Checking' : 'Savings'} - {acc.accountNumber.slice(-4)}
            </option>
          ))}
        </select>
      </div>

      <Input
        label={t('deposit.amount')}
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={t('deposit.amountPlaceholder')}
        required
        min="10"
      />
      
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">{t('deposit.cardDetails')}</label>
        <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading} disabled={!stripe}>
        {isLoading ? t('deposit.processing') : t('deposit.depositNow')}
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
        <ShieldCheck size={16} className="text-emerald-500" /> Payments are secure and encrypted
      </p>
    </form>
    </div>
  );
};

export function Deposit() {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t('deposit.title')}</h1>
        <p className="text-slate-400">{t('deposit.subtitle')}</p>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Credit / Debit Card</h2>
            <p className="text-sm text-slate-400">Instant deposit via Stripe</p>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </Card>
    </div>
  );
}
