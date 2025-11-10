import { getSupabaseClient } from '@/supabase/client';
import type {
  DJMarketplaceProfile,
  DJProfileRecord,
  DJPricePackageRecord,
  DJMediaAssetRecord,
  DJHighlightRecord,
  DJVibeSpecializationRecord,
  DJBookingRequestRecord
} from '@/supabase/types';

export interface MarketplaceFilterParams {
  location?: string;
  priceTier?: 'entry' | 'mid' | 'premium';
  vibeMatchGte?: number;
  engagementGte?: number;
  eventType?: string;
  demographic?: string;
  availability?: string;
}

export async function fetchMarketplaceProfiles(filters: MarketplaceFilterParams = {}): Promise<DJMarketplaceProfile[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase.from('dj_marketplace_profiles').select('*');

  if (filters.location) {
    query = query.ilike('location_city', `%${filters.location}%`);
  }
  if (filters.priceTier) {
    query = query.eq('price_tier', filters.priceTier);
  }
  if (typeof filters.vibeMatchGte === 'number') {
    query = query.gte('vibe_match_score', filters.vibeMatchGte);
  }
  if (typeof filters.engagementGte === 'number') {
    query = query.gte('engagement_rating', filters.engagementGte);
  }
  if (filters.eventType && filters.eventType !== 'any') {
    query = query.contains('event_types', [filters.eventType]);
  }
  if (filters.demographic && filters.demographic !== 'any') {
    query = query.contains('demographic_focus', [filters.demographic]);
  }
  if (filters.availability && filters.availability !== 'any') {
    query = query.contains('availability', [filters.availability]);
  }

  const { data, error } = await query.order('vibe_match_score', { ascending: false });
  if (error) {
    console.error('Failed to load marketplace profiles', error);
    return [];
  }
  return (data as DJMarketplaceProfile[]) ?? [];
}

export async function fetchDJProfileById(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('dj_profiles').select('*').eq('id', id).single();
  if (error) {
    console.error('Failed to load dj profile', error);
    return null;
  }
  return data as DJProfileRecord;
}

export async function upsertDJProfile(profile: Partial<DJProfileRecord>) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('dj_profiles').upsert(profile, { onConflict: 'id', defaultToNull: false }).select().single();
  if (error) {
    console.error('Failed to upsert dj profile', error);
    throw error;
  }
  return data as DJProfileRecord;
}

export async function updatePricePackages(profileId: string, packages: Partial<DJPricePackageRecord>[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const deleteResponse = await supabase.from('dj_price_packages').delete().eq('profile_id', profileId);
  if (deleteResponse.error) {
    console.error('Failed to reset price packages', deleteResponse.error);
    throw deleteResponse.error;
  }
  if (packages.length === 0) return;
  const payload = packages.map(pkg => ({ ...pkg, profile_id: profileId }));
  const { error } = await supabase.from('dj_price_packages').insert(payload);
  if (error) {
    console.error('Failed to insert price packages', error);
    throw error;
  }
}

export async function updateVibeSpecializations(profileId: string, vibes: Partial<DJVibeSpecializationRecord>[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error: delError } = await supabase.from('dj_vibe_specializations').delete().eq('profile_id', profileId);
  if (delError) {
    console.error('Failed to reset vibe specializations', delError);
    throw delError;
  }
  if (!vibes.length) return;
  const payload = vibes.map((vibe, index) => ({ profile_id: profileId, sort_index: index, ...vibe }));
  const { error } = await supabase.from('dj_vibe_specializations').insert(payload);
  if (error) {
    console.error('Failed to insert vibe specializations', error);
    throw error;
  }
}

export async function updateHighlights(profileId: string, highlights: Partial<DJHighlightRecord>[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from('dj_profile_highlights').delete().eq('profile_id', profileId);
  if (!highlights.length) return;
  const payload = highlights.map((highlight, index) => ({ profile_id: profileId, sort_index: index, ...highlight }));
  const { error } = await supabase.from('dj_profile_highlights').insert(payload);
  if (error) throw error;
}

export async function updateMedia(profileId: string, media: Partial<DJMediaAssetRecord>[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from('dj_profile_media').delete().eq('profile_id', profileId);
  if (!media.length) return;
  const payload = media.map((asset, index) => ({ profile_id: profileId, sort_index: index, ...asset }));
  const { error } = await supabase.from('dj_profile_media').insert(payload);
  if (error) throw error;
}

export async function createBookingRequest(payload: Omit<DJBookingRequestRecord, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: DJBookingRequestRecord['status'] }) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const insertPayload = { ...payload } as Partial<DJBookingRequestRecord>;
  const { data, error } = await supabase.from('dj_booking_requests').insert(insertPayload).select().single();
  if (error) {
    console.error('Failed to create booking request', error);
    throw error;
  }
  return data as DJBookingRequestRecord;
}

