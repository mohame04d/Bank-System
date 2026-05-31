import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/reset-password', { email });
      toast.success(response.data.message || 'If an account exists, a verification code has been sent.');
      
      // For development MVP, show the token in a toast so they can copy it
      if (response.data._dev_token) {
        toast.info(`DEV MODE TOKEN: ${response.data._dev_token}`, { duration: 10000 });
      }

      navigate('/verify-reset', { state: { email } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Forgot Password</h1>
          <p className="text-slate-400 text-sm mt-2 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          <div className="text-center">
            <Link to="/login" className="text-sm text-slate-400 hover:text-primary transition-colors">
              Back to Login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
