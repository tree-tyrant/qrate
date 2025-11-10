import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tip, TipMessageType } from '../utils/types';
import { utils } from '../utils/api';
import { isTesterAccount } from '../utils/mockEventData';

export type TipSort =
  | 'Newest'
  | 'Biggest'
  | 'Crowd'
  | 'Theme';

interface UseTipJarArgs {
  eventId: string;
}

interface UseTipJarReturn {
  tips: Tip[];
  dismissedTips: Tip[];
  addedToQueueTips: Tip[];
  totalAllTime: number;
  totalToday: number;
  totalLocal: number;
  lastTip: { amount: number; guestName: string } | null;
  sort: TipSort;
  setSort: (s: TipSort) => void;
  filterType: 'all' | 'SHOUTOUT' | 'MESSAGE' | 'REQUEST' | 'dismissed';
  setFilterType: (f: 'all' | 'SHOUTOUT' | 'MESSAGE' | 'REQUEST' | 'dismissed') => void;
  addToQueue: (tip: Tip) => void;
  dismiss: (tipId: string) => void;
  restore: (tipId: string) => void;
  resetLocalTotal: () => void;
  newTipNotice: null | { amount: number; guestName: string };
  clearNewTipNotice: () => void;
}

const STORAGE_KEY = (eventId: string) => `qrate_tips_${eventId}`;
const LOCAL_RESET_KEY = (eventId: string) => `qrate_tips_resetBaseline_${eventId}`;

