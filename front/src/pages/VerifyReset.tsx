import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export function VerifyReset() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const email = location.state?.email;

  if (!email) {
    navigate('/forgot-password');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-code', { email, code });
      const { resetToken } = response.data;
      
      toast.success('Code verified successfully!');
      navigate('/reset-password', { state: { email, resetToken } });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/reset-password', { email });
      toast.success('A new verification code has been sent.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
            <Key size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{t('auth.signupVerifyTitle')}</h1>
          <p className="text-slate-400 text-sm mt-1 text-center">
            {t('auth.signupVerifySubtitle')} <span className="text-slate-200">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <Input
            label="Verification Code"
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {t('auth.verifyButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400 relative z-10">
          <button onClick={handleResend} className="text-primary hover:text-primary-dark transition-colors font-medium">
            {t('auth.resendCode')}
          </button>
        </p>
      </Card>
    </div>
  );
}
