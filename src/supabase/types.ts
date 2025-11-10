export type PriceTier = 'entry' | 'mid' | 'premium';
export type PricePackageScope = 'ceremony' | 'reception' | 'afterparty' | 'custom';
export type AvailabilityOption = 'Weekend' | 'Weeknight' | 'Short Notice';

export interface DJProfileRecord {
  id: string;
  stage_name: string;
  legal_name: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  price_tier: PriceTier;
  price_min: number | null;
  price_max: number | null;
  biography: string | null;
  response_time: string | null;
  next_available_date: string | null;
  demographic_focus: string[];
  event_types: string[];
  availability: AvailabilityOption[];
  vibe_keywords: string[];
  qrate_overall: number | null;
  engagement_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface DJPricePackageRecord {
  id: string;
  profile_id: string;
  name: string;
  description: string | null;
  scope: PricePackageScope;
  price_range: string | null;
  is_featured: boolean;
  sort_index: number;
  created_at: string;
  updated_at: string;
}

export interface DJMediaAssetRecord {
  id: string;
  profile_id: string;
  media_url: string;
  thumbnail_url: string | null;
  media_type: 'photo' | 'video';
  caption: string | null;
  sort_index: number;
  created_at: string;
}

export interface DJHighlightRecord {
  id: string;
  profile_id: string;
  title: string;
  detail: string | null;
  highlight_type: string;
  sort_index: number;
  created_at: string;
}

export interface DJVibeSpecializationRecord {
  profile_id: string;
  label: string;
  percentage: number;
  sort_index: number;
  created_at: string;
}

export interface DJCrowdMetricRecord {
  profile_id: string;
  metric_date: string;
  guest_connection_rate: number;
  tip_volume_percentile: number;
  playlist_rating: number;
  gigs_completed: number;
  created_at: string;
}

export interface DJBookingRequestRecord {
  id: string;
  dj_profile_id: string;
  host_id: string;
  event_name: string | null;
  event_date: string | null;
  event_city: string | null;
  requested_budget: number | null;
  status: 'new' | 'reviewing' | 'quoted' | 'declined' | 'confirmed' | 'completed';
  vibe_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DJBookingMessageRecord {
  id: string;
  booking_request_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

export interface HostSavedDJRecord {
  host_id: string;
  dj_profile_id: string;
  saved_at: string;
  notes: string | null;
}

export interface DJMarketplaceProfile extends DJProfileRecord {
  vibe_specializations: Array<{ label: string; percent: number }> | null;
  crowd_stats: {
    guest_connection: string;
    tip_volume: string;
    playlist_score: string;
  } | null;
  price_packages: Array<{ name: string; price_range: string | null; is_featured: boolean }> | null;
  highlights: Array<{ title: string; detail: string | null }> | null;
  media: Array<{ url: string; thumb: string | null; type: string }> | null;
}

