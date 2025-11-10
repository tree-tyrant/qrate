import { useCallback, useEffect, useRef, useState } from 'react';

export interface PreviewOptions {
  id: string;
  url: string;
  startAtMs?: number;
  playMs?: number;
  volume?: number;
}

export interface PreviewState {
  currentId?: string;
  isPlaying: boolean;
  isLoading: boolean;
  progressMs: number;
  durationMs?: number;
  error?: string;
}

const DEFAULT_CLIP_DURATION = 20000;
const MIN_TAIL_MS = 5000;

/**
 * Shared controller for audio previews so the DJ hears only one clip at a time.
 */
export function usePreviewController(defaultClipMs: number = DEFAULT_CLIP_DURATION) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<PreviewState>({
    isPlaying: false,
    isLoading: false,
    progressMs: 0,
  });
  const stateRef = useRef(state);

  const clearTimers = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const advanceProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !stateRef.current.isPlaying) {
      return;
    }
    setState((prev) =>
      prev.currentId
        ? {
            ...prev,
            progressMs: Math.round(audio.currentTime * 1000),
          }
        : prev,
    );
    rafRef.current = window.requestAnimationFrame(advanceProgress);
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      // Reset to beginning so the next play always seeks properly.
      audio.currentTime = 0;
    }
    setState({
      isPlaying: false,
      isLoading: false,
      progressMs: 0,
      currentId: undefined,
      durationMs: stateRef.current.durationMs,
      error: undefined,
    });
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
    }
    return audioRef.current!;
  }, []);

  const play = useCallback(
    async (options: PreviewOptions) => {
      if (!options.url) {
        setState({
          currentId: options.id,
          isPlaying: false,
          isLoading: false,
          progressMs: 0,
          durationMs: undefined,
          error: 'No preview available for this track.',
        });
        return;
      }

      const audio = ensureAudio();

      // If the same preview is already playing, stop it (toggle behavior).
      if (stateRef.current.currentId === options.id && (stateRef.current.isPlaying || stateRef.current.isLoading)) {
        stop();
        return;
      }

      clearTimers();

      setState({
        currentId: options.id,
        isPlaying: false,
        isLoading: true,
        progressMs: options.startAtMs ?? 0,
        durationMs: stateRef.current.durationMs,
        error: undefined,
      });

      stateRef.current = {
        currentId: options.id,
        isPlaying: false,
        isLoading: true,
        progressMs: options.startAtMs ?? 0,
        durationMs: undefined,
        error: undefined,
      };

      const loadAudio = () =>
        new Promise<void>((resolve, reject) => {
          const handleLoaded = () => {
            audio.removeEventListener('loadedmetadata', handleLoaded);
            audio.removeEventListener('error', handleError);
            resolve();
          };

          const handleError = () => {
            audio.removeEventListener('loadedmetadata', handleLoaded);
            audio.removeEventListener('error', handleError);
            reject(new Error('Failed to load preview audio.'));
          };

          audio.addEventListener('loadedmetadata', handleLoaded);
          audio.addEventListener('error', handleError);

          if (audio.src !== options.url) {
            audio.src = options.url;
          }

          // Reload the element to ensure metadata updates when reusing the same src.
          audio.load();
        });

      try {
        await loadAudio();

        const durationMs = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.duration * 1000) : undefined;
        const safeDuration = durationMs && durationMs > MIN_TAIL_MS ? durationMs - MIN_TAIL_MS : durationMs;
        const requestedStart = options.startAtMs ?? 0;
        const clampedStart = safeDuration ? Math.min(requestedStart, Math.max(0, safeDuration)) : Math.max(0, requestedStart);
        const clipLength = Math.min(options.playMs ?? defaultClipMs, durationMs ?? options.playMs ?? defaultClipMs);

        audio.currentTime = clampedStart / 1000;
        audio.volume = options.volume ?? 1;

        await audio.play();

        setState({
          currentId: options.id,
          isPlaying: true,
          isLoading: false,
          progressMs: clampedStart,
          durationMs,
          error: undefined,
        });

        stateRef.current = {
          currentId: options.id,
          isPlaying: true,
          isLoading: false,
          progressMs: clampedStart,
          durationMs,
          error: undefined,
        };

        rafRef.current = window.requestAnimationFrame(advanceProgress);
        stopTimerRef.current = window.setTimeout(() => {
          stop();
        }, clipLength);
      } catch (error) {
        console.error('Preview playback error:', error);
        setState({
          currentId: options.id,
          isPlaying: false,
          isLoading: false,
          progressMs: 0,
          durationMs: undefined,
          error: error instanceof Error ? error.message : 'Preview failed to play.',
        });
        stateRef.current = {
          currentId: options.id,
          isPlaying: false,
          isLoading: false,
          progressMs: 0,
          durationMs: undefined,
          error: error instanceof Error ? error.message : 'Preview failed to play.',
        };
      }
    },
    [advanceProgress, defaultClipMs, ensureAudio, stop],
  );

  const toggle = useCallback(
    (options: PreviewOptions) => {
      if (stateRef.current.currentId === options.id && (stateRef.current.isPlaying || stateRef.current.isLoading)) {
        stop();
      } else {
        void play(options);
      }
    },
    [play, stop],
  );

  const isActive = useCallback(
    (id: string) => stateRef.current.currentId === id && stateRef.current.isPlaying,
    [],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const audio = ensureAudio();

    const handleEnded = () => {
      stop();
    };

    const handleError = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: 'Preview failed to play.',
      }));
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      stop();
      audio.pause();
      audio.src = '';
    };
  }, [ensureAudio, stop]);

  return {
    state,
    play,
    stop,
    toggle,
    isActive,
  };
}




