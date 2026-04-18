import { supabase } from '../lib/supabase';

export interface MediaInput {
  external_id: string;
  media_type: 'movie' | 'series' | 'game';
  title: string;
  description?: string;
  poster_url?: string;
  backdrop_url?: string;
  release_date?: string;
  genres?: string[];
  rating_global?: number;
  source?: string;
}

/**
 * Ensures a profile exists for the user in the public.profiles table.
 */
async function ensureProfileExists(userId: string, email?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{ id: userId, username: email?.split('@')[0] || 'user' }]);
    
    if (insertError) throw insertError;
  }
}

/**
 * Adds a media item to the global media table if it doesn't exist,
 * then adds it to the current user's library.
 */
export async function addToLibrary(media: MediaInput) {
  try {
    // Try to get session from sync auth state first to avoid lock stealing
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) throw new Error('User not authenticated');

    // Ensure profile exists to avoid foreign key violations
    await ensureProfileExists(user.id, user.email);

    // 1. Check if media already exists in "media" table using external_id
    let { data: existingMedia, error: fetchError } = await supabase
      .from('media')
      .select('id')
      .eq('external_id', media.external_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let mediaId = existingMedia?.id;

    // 2. If not exists, insert it
    if (!mediaId) {
      const { data: newMedia, error: insertError } = await supabase
        .from('media')
        .insert([media])
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      mediaId = newMedia.id;
    }

    // 3. Then insert into "user_library"
    const { data, error } = await supabase
      .from('user_library')
      .insert([{
        user_id: user.id,
        media_id: mediaId,
        status: 'planned'
      }])
      .select()
      .single();

    if (error) {
      // Handle unique constraint if user already has it
      if (error.code === '23505') {
        return { message: 'Already in library' };
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in addToLibrary:', error.message);
    throw error;
  }
}

/**
 * Fetches the current user's library with joined media details.
 */
export async function getUserLibrary() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: [], error: null };
  return await supabase
    .from('user_library')
    .select('*, media(*)')
    .eq('user_id', session.user.id);
}

/**
 * Increments the rewatch count of a library item.
 */
export async function incrementRewatch(libraryId: string, currentCount: number) {
  try {
    const { data, error } = await supabase
      .from('user_library')
      .update({ rewatch_count: currentCount + 1, updated_at: new Date().toISOString() })
      .eq('id', libraryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error in incrementRewatch:', error.message);
    throw error;
  }
}

/**
 * Updates the platform of a library item.
 */
export async function updatePlatform(libraryId: string, platform: string) {
  try {
    const { data, error } = await supabase
      .from('user_library')
      .update({ platform, updated_at: new Date().toISOString() })
      .eq('id', libraryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error in updatePlatform:', error.message);
    throw error;
  }
}

/**
 * Updates the hours played of a library item.
 */
export async function updateHoursPlayed(libraryId: string, hours: number) {
  try {
    const { data, error } = await supabase
      .from('user_library')
      .update({ hours_played: hours, updated_at: new Date().toISOString() })
      .eq('id', libraryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error in updateHoursPlayed:', error.message);
    throw error;
  }
}

/**
 * Toggles the 100% completion status of a library item.
 */
export async function toggle100Completion(libraryId: string, isCompleted: boolean) {
  try {
    const { data, error } = await supabase
      .from('user_library')
      .update({ is_completed_100: isCompleted, updated_at: new Date().toISOString() })
      .eq('id', libraryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error in toggle100Completion:', error.message);
    throw error;
  }
}

/**
 * Updates the status of a library item.
 */
export async function updateStatus(libraryId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('user_library')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', libraryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error in updateStatus:', error.message);
    throw error;
  }
}

/**
 * Updates the rating of a library item.
 */
export async function rateMedia(libraryId: string, rating: number) {
  try {
    const { data, error } = await supabase
      .from('user_library')
      .update({ rating, updated_at: new Date().toISOString() })
      .eq('id', libraryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error in rateMedia:', error.message);
    throw error;
  }
}
