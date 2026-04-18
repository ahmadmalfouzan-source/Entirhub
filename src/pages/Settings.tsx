import React, { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { usePWAStore } from '@/store/usePWAStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, User, Shield, AlertTriangle, Gamepad2, Smartphone, Loader2, Camera, Palette } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { syncPSNGamesToLibrary } from '@/services/psn';
import { useThemeStore } from '@/store/useThemeStore';
import { themes } from '@/styles/themes';

export function Settings() {
  const { user, logout, psnUsername, avatarUrl, fetchProfile, fetchWatchlist } = useStore();
  const { deferredPrompt, isInstallable, clearDeferredPrompt } = usePWAStore();
  const { themeName, setTheme } = useThemeStore();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'integrations' | 'app'>('profile');
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest';
  const [password, setPassword] = useState('');
  const [psnInput, setPsnInput] = useState(psnUsername || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
       e.target.value = '';
      return;
    }

    // Convert to base64 and update profile
    setIsUploading(true);
    try {
      if (!user) throw new Error('Not authenticated');

      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64String = await base64Promise;
      
      // Update preview immediately
      setLocalPreview(base64String);

      // Store base64 directly in avatar_url column
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: base64String })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await fetchProfile();
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading avatar');
      setLocalPreview(null); // Revert preview on error
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ease-in-out">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">{t('settings')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === 'profile' ? 'bg-primary/10 text-accent border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <User className="w-5 h-5" /> {t('profile')}
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === 'security' ? 'bg-primary/10 text-accent border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Shield className="w-5 h-5" /> {t('security')}
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === 'integrations' ? 'bg-primary/10 text-accent border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Gamepad2 className="w-5 h-5" /> {t('integrations')}
          </button>
          <button 
            onClick={() => setActiveTab('app')}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === 'app' ? 'bg-primary/10 text-accent border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Smartphone className="w-5 h-5" /> {t('appSettings')}
          </button>
        </div>

        <div className="md:col-span-3 space-y-8">
          {activeTab === 'profile' && (
            <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-8">{t('profileInformation')}</h2>
              
              <div className="flex items-center gap-6 mb-10">
                <div 
                  onClick={handleAvatarClick}
                  className="relative group cursor-pointer"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                    {localPreview || avatarUrl ? (
                      <img 
                        src={localPreview || avatarUrl || ''} 
                        alt={username} 
                        className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      username[0]?.toUpperCase()
                    )}
                    
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    ) }
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">{username}</h3>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs border-white/10 hover:bg-white/5"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                    {t('changeAvatar')}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">{t('username')}</Label>
                  <Input id="username" defaultValue={username} className="bg-white/5 border-white/10 text-white h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">{t('email')}</Label>
                  <Input id="email" type="email" defaultValue={user?.email || 'guest@example.com'} disabled className="bg-white/5 border-white/10 text-gray-500 h-12 rounded-xl cursor-not-allowed" />
                  <p className="text-xs text-gray-500 mt-1">{t('emailCannotBeChanged')}</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl w-full sm:w-auto mt-4">{t('saveChanges')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-2">{t('changePassword')}</h2>
                <p className="text-gray-400 mb-8">{t('ensureLongPassword')}</p>
                
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">{t('newPassword')}</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white h-12 rounded-xl" placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl w-full sm:w-auto">{t('saveChanges')}</Button>
                </form>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-red-500">{t('dangerZone')}</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">{t('deleteAccountWarning')}</p>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                  {t('deleteAccount')}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">{t('playstationNetwork')}</h2>
              <p className="text-gray-400 mb-8">{t('connectPSN')}</p>
              
              <form onSubmit={handleConnectPSN} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="psn" className="text-gray-300">{t('psnUsername')}</Label>
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
                  {isSyncing ? t('syncing') : (psnUsername ? t('updateAndSync') : t('connectPlayStation'))}
                </Button>
              </form>
            </div>
          )}
          {activeTab === 'app' && (
            <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">{t('appSettings')}</h2>
              <p className="text-gray-400 mb-8">{t('manageAppExperience')}</p>
              
              <div className="space-y-6 max-w-md">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Smartphone className="w-8 h-8 text-accent" />
                    <div>
                      <h3 className="text-lg font-medium text-white">{t('installApp')}</h3>
                      <p className="text-sm text-gray-400">{t('installAppDesc')}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleInstallApp}
                    disabled={!isInstallable}
                    className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl"
                  >
                    {isInstallable ? t('installApp') : t('appAlreadyInstalled')}
                  </Button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Palette className="w-8 h-8 text-purple-400" />
                    <div>
                      <h3 className="text-lg font-medium text-white">App Theme</h3>
                      <p className="text-sm text-gray-400">Choose your favorite streaming color scheme</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {Object.entries(themes).map(([key, theme]) => {
                      const isActive = themeName === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setTheme(key as any)}
                          className={`relative w-full text-left rounded-2xl border-2 transition-all overflow-hidden ${
                            isActive ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent hover:border-white/30'
                          }`}
                          style={{ backgroundColor: (theme as any)['color-background'] }}
                        >
                          {/* Mock App Header */}
                          <div style={{ backgroundColor: (theme as any)['color-surface'] }} className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: (theme as any)['color-primary'] }} />
                              <span className="text-sm font-bold truncate max-w-[100px]" style={{ color: (theme as any)['color-text'] }}>{theme.name}</span>
                            </div>
                            {isActive && <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: (theme as any)['color-primary'] }}/></div>}
                          </div>
                          
                          {/* Mock App Content */}
                          <div className="p-4 space-y-3">
                            {/* Banner */}
                            <div className="w-full h-16 rounded-xl relative overflow-hidden" style={{ backgroundColor: (theme as any)['color-surface'] }}>
                               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(to right, ${(theme as any)['color-primary']}, ${(theme as any)['color-accent']})` }} />
                            </div>
                            
                            {/* Mock cards row */}
                            <div className="flex space-x-2 overflow-hidden">
                              <div className="w-12 h-16 rounded-md border border-white/5" style={{ backgroundColor: (theme as any)['color-surface'] }} />
                              <div className="w-12 h-16 rounded-md border border-white/5" style={{ backgroundColor: (theme as any)['color-surface'] }} />
                              <div className="w-12 h-16 rounded-md border border-white/5" style={{ backgroundColor: (theme as any)['color-surface'] }} />
                            </div>

                            {/* Color Swatches */}
                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                              <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: (theme as any)['color-primary'] }} title="Primary" />
                              <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: (theme as any)['color-background'] }} title="Background" />
                              <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: (theme as any)['color-accent'] }} title="Accent" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
