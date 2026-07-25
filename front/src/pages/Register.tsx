import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/useAuthStore';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const [firstName, ...lastNameParts] = data.name.trim().split(' ');
      const lastName = lastNameParts.join(' ') || 'Unknown';

      const payload = {
        email: data.email,
        password: data.password,
        firstName,
        lastName,
      };

      const response = await api.post('/auth/sign-up', payload);

      if (response.data?.access_token) {
        const { access_token, refresh_token, data: userData } = response.data;
        const name = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || userData?.name || userData?.email || '';
        setAuth(
          { id: userData?.id || '', name, email: userData?.email || '' },
          access_token,
          refresh_token
        );
        toast.success('Account created successfully! Welcome 🚀');
        navigate('/dashboard');
      } else {
        toast.success('Account created successfully! Please sign in.');
        navigate('/login');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{t('auth.registerTitle')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-4">
          <Input
            label={t('auth.name')}
            type="text"
            placeholder={t('auth.namePlaceholder')}
            {...register('name')}
            error={errors.name?.message}
          />
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
          <Input
            label={t('profile.confirmPassword')}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            {t('auth.registerButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400 relative z-10">
          {t('auth.haveAccount')} <Link to="/login" className="text-primary hover:text-primary-dark transition-colors font-medium">
            {t('auth.loginButton')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
