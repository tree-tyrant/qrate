import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchDJProfile,
  updateDJProfile,
  fetchDJAnalytics,
  fetchDJBookingRequests
} from '@/services/djMarketplaceService';
import type {
  MarketplaceProfile,
  DJAnalyticsMetric,
  DJVibeSegment,
  DJBookingRequest,
  DJEarningsSummary,
  DJMediaItem,
  DJPricePackage
} from '@/utils/types';

interface UseDJMarketplaceReturn {
  loading: boolean;
  saving: boolean;
  profile: MarketplaceProfile | null;
  vibeSegments: DJVibeSegment[];
  engagementMetrics: DJAnalyticsMetric[];
  earnings: DJEarningsSummary | null;
  bookingRequests: DJBookingRequest[];
  lastSyncedAt: string | null;
  profileNeedsAttention: boolean;
  refresh: () => Promise<void>;
  updateProfile: (updates: Partial<MarketplaceProfile>) => Promise<void>;
}

const PROFILE_COMPLETION_FIELDS: Array<keyof MarketplaceProfile> = ['bio', 'pricePackages', 'media', 'specialties'];

export function useDJMarketplace(djId: string | null): UseDJMarketplaceReturn {
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
  const [vibeSegments, setVibeSegments] = useState<DJVibeSegment[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<DJAnalyticsMetric[]>([]);
  const [earnings, setEarnings] = useState<DJEarningsSummary | null>(null);
  const [bookingRequests, setBookingRequests] = useState<DJBookingRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!djId) return;
    setLoading(true);
    try {
      const [profileResult, analyticsResult, bookingResult] = await Promise.all([
        fetchDJProfile(djId),
        fetchDJAnalytics(djId),
        fetchDJBookingRequests(djId)
      ]);
      setProfile(profileResult.data);
      setVibeSegments(analyticsResult.data.vibeSegments);
      setEngagementMetrics(analyticsResult.data.engagementMetrics);
      setEarnings(analyticsResult.data.earnings);
      setBookingRequests(bookingResult.data);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      console.error('Failed to load DJ marketplace data:', error);
      toast.error('Unable to load your marketplace profile right now. Using cached data if available.');
    } finally {
      setLoading(false);
    }
  }, [djId]);

  useEffect(() => {
    if (!djId) {
      setLoading(false);
      return;
    }
    loadAll();
  }, [djId, loadAll]);

  const updateProfile = useCallback(async (updates: Partial<MarketplaceProfile>) => {
    if (!profile) return;
    setSaving(true);
    try {
      const optimistic: MarketplaceProfile = {
        ...profile,
        ...updates,
        pricePackages: updates.pricePackages ?? profile.pricePackages,
        media: updates.media ?? profile.media
      };
      setProfile(optimistic);

      const next = await updateDJProfile({ ...optimistic, id: profile.id });
      setProfile(next);
      toast.success('Profile updated');
    } catch (error) {
      console.error('Failed to update DJ profile:', error);
      toast.error('Could not save changes. Please try again.');
      await loadAll();
    } finally {
      setSaving(false);
    }
  }, [profile, loadAll]);

  const profileNeedsAttention = useMemo(() => {
    if (!profile) return true;
    return PROFILE_COMPLETION_FIELDS.some(field => {
      const value = profile[field];
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === null || value === undefined || value === '';
    });
  }, [profile]);

  return {
    loading,
    saving,
    profile,
    vibeSegments,
    engagementMetrics,
    earnings,
    bookingRequests,
    lastSyncedAt,
    profileNeedsAttention,
    refresh: loadAll,
    updateProfile
  };
}

export function buildUpdatedMediaList(
  existing: DJMediaItem[] | undefined,
  fresh: DJMediaItem
): DJMediaItem[] {
  const list = existing ? [...existing] : [];
  return [fresh, ...list.filter(item => item.id !== fresh.id)];
}

export function buildUpdatedPackages(
  existing: DJPricePackage[] | undefined,
  updates: DJPricePackage
): DJPricePackage[] {
  const list = existing ? [...existing] : [];
  const index = list.findIndex(pkg => pkg.id === updates.id);
  if (index >= 0) {
    list[index] = updates;
  } else {
    list.push(updates);
  }
  return list;
}
