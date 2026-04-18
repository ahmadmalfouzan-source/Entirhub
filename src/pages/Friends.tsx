import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getFriends, getPendingRequests, acceptFriendRequest, rejectFriendRequest, removeFriend, sendFriendRequest, Friendship } from '@/services/friendsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export function Friends() {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pending, setPending] = useState<Friendship[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [f, p] = await Promise.all([getFriends(), getPendingRequests()]);
    setFriends(f);
    setPending(p);
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
      <h1 className="text-3xl font-bold text-foreground mb-6">Friends</h1>
      
      <Tabs defaultValue="friends">
        <TabsList>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="find">Find Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <div className="space-y-4">
            {friends.map(f => (
              <div key={f.id} className="flex items-center justify-between p-4 bg-card rounded-lg shadow-sm border border-border">
                <div className="flex items-center gap-4">
                  <img src={f.sender.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                  <span className="font-bold">{f.sender.username}</span>
                </div>
                <Button variant="destructive" onClick={() => removeFriend(f.id).then(loadData)}>Remove</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          {pending.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-card rounded-lg shadow-sm border border-border mb-2">
              <span className="font-bold">{p.sender.username}</span>
              <div className="flex gap-2">
                <Button onClick={() => acceptFriendRequest(p.id).then(loadData)}>Accept</Button>
                <Button variant="ghost" onClick={() => rejectFriendRequest(p.id).then(loadData)}>Reject</Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="find">
          <div className="flex gap-2 mb-4">
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Enter username" />
            <Button onClick={handleSendRequest}>Add Friend</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
