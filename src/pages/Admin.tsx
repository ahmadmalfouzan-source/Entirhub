import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Users, Film, Library, TrendingUp } from 'lucide-react';

export function Admin() {
  const { isAdmin } = useStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMedia: 0,
    totalLibraryEntries: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [popularContent, setPopularContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAdminData = async () => {
      try {
        // Fetch total users
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch total media
        const { count: mediaCount } = await supabase
          .from('media')
          .select('*', { count: 'exact', head: true });

        // Fetch total library entries
        const { count: libraryCount } = await supabase
          .from('user_library')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersCount || 0,
          totalMedia: mediaCount || 0,
          totalLibraryEntries: libraryCount || 0,
        });

        // Fetch users list
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, username, created_at, is_admin')
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (usersData) {
          // Get stats for each user
          const usersWithStats = await Promise.all(usersData.map(async (u) => {
            const { count } = await supabase
              .from('user_library')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', u.id);
            return { ...u, libraryCount: count || 0 };
          }));
          setUsers(usersWithStats);
        }

        // Fetch popular content (most added to library)
        // Since we can't easily group by in Supabase JS without RPC, we'll do a simple query
        // Or we can just fetch top rated media
        const { data: popularData } = await supabase
          .from('media')
          .select('id, title, media_type, rating_global, poster_url')
          .order('rating_global', { ascending: false })
          .limit(10);
          
        if (popularData) {
          setPopularContent(popularData);
        }

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading admin dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of platform statistics and users.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Total Users</div>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Total Media</div>
            <div className="text-2xl font-bold text-white">{stats.totalMedia}</div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Library Entries</div>
            <div className="text-2xl font-bold text-white">{stats.totalLibraryEntries}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users List */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-medium">Username</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Library Items</th>
                  <th className="pb-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 text-white">{u.username || 'Unknown'}</td>
                    <td className="py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-gray-400">{u.libraryCount}</td>
                    <td className="py-3">
                      {u.is_admin ? (
                        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs">Admin</span>
                      ) : (
                        <span className="bg-white/10 text-gray-300 px-2 py-1 rounded text-xs">User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Content */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Top Rated Media
          </h2>
          <div className="space-y-4">
            {popularContent.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-6 text-center text-gray-500 font-bold">{index + 1}</div>
                <img src={item.poster_url} alt={item.title} className="w-10 h-14 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{item.title}</div>
                  <div className="text-xs text-gray-400 capitalize">{item.media_type} • ★ {item.rating_global?.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
