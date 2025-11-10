/**
 * Theme Matching Utility
 * Extracts keywords from event information and maps them to Spotify genres
 * Calculates theme match scores for tracks
 */

export interface EventInfo {
  name?: string;
  theme?: string;
  description?: string;
}

export interface TrackInfo {
  name?: string;
  artist?: string;
  album?: string;
  genres?: string[];
}

/**
 * Extract keywords from event information
 */
export function extractEventKeywords(event: EventInfo): string[] {
  const keywords: string[] = [];
  const text = [
    event.name || '',
    event.theme || '',
    event.description || ''
  ].join(' ').toLowerCase();
  
  // Common event type keywords
  const eventTypes = [
    'pool party', 'pool', 'beach', 'summer', 'tropical',
    'wedding', 'marriage', 'ceremony', 'reception',
    'corporate', 'business', 'office', 'professional',
    'birthday', 'anniversary', 'celebration',
    'club', 'nightclub', 'dance', 'party',
    'festival', 'concert', 'live',
    'romantic', 'date', 'dinner',
    'fitness', 'workout', 'gym',
    'yoga', 'meditation', 'relaxation'
  ];
  
  // Check for event type matches
  eventTypes.forEach(type => {
    if (text.includes(type)) {
      keywords.push(type);
    }
  });
  
  // Extract individual words (3+ characters)
  const words = text.split(/\s+/).filter(w => w.length >= 3);
  keywords.push(...words);
  
  // Remove duplicates
  return [...new Set(keywords)];
}

/**
 * Map keywords to Spotify genres
 */
export function mapKeywordsToGenres(keywords: string[]): string[] {
  const genreMap: Record<string, string[]> = {
    // Pool/Beach/Summer
    'pool party': ['tropical house', 'summer', 'dance pop', 'pool party'],
    'pool': ['tropical house', 'summer', 'dance pop'],
    'beach': ['tropical house', 'summer', 'reggae', 'calypso'],
    'summer': ['summer', 'dance pop', 'tropical house', 'pop'],
    'tropical': ['tropical house', 'reggae', 'calypso', 'dancehall'],
    
    // Wedding/Romantic
    'wedding': ['wedding', 'romantic', 'ballad', 'love songs', 'r&b'],
    'marriage': ['wedding', 'romantic', 'ballad'],
    'ceremony': ['wedding', 'classical', 'romantic'],
    'reception': ['wedding', 'dance pop', 'party'],
    'romantic': ['romantic', 'r&b', 'ballad', 'love songs'],
    'date': ['romantic', 'r&b', 'jazz', 'soul'],
    'dinner': ['jazz', 'soul', 'romantic', 'ambient'],
    
    // Corporate/Business
    'corporate': ['corporate', 'background', 'ambient', 'instrumental'],
    'business': ['corporate', 'background', 'ambient'],
    'office': ['corporate', 'background', 'ambient', 'instrumental'],
    'professional': ['corporate', 'background', 'ambient'],
    
    // Party/Club
    'club': ['house', 'techno', 'edm', 'dance'],
    'nightclub': ['house', 'techno', 'edm', 'dance'],
    'dance': ['dance', 'house', 'edm', 'dance pop'],
    'party': ['party', 'dance pop', 'house', 'edm'],
    
    // Festival/Concert
    'festival': ['edm', 'house', 'techno', 'dance'],
    'concert': ['rock', 'pop', 'indie', 'alternative'],
    'live': ['live', 'acoustic', 'folk', 'indie'],
    
    // Fitness
    'fitness': ['workout', 'electronic', 'hip hop', 'edm'],
    'workout': ['workout', 'electronic', 'hip hop', 'edm'],
    'gym': ['workout', 'electronic', 'hip hop', 'edm'],
    
    // Relaxation
    'yoga': ['ambient', 'meditation', 'chill', 'instrumental'],
    'meditation': ['ambient', 'meditation', 'chill', 'instrumental'],
    'relaxation': ['ambient', 'chill', 'instrumental', 'meditation'],
    
    // Celebration
    'birthday': ['party', 'dance pop', 'pop', 'celebration'],
    'anniversary': ['romantic', 'ballad', 'love songs', 'r&b'],
    'celebration': ['party', 'dance pop', 'celebration', 'pop']
  };
  
  const genres = new Set<string>();
  
  keywords.forEach(keyword => {
    const mapped = genreMap[keyword.toLowerCase()];
    if (mapped) {
      mapped.forEach(g => genres.add(g));
    }
  });
  
  // Return up to 5 genres (Spotify API limit)
  return Array.from(genres).slice(0, 5);
}

/**
 * Calculate theme match score (0-100) for a track based on event information
 */
export function calculateThemeMatch(track: TrackInfo, eventInfo: EventInfo): number {
  if (!eventInfo.theme && !eventInfo.name && !eventInfo.description) {
    return 50; // Default score if no event info
  }
  
  const eventKeywords = extractEventKeywords(eventInfo);
  const trackText = [
    track.name || '',
    track.artist || '',
    track.album || '',
    ...(track.genres || [])
  ].join(' ').toLowerCase();
  
  // Calculate keyword overlap
  let keywordMatches = 0;
  eventKeywords.forEach(keyword => {
    if (trackText.includes(keyword.toLowerCase())) {
      keywordMatches++;
    }
  });
  
  const keywordScore = eventKeywords.length > 0
    ? (keywordMatches / eventKeywords.length) * 100
    : 0;
  
  // Calculate genre similarity
  const eventGenres = mapKeywordsToGenres(eventKeywords);
  let genreMatches = 0;
  if (track.genres && track.genres.length > 0) {
    eventGenres.forEach(eventGenre => {
      if (track.genres!.some(trackGenre => 
        trackGenre.toLowerCase().includes(eventGenre.toLowerCase()) ||
        eventGenre.toLowerCase().includes(trackGenre.toLowerCase())
      )) {
        genreMatches++;
      }
    });
  }
  
  const genreScore = eventGenres.length > 0
    ? (genreMatches / eventGenres.length) * 100
    : 0;
  
  // Weighted combination
  // Theme (40%) + Description (30%) + Name (30%) for keyword matching
  // Genre matching gets 40% weight
  const finalScore = (keywordScore * 0.6) + (genreScore * 0.4);
  
  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, Math.round(finalScore)));
}

/**
 * Generate passion description based on match criteria
 */
export function generatePassionDescription(
  themeMatch: number,
  synergyScore: number,
  popularity: number
): string {
  const descriptions: string[] = [];
  
  if (themeMatch >= 90) {
    descriptions.push('Perfect theme match');
  } else if (themeMatch >= 80) {
    descriptions.push('Excellent theme fit');
  } else if (themeMatch >= 70) {
    descriptions.push('Strong theme match');
  }
  
  if (synergyScore >= 0.8) {
    descriptions.push('Musically compatible');
  } else if (synergyScore >= 0.6) {
    descriptions.push('Good musical flow');
  }
  
  if (popularity >= 20 && popularity <= 40) {
    descriptions.push('Hidden gem');
  } else if (popularity <= 60) {
    descriptions.push('Under the radar');
  }
  
  if (descriptions.length === 0) {
    return 'Safe creative choice that fits the vibe';
  }
  
  return descriptions.join('. ') + '.';
}


