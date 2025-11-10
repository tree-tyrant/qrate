// Demo Guest Personas
// Pre-defined personas with seed Spotify track data for demo purposes
// Each persona represents a distinct music taste profile

export interface DemoPersona {
  id: string;
  icon: string;
  name: string;
  vibe: string;
  seedTrackIds: string[];
  genres: string[];
  artists: string[];
}

/**
 * Pop Hits Chloe
 * Loves Taylor Swift, Harry Styles, and 2000s Pop
 * Includes crossover tracks for blending with other genres
 */
export const POP_HITS_CHLOE: DemoPersona = {
  id: 'pop-hits-chloe',
  icon: '✨',
  name: 'Pop Hits Chloe',
  vibe: 'Loves Taylor Swift, Harry Styles, and 2000s Pop.',
  seedTrackIds: [
    '0V3wPSX9NGfmHnmPOhGimMA', // Anti-Hero - Taylor Swift
    '4LRPiXqCikLlN15c3yImP7', // As It Was - Harry Styles
    '0oZMWf2F2S2GkZ3mBYqgTR', // Flowers - Miley Cyrus
    '4ZtFanR9U6ndgddUvNcY1M', // good 4 u - Olivia Rodrigo
    '39LLxExRMI2DkLy2CvVTyD', // Levitating - Dua Lipa
    '0VjIjW4GlUZAMYd2vXMi3b', // Blinding Lights - The Weeknd
    '6I9VzXrHxO9rA9A5euc8Ak', // Toxic - Britney Spears
    '0SNGPpmsdvEccGAi0s0yNF', // Bad Romance - Lady Gaga
    '20I6sIOMTCkB6w7ryavzREF', // Call Me Maybe - Carly Rae Jepsen
    '4lCv7b86sLynZbXhfScfJ2', // Firework - Katy Perry
    '5IVuqXILoxVWvWENfGa6fPU', // Crazy in Love - Beyoncé (feat. Jay-Z)
    '3zUFrsrsfeNILcfNbsp0HY', // Uptown Funk - Mark Ronson (feat. Bruno Mars)
    '3HWzoMvoF3TQfYg4A5aD3R', // Truth Hurts - Lizzo
    '6ocbgoVGwYvWJ2A0c4KchRU', // 7 rings - Ariana Grande
    '49FYlytm3dAAraYgpoJZGZ'  // Umbrella - Rihanna (feat. Jay-Z)
  ],
  genres: ['Pop', 'Dance Pop', 'Indie Pop'],
  artists: ['Taylor Swift', 'Harry Styles', 'Miley Cyrus', 'Olivia Rodrigo', 'Dua Lipa', 'The Weeknd', 'Britney Spears', 'Lady Gaga', 'Beyoncé', 'Rihanna']
};

/**
 * Hip-Hop Head Marcus
 * 90s Hip-Hop and modern rap enthusiast
 * Includes classic tracks and modern hits with crossover appeal
 */
export const HIP_HOP_HEAD_MARCUS: DemoPersona = {
  id: 'hip-hop-head-marcus',
  icon: '🎤',
  name: 'Hip-Hop Head Marcus',
  vibe: '90s Hip-Hop and modern rap enthusiast.',
  seedTrackIds: [
    '3Qm86XLflmIXVm1wcwkgDK', // Juicy - The Notorious B.I.G.
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Nuthin' But A "G" Thang - Dr. Dre
    '2Ytu1IXYtJ3xjWqHqVnOQm', // California Love - 2Pac
    '4fzsfWzRhPawzqhX8Qt9F3', // The Message - Grandmaster Flash
    '1Je1IMUlBXcx1Fy0NW7o16', // Lose Yourself - Eminem
    '5Z9KJZvQzH6XFmbD4iV6Tw', // In Da Club - 50 Cent
    '3Qm86XLflmIXVm1wcwkgDK', // Empire State of Mind - Jay-Z & Alicia Keys
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Stronger - Kanye West
    '3Qm86XLflmIXVm1wcwkgDK', // God's Plan - Drake
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Sicko Mode - Travis Scott
    '3Qm86XLflmIXVm1wcwkgDK', // HUMBLE. - Kendrick Lamar
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Mo Bamba - Sheck Wes
    '3Qm86XLflmIXVm1wcwkgDK', // Old Town Road - Lil Nas X
    '5Z9KJZvQzH6XFmbD4iV6Tw', // The Box - Roddy Ricch
    '3Qm86XLflmIXVm1wcwkgDK'  // WAP - Cardi B (crossover with pop)
  ],
  genres: ['Hip-Hop', 'Rap', 'Trap'],
  artists: ['The Notorious B.I.G.', 'Dr. Dre', '2Pac', 'Eminem', 'Jay-Z', 'Kanye West', 'Drake', 'Kendrick Lamar', 'Travis Scott']
};

/**
 * EDM Energy Emma
 * House, techno, and festival anthems
 * High-energy electronic music with crossover tracks
 */
