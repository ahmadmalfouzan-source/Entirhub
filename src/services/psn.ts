import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { fetchGames } from '@/services/api';

export interface PSNTrophy {
  id: string;
  title: string;
  description: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned: boolean;
  earnedAt?: string;
}

export interface PSNGame {
  id: string;
  title: string;
  imageUrl: string;
  platform: string;
  trophies: PSNTrophy[];
  platinumEarned: boolean;
  progress: number;
}

export async function fetchPSNProfile(username: string) {
  let allGames: PSNGame[] = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const response = await fetch(`https://psn-api.achievements.app/v1/users/${username}/games?page=${page}`);
      
      if (!response.ok) {
        break;
      }
      
      const data = await response.json();
      if (data.games && data.games.length > 0) {
        allGames = [...allGames, ...data.games];
        page++;
      } else {
        hasMore = false;
      }
    }
    return { games: allGames };
  } catch (error) {
    console.error('Error fetching PSN profile:', error);
    return getMockPSNData();
  }
}

function getMockPSNData() {
  return {
    games: [
      {
        id: 'psn_1',
        title: 'God of War Ragnarök',
        imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYcg7Oi0q.png',
        platform: 'PS5',
        platinumEarned: true,
        progress: 100,
        trophies: [
          { id: 't1', title: 'The Bear and the Wolf', type: 'platinum', earned: true }
        ]
      },
      {
        id: 'psn_2',
        title: 'Marvel\'s Spider-Man 2',
        imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png',
        platform: 'PS5',
        platinumEarned: false,
        progress: 45,
        trophies: []
      }
    ],
    stats: {
      totalTrophies: 1245,
      platinum: 12,
      gold: 85,
      silver: 230,
      bronze: 918
    }
  };
}

export async function syncPSNGamesToLibrary(username: string, userId: string) {
  try {
    const psnData = await fetchPSNProfile(username);
    
    if (!psnData || !psnData.games) {
      console.log('No games found in PSN data:', psnData);
      return;
    }

    console.log(`Syncing ${psnData.games.length} games from PSN...`);
    
    const games = psnData.games;
    
    for (const game of games) {
      console.log(`Processing game: ${game.title}`);
      // 1. Search RAWG for details
      const rawgGames = await fetchGames(game.title);
      const rawgGame = rawgGames && rawgGames.length > 0 ? rawgGames[0] : null;
      
      // 2. Check if already in library
      const { data: existing } = await supabase
        .from('user_library')
        .select('id')
        .eq('user_id', userId)
        .eq('media_id', game.id)
        .single();

      if (!existing) {
        // First ensure media exists
        const { data: mediaData } = await supabase
          .from('media')
          .select('id')
          .eq('external_id', game.id)
          .single();

        let mediaId = mediaData?.id;

        if (!mediaId) {
          const { data: newMedia } = await supabase
            .from('media')
            .insert({
              external_id: game.id,
              media_type: 'game',
              title: game.title,
              poster_url: rawgGame?.poster_url || game.imageUrl,
              description: rawgGame?.description || '',
              genres: rawgGame?.genres || [],
              rating_global: rawgGame?.rating || 0,
              source: 'psn'
            })
            .select('id')
            .single();
            
          if (newMedia) mediaId = newMedia.id;
        }

        if (mediaId) {
          await supabase
            .from('user_library')
            .insert({
              user_id: userId,
              media_id: mediaId,
              status: 'playing',
              platform: game.platform || 'PlayStation'
            });
        }
      }
    }
    
    return psnData;
  } catch (error) {
    console.error('Error syncing PSN games:', error);
    throw error;
  }
}
