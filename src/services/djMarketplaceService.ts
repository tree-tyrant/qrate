import { getSupabaseClient, isSupabaseConfigured } from '@/supabase/client';
import type {
  MarketplaceProfile,
  DJMediaItem,
  DJPricePackage,
  DJAnalyticsMetric,
  DJVibeSegment,
  DJBookingRequest,
  DJEarningsSummary
} from '@/utils/types';

type ProfileUpdate = Partial<MarketplaceProfile> & { id: string };

type ServiceResult<T> = {
  data: T;
  updatedAt: string;
};

function createMockProfile(djId: string): MarketplaceProfile {
  const isDemo = djId === 'demo-dj';
  return {
    id: djId,
    role: 'dj',
    email: `${djId}@example.com`,
    username: isDemo ? 'sonic-proof' : djId,
    displayName: isDemo ? 'DJ Proof' : 'New QRate DJ',
    avatarUrl: null,
    location: isDemo ? 'Atlanta, GA' : null,
    bio: isDemo
      ? 'High-energy DJ blending modern pop with nostalgic throwbacks. Veteran of 120+ QRate events.'
      : null,
    pricePackages: isDemo
      ? [
          { id: 'pkg-1', name: 'Signature Social', priceRange: '$600 - $850', description: '3 hours · Standard sound · Custom playlist prep', isFeatured: true },
          { id: 'pkg-2', name: 'Nightlife Experience', priceRange: '$950 - $1.4k', description: '4 hours · Club-grade lighting · Live mashups' }
        ]
      : [],
    specialties: isDemo ? ['Modern Pop', 'House', 'Afrobeats', 'Weddings'] : [],
    media: isDemo
      ? [
          {
            id: 'media-1',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
            thumbnailUrl: undefined,
            uploadedAt: new Date().toISOString(),
            description: 'Main stage highlight'
          }
        ]
      : [],
    availabilityWindow: isDemo ? 'Accepting bookings Apr - Sep 2025' : null,
    profileCompletedAt: isDemo ? new Date().toISOString() : null,
    onboardingStep: isDemo ? 'complete' : 'profile',
    metadata: {
      mock: true,
      featuredEvents: isDemo
        ? ['Spring Rooftop Session · 220 guests', 'Campus Glow Night · 180 guests']
        : [],
      calendarPreview: isDemo
        ? ['Mar 12 · Campus Glow Night · Confirmed', 'Mar 18 · Corporate Spring Social · Awaiting response']
        : []
    }
  };
}

function createMockVibeSegments(): DJVibeSegment[] {
  return [
    { label: 'Modern Pop', percent: 42 },
    { label: '90s Hip-Hop', percent: 28 },
    { label: 'House + EDM', percent: 18 },
    { label: 'Afrobeats', percent: 12 }
  ];
}

function createMockEngagementMetrics(): DJAnalyticsMetric[] {
  return [
    { name: 'Avg. Guest Connection', value: '65%', context: 'Guests who connect to your event' },
    { name: 'Avg. Tip Volume', value: '90th percentile', context: 'Compared to DJs in your region' },
    { name: 'Playlist Vibe-Check', value: '4.7 / 5', context: 'Average rating on published playlists' }
  ];
}

function createMockBookingRequests(): DJBookingRequest[] {
  return [
    { id: 'REQ-2031', title: 'Alpha Chi Mixer', date: 'Mar 22', location: 'Emory University', budget: '$750', status: 'New', eventType: 'College Mixer' },
    { id: 'REQ-2027', title: 'Corporate Spring Social', date: 'Mar 18', location: 'Ponce City Market', budget: '$1.2k', status: 'Reviewing', eventType: 'Corporate Social' },
    { id: 'REQ-1998', title: 'Sunset Rooftop Soirée', date: 'Apr 5', location: 'Midtown Atlanta', budget: '$900', status: 'New', eventType: 'Private Party' }
  ];
}

const MOCK_EARNINGS: DJEarningsSummary = {
  lifetime: '$18.4k',
  upcoming: '$2.1k',
  tips: '$3.6k',
  pendingPayout: '$680'
};