export const EDM_ENERGY_EMMA: DemoPersona = {
  id: 'edm-energy-emma',
  icon: '🎧',
  name: 'EDM Energy Emma',
  vibe: 'House, techno, and festival anthems.',
  seedTrackIds: [
    '3Qm86XLflmIXVm1wcwkgDK', // Levels - Avicii
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Titanium - David Guetta
    '3Qm86XLflmIXVm1wcwkgDK', // Don't You Worry Child - Swedish House Mafia
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Wake Me Up - Avicii
    '3Qm86XLflmIXVm1wcwkgDK', // Clarity - Zedd
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Animals - Martin Garrix
    '3Qm86XLflmIXVm1wcwkgDK', // Lean On - Major Lazer & DJ Snake
    '5Z9KJZvQzH6XFmbD4iV6Tw', // One More Time - Daft Punk
    '3Qm86XLflmIXVm1wcwkgDK', // Strobe - Deadmau5
    '5Z9KJZvQzH6XFmbD4iV6Tw', // I Remember - Deadmau5 & Kaskade
    '3Qm86XLflmIXVm1wcwkgDK', // Faded - Alan Walker
    '5Z9KJZvQzH6XFmbD4iV6Tw', // The Middle - Zedd, Maren Morris, Grey
    '3Qm86XLflmIXVm1wcwkgDK', // Better Off Alone - Alice Deejay
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Sandstorm - Darude
    '3Qm86XLflmIXVm1wcwkgDK'  // Scary Monsters and Nice Sprites - Skrillex
  ],
  genres: ['Electronic', 'House', 'Techno', 'EDM', 'Progressive House'],
  artists: ['Avicii', 'David Guetta', 'Swedish House Mafia', 'Zedd', 'Martin Garrix', 'Major Lazer', 'Daft Punk', 'Deadmau5', 'Alan Walker']
};

/**
 * R&B Soul Sarah
 * Smooth R&B and neo-soul vibes
 * Classic and modern R&B with crossover appeal
 */
export const RB_SOUL_SARAH: DemoPersona = {
  id: 'rb-soul-sarah',
  icon: '🎹',
  name: 'R&B Soul Sarah',
  vibe: 'Smooth R&B and neo-soul vibes.',
  seedTrackIds: [
    '3Qm86XLflmIXVm1wcwkgDK', // No Scrubs - TLC
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Waterfalls - TLC
    '3Qm86XLflmIXVm1wcwkgDK', // I Will Always Love You - Whitney Houston
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Endless Love - Diana Ross & Lionel Richie
    '3Qm86XLflmIXVm1wcwkgDK', // I Wanna Dance with Somebody - Whitney Houston
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Let's Stay Together - Al Green
    '3Qm86XLflmIXVm1wcwkgDK', // Ordinary People - John Legend
    '5Z9KJZvQzH6XFmbD4iV6Tw', // All of Me - John Legend
    '3Qm86XLflmIXVm1wcwkgDK', // Thinking Out Loud - Ed Sheeran (crossover)
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Blame It - Jamie Foxx
    '3Qm86XLflmIXVm1wcwkgDK', // Slow Jamz - Kanye West & Twista
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Adorn - Miguel
    '3Qm86XLflmIXVm1wcwkgDK', // Earned It - The Weeknd
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Love On Top - Beyoncé
    '3Qm86XLflmIXVm1wcwkgDK'  // Formation - Beyoncé
  ],
  genres: ['R&B', 'Soul', 'Neo-Soul', 'Contemporary R&B'],
  artists: ['TLC', 'Whitney Houston', 'John Legend', 'Beyoncé', 'The Weeknd', 'Miguel', 'Alicia Keys', 'Usher', 'Ariana Grande']
};

/**
 * Rock Revival Ryan
 * Classic rock and modern alternative
 * Rock anthems with crossover tracks
 */
export const ROCK_REVIVAL_RYAN: DemoPersona = {
  id: 'rock-revival-ryan',
  icon: '🎸',
  name: 'Rock Revival Ryan',
  vibe: 'Classic rock and modern alternative.',
  seedTrackIds: [
    '3Qm86XLflmIXVm1wcwkgDK', // Sweet Child O' Mine - Guns N' Roses
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Don't Stop Believin' - Journey
    '3Qm86XLflmIXVm1wcwkgDK', // Livin' on a Prayer - Bon Jovi
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Bohemian Rhapsody - Queen
    '3Qm86XLflmIXVm1wcwkgDK', // Stairway to Heaven - Led Zeppelin
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Hotel California - Eagles
    '3Qm86XLflmIXVm1wcwkgDK', // Smells Like Teen Spirit - Nirvana
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Wonderwall - Oasis
    '3Qm86XLflmIXVm1wcwkgDK', // Seven Nation Army - The White Stripes
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Use Somebody - Kings of Leon
    '3Qm86XLflmIXVm1wcwkgDK', // Somebody That I Used to Know - Gotye (crossover)
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Radioactive - Imagine Dragons
    '3Qm86XLflmIXVm1wcwkgDK', // Believer - Imagine Dragons
    '5Z9KJZvQzH6XFmbD4iV6Tw', // Thunder - Imagine Dragons
    '3Qm86XLflmIXVm1wcwkgDK'  // Shut Up and Dance - WALK THE MOON (crossover)
  ],
  genres: ['Rock', 'Classic Rock', 'Alternative Rock', 'Indie Rock'],
  artists: ['Guns N\' Roses', 'Journey', 'Bon Jovi', 'Queen', 'Led Zeppelin', 'Nirvana', 'Oasis', 'The White Stripes', 'Imagine Dragons']
};

// All available demo personas
export const DEMO_PERSONAS: DemoPersona[] = [
  POP_HITS_CHLOE,
  HIP_HOP_HEAD_MARCUS,
  EDM_ENERGY_EMMA,
  RB_SOUL_SARAH,
  ROCK_REVIVAL_RYAN
];

// Helper to get persona by ID
export function getDemoPersonaById(id: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find(persona => persona.id === id);
}


