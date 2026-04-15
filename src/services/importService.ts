import { supabase } from '@/lib/supabase';
import { extractTitlesFromImage } from './aiService';
import { fetchGames, searchMedia } from './api';

export const importTitlesFromImage = async (imageFile: File, userId: string, onProgress: (status: string) => void) => {
  onProgress('Scanning image...');
  const titles = await extractTitlesFromImage(imageFile);
  onProgress(`Found ${titles.length} titles`);
  
  for (const title of titles) {
    onProgress(`Adding ${title} to library...`);
    
    // Try RAWG (games) then TMDB (movies/series)
    let mediaItem = null;
    
    // 1. Try RAWG
    const games = await fetchGames(title);
    if (games.length > 0) mediaItem = games[0];
    
    // 2. Try TMDB
    if (!mediaItem) {
      const media = await searchMedia(title);
      if (media.length > 0) mediaItem = media[0];
    }
    
    // 3. Insert into media
    let mediaId = null;
    if (mediaItem) {
      const { data: existingMedia } = await supabase
        .from('media')
        .select('id')
        .eq('external_id', mediaItem.external_id)
        .maybeSingle();
        
      if (existingMedia) {
        mediaId = existingMedia.id;
      } else {
        const { data: newMedia } = await supabase
          .from('media')
          .insert({
            external_id: mediaItem.external_id,
            media_type: mediaItem.media_type,
            title: mediaItem.title,
            poster_url: mediaItem.poster_url,
            rating_global: mediaItem.rating,
            description: mediaItem.description || '',
            genres: mediaItem.genres,
            source: 'import'
          })
          .select('id')
          .single();
        mediaId = newMedia?.id;
      }
    } else {
      // Fallback: Text-only entry
      const { data: newMedia } = await supabase
        .from('media')
        .insert({
          external_id: `text_${Date.now()}`,
          media_type: 'movie', // Default
          title: title,
          poster_url: '',
          rating_global: 0,
          description: 'Imported from image',
          genres: [],
          source: 'import'
        })
        .select('id')
        .single();
      mediaId = newMedia?.id;
    }
    
    // 4. Insert into user_library
    if (mediaId) {
      await supabase
        .from('user_library')
        .insert({
          user_id: userId,
          media_id: mediaId,
          status: 'planned'
        });
    }
  }
  onProgress('Sync completed');
};
