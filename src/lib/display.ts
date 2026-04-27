export function getDisplayTitle(item: any): string {
  if (!item) return 'Unknown Title';
  const candidates = [
    item.title_english,
    item.name,
    item.title,
    item.original_title,
    item?.media?.title_english,
    item?.media?.name,
    item?.media?.title,
    item?.media?.original_title
  ].filter(Boolean);

  for (const title of candidates) {
    if (typeof title === 'string' && !/[\u0600-\u06FF]/.test(title)) {
      return title;
    }
  }
  return candidates[0] || 'Unknown Title';
}

export function getDisplayRating(item: any, fallbackRating?: number): number | null {
  if (fallbackRating && fallbackRating > 0 && fallbackRating <= 10) {
    return fallbackRating;
  }
  
  if (item?.rating && item.rating > 0 && item.rating <= 10) return item.rating;

  const voteAuth = item?.vote_average || item?.media?.vote_average || item?.media?.rating;
  if (voteAuth) {
    const num = parseFloat(voteAuth);
    if (!isNaN(num) && num > 0) {
        if (num > 10) return num / 10;
        return num;
    }
  }
  return null;
}
