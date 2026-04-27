import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getFriends, getPendingRequests, acceptFriendRequest, rejectFriendRequest, removeFriend, sendFriendRequest, Friendship } from '@/services/friendsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Friends() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pending, setPending] = useState<Friendship[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [f, p] = await Promise.all([getFriends(), getPendingRequests()]);
      setFriends(f || []);
      setPending(p || []);
    } catch (err: any) {
      console.warn('Silent fallback for friends fetch:', err);
      setFriends([]);
      setPending([]);
    }
  };

  const handleSendRequest = async () => {
    try {
      await sendFriendRequest(searchTerm);
      toast.success('Request sent');
      setSearchTerm('');
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_var(--color-primary-glow)]">
          <span className="text-xl">🤝</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-md tracking-tight">Friends</h1>
      </div>
      
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="bg-surface/50 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 w-fit mb-6">
          <TabsTrigger value="friends" className="rounded-xl px-6 font-bold tracking-widest uppercase text-xs data-[state=active]:bg-primary data-[state=active]:shadow-[0_0_10px_var(--color-primary-glow)]">Friends</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-xl px-6 font-bold tracking-widest uppercase text-xs data-[state=active]:bg-primary data-[state=active]:shadow-[0_0_10px_var(--color-primary-glow)]">Pending</TabsTrigger>
          <TabsTrigger value="find" className="rounded-xl px-6 font-bold tracking-widest uppercase text-xs data-[state=active]:bg-primary data-[state=active]:shadow-[0_0_10px_var(--color-primary-glow)]">Find Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friends.map(f => {
              const friendProfile = f.sender_id === user?.id ? f.receiver : f.sender;
              return (
                <div key={f.id} className="flex items-center justify-between p-4 premium-card rounded-2xl shadow-[var(--shadow-bento)] border border-white/5 transition-transform duration-snappy hover:scale-[1.02] cursor-pointer" onClick={() => navigate(`/user/${friendProfile.username}`)}>
                  <div className="flex items-center gap-4">
                    <img src={friendProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} alt="" className="w-12 h-12 rounded-xl shadow-md object-cover" />
                    <span className="font-bold text-white drop-shadow-sm">{friendProfile.username}</span>
                  </div>
                  <Button variant="destructive" size="sm" className="btn-neon" onClick={(e) => { e.stopPropagation(); removeFriend(f.id).then(loadData); }}>Remove</Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pending.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 premium-glass rounded-2xl shadow-[var(--shadow-bento)] border border-white/10 mb-2">
                <span className="font-bold text-white drop-shadow-sm">{p.sender.username}</span>
                <div className="flex gap-2">
                  <Button size="sm" className="btn-neon bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500 hover:text-white" onClick={() => acceptFriendRequest(p.id).then(loadData)}>Accept</Button>
                  <Button size="sm" variant="ghost" className="hover:bg-red-500/20 hover:text-red-400" onClick={() => rejectFriendRequest(p.id).then(loadData)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="find">
          <div className="flex flex-col sm:flex-row gap-3 mb-4 max-w-md">
            <Input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Enter username" 
              className="premium-glass border-white/10 text-white rounded-full h-12 focus-visible:ring-primary focus-visible:shadow-[0_0_10px_var(--color-primary-glow)] font-bold transition-all duration-snappy"
            />
            <Button className="btn-neon rounded-full h-12 px-6" onClick={handleSendRequest}>Add Friend</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
