import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Beat } from '../types';

const LIKED_BEATS_STORAGE_KEY = 'beathaven_liked_beats_v1';

interface LikedBeatsContextValue {
  likedBeats: Beat[];
  likedCount: number;
  addLikedBeat: (beat: Beat) => void;
  upsertLikedBeat: (beat: Beat) => void;
  removeLikedBeat: (beatId: string) => void;
  toggleLikedBeat: (beat: Beat) => void;
  clearLikedBeats: () => void;
  isLikedBeat: (beatId: string) => boolean;
}

const LikedBeatsContext = createContext<LikedBeatsContextValue | null>(null);

const readStoredLikedBeats = (): Beat[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(LIKED_BEATS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Beat[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((beat) => beat?.id);
  } catch {
    return [];
  }
};

export const LikedBeatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedBeats, setLikedBeats] = useState<Beat[]>(readStoredLikedBeats);

  useEffect(() => {
    localStorage.setItem(LIKED_BEATS_STORAGE_KEY, JSON.stringify(likedBeats));
  }, [likedBeats]);

  const addLikedBeat = useCallback((beat: Beat) => {
    setLikedBeats((currentBeats) => {
      const alreadyLiked = currentBeats.some((currentBeat) => currentBeat.id === beat.id);
      if (alreadyLiked) {
        return currentBeats;
      }

      return [beat, ...currentBeats];
    });
  }, []);

  const upsertLikedBeat = useCallback((beat: Beat) => {
    setLikedBeats((currentBeats) => {
      const existingIndex = currentBeats.findIndex((currentBeat) => currentBeat.id === beat.id);
      if (existingIndex === -1) {
        return [beat, ...currentBeats];
      }

      const mergedBeat = { ...currentBeats[existingIndex], ...beat };
      const next = [...currentBeats];
      next[existingIndex] = mergedBeat;
      return next;
    });
  }, []);

  const removeLikedBeat = useCallback((beatId: string) => {
    setLikedBeats((currentBeats) => currentBeats.filter((beat) => beat.id !== beatId));
  }, []);

  const toggleLikedBeat = useCallback((beat: Beat) => {
    setLikedBeats((currentBeats) => {
      const isAlreadyLiked = currentBeats.some((currentBeat) => currentBeat.id === beat.id);
      if (isAlreadyLiked) {
        return currentBeats.filter((currentBeat) => currentBeat.id !== beat.id);
      }

      return [beat, ...currentBeats];
    });
  }, []);

  const clearLikedBeats = useCallback(() => {
    setLikedBeats([]);
  }, []);

  const isLikedBeat = useCallback(
    (beatId: string) => likedBeats.some((beat) => beat.id === beatId),
    [likedBeats],
  );

  const value = useMemo<LikedBeatsContextValue>(
    () => ({
      likedBeats,
      likedCount: likedBeats.length,
      addLikedBeat,
      upsertLikedBeat,
      removeLikedBeat,
      toggleLikedBeat,
      clearLikedBeats,
      isLikedBeat,
    }),
    [addLikedBeat, clearLikedBeats, isLikedBeat, likedBeats, removeLikedBeat, toggleLikedBeat, upsertLikedBeat],
  );

  return <LikedBeatsContext.Provider value={value}>{children}</LikedBeatsContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLikedBeats = (): LikedBeatsContextValue => {
  const context = useContext(LikedBeatsContext);

  if (!context) {
    throw new Error('useLikedBeats must be used within a LikedBeatsProvider.');
  }

  return context;
};
