import React from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';

export function Settings() {
  const { user, logout } = useStore();
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-gray-400" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-2 rounded-lg bg-white/10 text-white font-medium flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </button>
          <button className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security
          </button>
        </div>

        <div className="md:col-span-3 space-y-8">
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
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
            </div>
          </div>

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
