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
import { CreditCard, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

// Replace with your actual Stripe publishable key
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !amount) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Fetch client_secret from backend
      const response = await api.post('/stripe/create-payment-intent', { amount: Number(amount) });
      const { clientSecret } = response.data;
      
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
        toast.error(result.error.message || 'Payment failed');
      } else {
        toast.success(`Successfully deposited $${amount}!`);
        setAmount('');
        elements.getElement(CardElement)?.clear();
        
        // Refresh balance and history after a short delay (for webhook to process)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['accounts'] });
          queryClient.invalidateQueries({ queryKey: ['history'] });
        }, 2000);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'An error occurred during payment');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <Input
        label="Deposit Amount (USD)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="100.00"
        required
        min="10"
      />
      
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">Card Details</label>
        <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading} disabled={!stripe}>
        Pay Securely
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
        <ShieldCheck size={16} className="text-emerald-500" /> Payments are secure and encrypted
      </p>
    </form>
  );
};

export function Deposit() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Deposit Funds</h1>
        <p className="text-slate-400">Add money to your NeonBank account using a credit or debit card.</p>
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
