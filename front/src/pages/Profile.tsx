import React from 'react';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/useAuthStore';
import { UserCircle, Mail, ShieldCheck, Edit2, Check, X, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';

export function Profile() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    phoneNumber: '', // Add default if available
    avatar: user?.avatar || ''
  });
  
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/profile');
      return res.data;
    }
  });

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/users/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(t('profile.successProfileUpdate'));
      setAuth({ ...user!, name: `${data.firstName} ${data.lastName}`, avatar: data.avatar }, useAuthStore.getState().token!);
      setIsEditing(false);
    },
    onError: () => {
      toast.error(t('profile.failedProfileUpdate'));
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleGenerate2FA = async () => {
    try {
      const res = await api.post('/auth/2fa/generate');
      setQrCodeUrl(res.data.qrCodeDataUrl);
      setIsSettingUp2FA(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to generate 2FA');
    }
  };

  const handleToggle2FA = async () => {
    try {
      if (profile?.isTwoFactorEnabled) {
        await api.post('/auth/2fa/turn-off', { code: twoFactorCode });
        toast.success(t('profile.success2FADisable'));
      } else {
        await api.post('/auth/2fa/turn-on', { code: twoFactorCode });
        toast.success(t('profile.success2FAEnable'));
      }
      setTwoFactorCode('');
      setIsSettingUp2FA(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || t('profile.failed2FA'));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('profile.imageSizeError'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t('profile.title')}</h1>
        <p className="text-slate-400">{t('profile.subtitle')}</p>
      </div>

      <Card className="p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-700/50">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl text-primary font-semibold overflow-hidden">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            {isEditing && (
              <div 
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-100">{user?.name || 'Bank User'}</h2>
            <p className="text-slate-400 flex items-center justify-center sm:justify-start gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{t('profile.personalInfo')}</h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <Edit2 className="w-3 h-3" /> {t('profile.edit')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={updateProfileMutation.isPending} className="text-xs text-emerald-500 flex items-center gap-1 hover:underline">
                    <Check className="w-3 h-3" /> {t('profile.save')}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="text-xs text-rose-500 flex items-center gap-1 hover:underline">
                    <X className="w-3 h-3" /> {t('profile.cancel')}
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t('profile.firstName')}</label>
                      <input 
                        value={formData.firstName} 
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                        className="w-full text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">{t('profile.lastName')}</label>
                      <input 
                        value={formData.lastName} 
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                        className="w-full text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t('profile.phone')}</label>
                    <input 
                      value={formData.phoneNumber} 
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="e.g. +1 234 567 890"
                      className="w-full text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t('profile.personalInfo')}</label>
                    <div className="text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                      {user?.name || 'N/A'}
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <label className="text-xs text-slate-500 mb-1 block">{t('profile.email')}</label>
                <div className="text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 opacity-70">
                  {user?.email || 'N/A'} {t('profile.readOnly')}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">{t('profile.security')}</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/20 flex items-start gap-4">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 mb-1">{t('profile.accountSecured')}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t('profile.accountSecuredDesc')}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-200 mb-1">{t('profile.twoFactor')}</h4>
                      <p className="text-xs text-slate-400">{t('profile.twoFactorDesc')}</p>
                    </div>
                    {isLoading ? null : profile?.isTwoFactorEnabled ? (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">{t('profile.enabled')}</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded font-medium">{t('profile.disabled')}</span>
                    )}
                  </div>

                  {!profile?.isTwoFactorEnabled && !isSettingUp2FA && (
                    <Button variant="outline" size="sm" onClick={handleGenerate2FA}>
                      {t('profile.setup2FA')}
                    </Button>
                  )}

                  {isSettingUp2FA && !profile?.isTwoFactorEnabled && (
                    <div className="mt-4 p-4 border border-slate-700 rounded-lg bg-slate-800/50 space-y-4">
                      <p className="text-sm text-slate-300">{t('profile.twoFactorStep1')}</p>
                      {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR" className="w-32 h-32 rounded bg-white p-2" />}
                      <p className="text-sm text-slate-300">{t('profile.twoFactorStep2')}</p>
                      <div className="flex gap-2">
                        <input 
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          placeholder="000000"
                          className="w-32 text-center tracking-widest text-slate-200 bg-slate-900 px-3 py-2 rounded border border-slate-700 focus:outline-none focus:border-primary"
                          maxLength={6}
                        />
                        <Button size="sm" onClick={handleToggle2FA}>{t('profile.verifyEnable')}</Button>
                      </div>
                    </div>
                  )}

                  {profile?.isTwoFactorEnabled && (
                    <div className="mt-4 p-4 border border-rose-500/20 rounded-lg bg-rose-500/5 space-y-4">
                      <p className="text-sm text-slate-300">{t('profile.disable2FAPrompt')}</p>
                      <div className="flex gap-2">
                        <input 
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          placeholder="000000"
                          className="w-32 text-center tracking-widest text-slate-200 bg-slate-900 px-3 py-2 rounded border border-slate-700 focus:outline-none focus:border-rose-500"
                          maxLength={6}
                        />
                        <Button variant="outline" size="sm" onClick={handleToggle2FA} className="text-rose-400 border-rose-500/50 hover:bg-rose-500/10">{t('profile.disable2FA')}</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">{t('profile.identityVerification')}</h3>
                  <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-200 mb-1">{t('profile.kycStatus')}</h4>
                        <p className="text-xs text-slate-400">{t('profile.kycDesc')}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        profile?.kycStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        profile?.kycStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                        profile?.kycStatus === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {profile?.kycStatus || t('profile.unverified')}
                      </span>
                    </div>

                    {(profile?.kycStatus === 'UNVERIFIED' || profile?.kycStatus === 'REJECTED') && (
                      <div className="mt-4 p-4 border border-slate-700 rounded-lg bg-slate-800/50 space-y-4">
                        <p className="text-sm text-slate-300">{t('profile.uploadPrompt')}</p>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                try {
                                  await api.post('/users/kyc', { documentUrl: reader.result });
                                  toast.success(t('profile.successKyc'));
                                  queryClient.invalidateQueries({ queryKey: ['profile'] });
                                } catch (error) {
                                  toast.error(t('profile.failedKyc'));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
