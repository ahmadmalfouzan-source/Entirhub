import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function Settings() {
  const { user, logout } = useStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest';
  const [password, setPassword] = useState('');
  const [notifications, setNotifications] = useState({ email: true, newEpisode: true, seasonPremiere: true });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else toast.success('Password updated successfully');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-gray-400" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <User className="w-4 h-4" /> {t('profile')}
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Bell className="w-4 h-4" /> {t('notifications')}
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Shield className="w-4 h-4" /> {t('security')}
          </button>
        </div>

        <div className="md:col-span-3 space-y-8">
          {activeTab === 'profile' && (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl text-white font-bold">
                  {username[0]?.toUpperCase()}
                </div>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Change Avatar
                </Button>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input id="username" defaultValue={username} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || 'guest@example.com'} className="bg-white/5 border-white/10 text-white" />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">{t('saveChanges')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">{t('notifications')}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">{t('emailNotifications')}</Label>
                  <input type="checkbox" checked={notifications.email} onChange={() => setNotifications(p => ({...p, email: !p.email}))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">{t('newEpisodeAlerts')}</Label>
                  <input type="checkbox" checked={notifications.newEpisode} onChange={() => setNotifications(p => ({...p, newEpisode: !p.newEpisode}))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">{t('seasonPremiereAlerts')}</Label>
                  <input type="checkbox" checked={notifications.seasonPremiere} onChange={() => setNotifications(p => ({...p, seasonPremiere: !p.seasonPremiere}))} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">{t('changePassword')}</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">{t('newPassword')}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{t('saveChanges')}</Button>
              </form>
            </div>
          )}

          <div className="bg-[#111827] border border-red-500/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-gray-400 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