export async function fetchDJProfile(djId: string): Promise<ServiceResult<MarketplaceProfile>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: createMockProfile(djId), updatedAt: new Date().toISOString() };
  }

  const { data, error } = await supabase
    .from('dj_profiles')
    .select(
      `
        id,
        email,
        username,
        display_name,
        avatar_url,
        location,
        bio,
        specialties,
        availability_window,
        profile_completed_at,
        onboarding_step,
        metadata,
        price_packages,
        media
      `
    )
    .eq('id', djId)
    .maybeSingle();

  if (error || !data) {
    console.warn('Failed to fetch dj profile from Supabase, using mock:', error?.message);
    return { data: createMockProfile(djId), updatedAt: new Date().toISOString() };
  }

  const profile: MarketplaceProfile = {
    id: data.id,
    role: 'dj',
    email: data.email,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    location: data.location,
    bio: data.bio,
    specialties: data.specialties ?? [],
    availabilityWindow: data.availability_window,
    profileCompletedAt: data.profile_completed_at,
    onboardingStep: data.onboarding_step,
    metadata: data.metadata ?? undefined,
    pricePackages: (data.price_packages as DJPricePackage[] | null) ?? [],
    media: (data.media as DJMediaItem[] | null) ?? []
  };

  return { data: profile, updatedAt: new Date().toISOString() };
}

export async function updateDJProfile(update: ProfileUpdate): Promise<MarketplaceProfile> {
  const supabase = getSupabaseClient();

  if (!supabase || !isSupabaseConfigured) {
    return { ...createMockProfile(update.id), ...update };
  }

  const payload = {
    email: update.email,
    username: update.username,
    display_name: update.displayName,
    avatar_url: update.avatarUrl,
    location: update.location,
    bio: update.bio,
    specialties: update.specialties,
    availability_window: update.availabilityWindow,
    profile_completed_at: update.profileCompletedAt,
    onboarding_step: update.onboardingStep,
    metadata: update.metadata,
    price_packages: update.pricePackages,
    media: update.media
  };

  const { data, error } = await supabase
    .from('dj_profiles')
    .upsert({ id: update.id, ...payload })
    .select()
    .maybeSingle();

  if (error || !data) {
    console.error('Failed to update dj profile in Supabase:', error?.message);
    return { ...createMockProfile(update.id), ...update };
  }

  return {
    id: data.id,
    role: 'dj',
    email: data.email,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    location: data.location,
    bio: data.bio,
    specialties: data.specialties ?? [],
    availabilityWindow: data.availability_window,
    profileCompletedAt: data.profile_completed_at,
    onboardingStep: data.onboarding_step,
    metadata: data.metadata ?? undefined,
    pricePackages: (data.price_packages as DJPricePackage[] | null) ?? [],
    media: (data.media as DJMediaItem[] | null) ?? []
  };
}

export async function fetchDJAnalytics(djId: string): Promise<ServiceResult<{
  vibeSegments: DJVibeSegment[];
  engagementMetrics: DJAnalyticsMetric[];
  earnings: DJEarningsSummary;
}>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      data: {
        vibeSegments: createMockVibeSegments(),
        engagementMetrics: createMockEngagementMetrics(),
        earnings: MOCK_EARNINGS
      },
      updatedAt: new Date().toISOString()
    };
  }

  const { data, error } = await supabase
    .rpc('get_dj_marketplace_analytics', { dj_id: djId });

  if (error || !data) {
    console.warn('Falling back to mock analytics for dj marketplace:', error?.message);
    return {
      data: {
        vibeSegments: createMockVibeSegments(),
        engagementMetrics: createMockEngagementMetrics(),
        earnings: MOCK_EARNINGS
      },
      updatedAt: new Date().toISOString()
    };
  }

  return {
    data: {
      vibeSegments: (data.vibe_segments as DJVibeSegment[] | null) ?? createMockVibeSegments(),
      engagementMetrics: (data.engagement_metrics as DJAnalyticsMetric[] | null) ?? createMockEngagementMetrics(),
      earnings: (data.earnings_summary as DJEarningsSummary | null) ?? MOCK_EARNINGS
    },
    updatedAt: new Date().toISOString()
  };
}

export async function fetchDJBookingRequests(djId: string): Promise<ServiceResult<DJBookingRequest[]>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { data: createMockBookingRequests(), updatedAt: new Date().toISOString() };
  }

  const { data, error } = await supabase
    .from('dj_booking_requests')
    .select('id, title, event_date, location, budget_range, status, host_name, event_type, message_preview')
    .eq('dj_id', djId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) {
    console.warn('Falling back to mock booking requests:', error?.message);
    return { data: createMockBookingRequests(), updatedAt: new Date().toISOString() };
  }

  const mapped: DJBookingRequest[] = data.map((row) => ({
    id: row.id,
    title: row.title,
    date: row.event_date,
    location: row.location,
    budget: row.budget_range,
    status: row.status ?? 'New',
    hostName: row.host_name ?? undefined,
    eventType: row.event_type ?? undefined,
    messagePreview: row.message_preview ?? undefined
  }));

  return { data: mapped, updatedAt: new Date().toISOString() };
}
