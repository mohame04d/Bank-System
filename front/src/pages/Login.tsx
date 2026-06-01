import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// We'll use simple state for now since react-hook-form is installed but we want to be quick for this specific page, actually let's use react-hook-form
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/useAuthStore';
import { Wallet } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors } } = useHookForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/sign-in', data);
      
      setAuth(
        { 
          id: response.data.data.id, 
          name: response.data.data.firstName ? `${response.data.data.firstName} ${response.data.data.lastName}` : response.data.data.email, 
          email: response.data.data.email 
        },
        response.data.access_token,
        response.data.refresh_token
      );
      
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{t('auth.loginTitle')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label={t('auth.password')}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            {...register('password')}
            error={errors.password?.message}
          />
          
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-700 bg-slate-800/50 text-primary focus:ring-primary/50" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark transition-colors">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            {t('auth.loginButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400 relative z-10">
          {t('auth.noAccount')} <Link to="/register" className="text-primary hover:text-primary-dark transition-colors font-medium">
            {t('auth.registerButton')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
