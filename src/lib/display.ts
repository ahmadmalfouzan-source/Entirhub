export function getDisplayTitle(item: any): string {
  if (!item) return 'Unknown Title';
  const candidates = [
    item.title_english,
    item?.media?.title_english,
    item.name,
    item?.media?.name,
    item.title,
    item?.media?.title,
    item.original_title,
    item?.media?.original_title
  ].filter(Boolean);

  // Fallback specifically for One Piece if identified by Arabic or Asian scripts
  const isNonLatin = (str: string) => /[\u0600-\u06FF\u0590-\u05FF\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(str);

  for (const title of candidates) {
    if (typeof title === 'string' && !isNonLatin(title)) {
      return title;
    }
  }
  
  // Hard code for One Piece fix since it gets stuck
  if (candidates.some(c => typeof c === 'string' && c.includes('ون بيس'))) {
    return 'One Piece';
  }

  return candidates[0] || 'Unknown Title';
}

export function getDisplayRating(item: any, userRating?: number | null): number | null {
  // First prefer actual media vote_average from API
  const voteAuth = item?.vote_average || item?.media?.vote_average;
  if (voteAuth) {
    const num = parseFloat(voteAuth);
    if (!isNaN(num) && num > 0) {
        if (num > 10) return num / 10;
        return num;
    }
  }

  // Then prefer user rating if non-zero
  if (userRating && userRating > 0 && userRating <= 10 && userRating !== 5.0) {
    return userRating;
  }
  
  if (item?.rating && item.rating > 0 && item.rating <= 10 && item.rating !== 5.0) {
      return item.rating;
  }

  return null;
}