export function useTipJar({ eventId }: UseTipJarArgs): UseTipJarReturn {
  const [rawTips, setRawTips] = useState<Tip[]>([]);
  const [sort, setSort] = useState<TipSort>('Newest');
  const [filterType, setFilterType] = useState<'all' | 'SHOUTOUT' | 'MESSAGE' | 'REQUEST' | 'dismissed'>('all');
  const [newTipNotice, setNewTipNotice] = useState<null | { amount: number; guestName: string }>(null);
  const resetBaselineRef = useRef<number>(0);

  // Initialize reset baseline from storage
  useEffect(() => {
    const baseline = Number(utils.storage.get(LOCAL_RESET_KEY(eventId)) || 0);
    resetBaselineRef.current = isNaN(baseline) ? 0 : baseline;
  }, [eventId]);

  // Load tips and poll
  useEffect(() => {
    const load = () => {
      const storedTips: Tip[] = utils.storage.get(STORAGE_KEY(eventId)) || [];
      setRawTips(storedTips);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [eventId]);

  // Demo simulation for tester accounts (kept consistent with existing behavior)
  useEffect(() => {
    const isTester = isTesterAccount();
    if (!isTester) return;

    const simulateTip = () => {
      const existingTips: Tip[] = utils.storage.get(STORAGE_KEY(eventId)) || [];
      const mockTipTypes: Array<Partial<Tip> & { amount: number; guestName: string; messageType: TipMessageType }> = [
        { guestName: 'Sarah M.', amount: 15.0, message: 'Amazing vibes tonight! Keep it going! 🎉', messageType: 'MESSAGE' },
        { guestName: 'David R.', amount: 7.5, message: 'Can you play some Calvin Harris?', messageType: 'REQUEST', trackName: 'Summer', trackArtist: 'Calvin Harris', crowdScore: 92, themeMatch: 95 },
        { guestName: 'Lisa K.', amount: 10.0, message: "It's Jenny's 30th birthday! Shoutout please! 🎂", messageType: 'SHOUTOUT' },
      ];
      const randomTip = mockTipTypes[Math.floor(Math.random() * mockTipTypes.length)];
      const newTip: Tip = {
        id: `mock-tip-${Date.now()}`,
        eventId,
        message: '',
        timestamp: new Date().toISOString(),
        dismissed: false,
        djEarnings: randomTip.amount * 0.85,
        platformFee: randomTip.amount * 0.15,
        ...randomTip,
      } as Tip;
      const updatedTips = [...existingTips, newTip];
      utils.storage.set(STORAGE_KEY(eventId), updatedTips);
      setNewTipNotice({ amount: newTip.amount, guestName: newTip.guestName });
    };

    const interval = setInterval(() => {
      const randomDelay = 30000 + Math.random() * 30000;
      setTimeout(simulateTip, randomDelay);
    }, 45000);

    return () => clearInterval(interval);
  }, [eventId]);

  const allActiveTips = useMemo(() => rawTips.filter(t => t.message && !t.dismissed), [rawTips]);
  const dismissedTips = useMemo(() => rawTips.filter(t => t.dismissed), [rawTips]);
  const addedToQueueTips = useMemo(() => rawTips.filter(t => (t as any).addedToQueue), [rawTips]);

  const totalAllTime = useMemo(() => rawTips.reduce((sum, t) => sum + (t.amount || 0), 0), [rawTips]);

  const totalToday = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return rawTips
      .filter(t => new Date(t.timestamp).getTime() >= start)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [rawTips]);

  const totalLocal = useMemo(() => {
    return Math.max(0, totalAllTime - (resetBaselineRef.current || 0));
  }, [totalAllTime]);

  const lastTip = useMemo(() => {
    if (!rawTips.length) return null;
    const last = rawTips[rawTips.length - 1];
    return { amount: last.amount, guestName: last.guestName };
  }, [rawTips]);

  const sortedFilteredTips = useMemo(() => {
    let list = [...allActiveTips];
    switch (filterType) {
      case 'REQUEST':
      case 'MESSAGE':
      case 'SHOUTOUT':
        list = list.filter(t => t.messageType === filterType);
        break;
      case 'all':
      default:
        break;
    }
    list.sort((a, b) => {
      switch (sort) {
        case 'Biggest':
          return (b.amount || 0) - (a.amount || 0);
        case 'Crowd':
          return (b.crowdScore || 0) - (a.crowdScore || 0);
        case 'Theme':
          return (b.themeMatch || 0) - (a.themeMatch || 0);
        case 'Newest':
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });
    return list;
  }, [allActiveTips, sort, filterType]);

  const addToQueue = useCallback((tip: Tip) => {
    const allTips: Tip[] = utils.storage.get(STORAGE_KEY(eventId)) || [];
    const updatedTips = allTips.map(t => (t.id === tip.id ? { ...t, addedToQueue: true, dismissed: true } : t));
    utils.storage.set(STORAGE_KEY(eventId), updatedTips);
    setRawTips(updatedTips);
  }, [eventId]);

  const dismiss = useCallback((tipId: string) => {
    const allTips: Tip[] = utils.storage.get(STORAGE_KEY(eventId)) || [];
    const updatedTips = allTips.map(t => (t.id === tipId ? { ...t, dismissed: true } : t));
    utils.storage.set(STORAGE_KEY(eventId), updatedTips);
    setRawTips(updatedTips);
  }, [eventId]);

  const restore = useCallback((tipId: string) => {
    const allTips: Tip[] = utils.storage.get(STORAGE_KEY(eventId)) || [];
    const updatedTips = allTips.map(t => (t.id === tipId ? { ...t, dismissed: false } : t));
    utils.storage.set(STORAGE_KEY(eventId), updatedTips);
    setRawTips(updatedTips);
  }, [eventId]);

  const resetLocalTotal = useCallback(() => {
    resetBaselineRef.current = totalAllTime;
    utils.storage.set(LOCAL_RESET_KEY(eventId), String(totalAllTime));
  }, [eventId, totalAllTime]);

  return {
    tips: sortedFilteredTips,
    dismissedTips,
    addedToQueueTips,
    totalAllTime,
    totalToday,
    totalLocal,
    lastTip,
    sort,
    setSort,
    filterType,
    setFilterType,
    addToQueue,
    dismiss,
    restore,
    resetLocalTotal,
    newTipNotice,
    clearNewTipNotice: () => setNewTipNotice(null),
  };
}



