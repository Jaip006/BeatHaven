import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getAuthSession, subscribeToAuthChanges } from '../utils/auth';

export interface PlayerBeat {
  id: string;
  title: string;
  producerName: string;
  coverImage?: string;
  audioUrl: string;
  bpm?: number;
  price?: number;
  genre?: string;
  isOwnedByCurrentUser?: boolean;
}

interface PlayerContextValue {
  currentBeat: PlayerBeat | null;
  isPlaying: boolean;
  progress: number;       // 0–1
  currentTime: number;    // seconds
  duration: number;       // seconds
  volume: number;         // 0–1
  playBeat: (beat: PlayerBeat) => void;
  togglePlay: () => void;
  seek: (ratio: number) => void;
  setVolume: (v: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentBeat, setCurrentBeat] = useState<PlayerBeat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  // Keep audio volume in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const playBeat = useCallback((beat: PlayerBeat) => {
    // If same beat is already loaded, just toggle
    if (audioRef.current && currentBeat?.id === beat.id) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    // Stop + replace existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    const audio = new Audio(beat.audioUrl);
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    setCurrentBeat(beat);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);

    void audio.play();
  }, [currentBeat, volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      void audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((ratio: number) => {
    if (!audioRef.current || !duration) return;
    const t = Math.max(0, Math.min(1, ratio)) * duration;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
    setProgress(ratio);
  }, [duration]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const close = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setCurrentBeat(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  useEffect(() => subscribeToAuthChanges(() => {
    if (!getAuthSession()) {
      close();
    }
  }), [close]);

  return (
    <PlayerContext.Provider
      value={{ currentBeat, isPlaying, progress, currentTime, duration, volume, playBeat, togglePlay, seek, setVolume, close }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
