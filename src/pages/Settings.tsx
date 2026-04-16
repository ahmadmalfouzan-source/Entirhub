import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { usePWAStore } from '@/store/usePWAStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, User, Shield, AlertTriangle, Gamepad2, Smartphone } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { syncPSNGamesToLibrary } from '@/services/psn';

export function Settings() {
  const { user, logout, psnUsername, fetchProfile, fetchWatchlist } = useStore();
  const { deferredPrompt, isInstallable, clearDeferredPrompt } = usePWAStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'integrations' | 'app'>('profile');
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest';
  const [password, setPassword] = useState('');
  const [psnInput, setPsnInput] = useState(psnUsername || '');
  const [isSyncing, setIsSyncing] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else toast.success('Password updated successfully');
  };

  const handleConnectPSN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!psnInput) return;
    
    setIsSyncing(true);
    try {
      // Save to profile
      const { error } = await supabase
        .from('profiles')
        .update({ psn_username: psnInput })
        .eq('id', user?.id);
        
      if (error) throw error;
      
      toast.success('PSN connected! Syncing games...');
      
      // Sync games
      if (user?.id) {
        await syncPSNGamesToLibrary(psnInput, user.id);
        await fetchProfile();
        await fetchWatchlist();
        toast.success('PSN games synced to your library!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect PSN');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      clearDeferredPrompt();
      toast.success('App installation started!');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === 'profile' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <User className="w-5 h-5" /> {t('profile')}
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === 'security' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Shield className="w-5 h-5" /> {t('security')}
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === 'integrations' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Gamepad2 className="w-5 h-5" /> Integrations
          </button>
          <button 
            onClick={() => setActiveTab('app')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === 'app' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Smartphone className="w-5 h-5" /> App Settings
          </button>
        </div>

        <div className="md:col-span-3 space-y-8">
          {activeTab === 'profile' && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-8">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                  {username[0]?.toUpperCase()}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">{username}</h3>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">Username</Label>
                  <Input id="username" defaultValue={username} className="bg-white/5 border-white/10 text-white h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || 'guest@example.com'} disabled className="bg-white/5 border-white/10 text-gray-500 h-12 rounded-xl cursor-not-allowed" />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl w-full sm:w-auto mt-4">{t('saveChanges')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-2">{t('changePassword')}</h2>
                <p className="text-gray-400 mb-8">Ensure your account is using a long, random password to stay secure.</p>
                
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">{t('newPassword')}</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white h-12 rounded-xl" placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 rounded-xl w-full sm:w-auto">{t('saveChanges')}</Button>
                </form>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                  Delete Account
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">PlayStation Network</h2>
              <p className="text-gray-400 mb-8">Connect your PSN account to automatically sync your games and trophies.</p>
              
              <form onSubmit={handleConnectPSN} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="psn" className="text-gray-300">PSN Username</Label>
                  <Input 
                    id="psn" 
                    value={psnInput} 
                    onChange={(e) => setPsnInput(e.target.value)} 
                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl" 
                    placeholder="e.g. Kratos123" 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSyncing || !psnInput}
                  className="bg-[#00439C] hover:bg-[#003070] text-white h-12 px-8 rounded-xl w-full sm:w-auto flex items-center gap-2"
                >
                  <Gamepad2 className="w-5 h-5" />
                  {isSyncing ? 'Syncing...' : (psnUsername ? 'Update & Sync' : 'Connect PlayStation')}
                </Button>
              </form>
            </div>
          )}
          {activeTab === 'app' && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">App Settings</h2>
              <p className="text-gray-400 mb-8">Manage your application experience.</p>
              
              <div className="space-y-6 max-w-md">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Smartphone className="w-8 h-8 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-medium text-white">Install App</h3>
                      <p className="text-sm text-gray-400">Install EntertainHub on your device for a better experience.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleInstallApp}
                    disabled={!isInstallable}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl"
                  >
                    {isInstallable ? 'Install App' : 'App Already Installed or Not Supported'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
