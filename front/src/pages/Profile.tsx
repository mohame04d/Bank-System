import React from 'react';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/useAuthStore';
import { UserCircle, Mail, ShieldCheck, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';

export function Profile() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    phoneNumber: '' // Add default if available
  });
  
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/users/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully');
      setAuth({ ...user!, name: `${data.firstName} ${data.lastName}` }, useAuthStore.getState().token!);
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
        <p className="text-slate-400">Manage your personal information and preferences.</p>
      </div>

      <Card className="p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-700/50">
          <div className="w-24 h-24 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl text-primary font-semibold">
            {user?.name?.charAt(0) || 'U'}
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
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Personal Details</h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={updateProfileMutation.isPending} className="text-xs text-emerald-500 flex items-center gap-1 hover:underline">
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => setIsEditing(false)} className="text-xs text-rose-500 flex items-center gap-1 hover:underline">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">First Name</label>
                      <input 
                        value={formData.firstName} 
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                        className="w-full text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Last Name</label>
                      <input 
                        value={formData.lastName} 
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                        className="w-full text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Phone Number</label>
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
                    <label className="text-xs text-slate-500 mb-1 block">Full Name</label>
                    <div className="text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50">
                      {user?.name || 'N/A'}
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Email Address</label>
                <div className="text-slate-200 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/50 opacity-70">
                  {user?.email || 'N/A'} (Read-only)
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Security</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/20 flex items-start gap-4">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 mb-1">Account Secured</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your account is protected by industry standard encryption and JWT authentication.
                    </p>
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
