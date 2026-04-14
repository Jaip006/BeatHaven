import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  FileText,
  Heart,
  MoreVertical,
  Music2,
  Pause,
  Play,
  Plus,
  Share2,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
  XIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import PriceButton from '../ui/PriceButton';
import { useLikedBeats } from '../../context/LikedBeatsContext';
import type { Beat } from '../../types';
import { authFetch } from '../../utils/authFetch';
import { useDownloads } from '../../context/DownloadsContext';
import LicensePurchaseModal from '../ui/LicensePurchaseModal';
import { getAuthSession } from '../../utils/auth';

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const isFreeMp3Enabled = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
};

type LyricsSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const resolveLyricsTitle = (title: string) => title.trim() || 'Untitled';

const BeatPreviewPlayer: React.FC = () => {
  const {
    currentBeat,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    close,
  } = usePlayer();
  const { isLikedBeat, toggleLikedBeat } = useLikedBeats();
  const { addDownload } = useDownloads();
  const navigate = useNavigate();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isDownloadTermsOpen, setIsDownloadTermsOpen] = useState(false);
  const [downloadTermsAccepted, setDownloadTermsAccepted] = useState(false);
  const [isDownloadSubmitting, setIsDownloadSubmitting] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptCopy, setAuthPromptCopy] = useState<{ title: string; message: string }>({
    title: 'Sign in required',
    message: 'Please sign in to continue.',
  });
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState('');
  const [lyricsSongs, setLyricsSongs] = useState<Array<{ id: string; title: string; lyrics: string; updatedAt: number }>>([]);
  const [lyricsSelectedId, setLyricsSelectedId] = useState('');
  const [isCreatingLyrics, setIsCreatingLyrics] = useState(false);
  const [lyricsSaveStatus, setLyricsSaveStatus] = useState<Record<string, LyricsSaveStatus>>({});
  const lyricsRequestIdRef = useRef(0);
  const lyricsLastSavedRef = useRef<Record<string, { title: string; lyrics: string }>>({});
  const lyricsSongsRef = useRef(lyricsSongs);
  const lyricsSaveVersionRef = useRef<Record<string, number>>({});
  const lyricsSaveTimersRef = useRef<Record<string, number>>({});

  const selectedLyricsSong = lyricsSongs.find((song) => song.id === lyricsSelectedId) ?? null;

  useEffect(() => {
    lyricsSongsRef.current = lyricsSongs;
  }, [lyricsSongs]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(ratio);
    },
    [seek],
  );

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!volumeBarRef.current) return;
      const rect = volumeBarRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setVolume(ratio);
    },
    [setVolume],
  );

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 0.8);
  };

  const isVisible = currentBeat !== null;
  const isCurrentBeatLiked = currentBeat ? isLikedBeat(currentBeat.id) : false;
  const isCurrentBeatDownloadable = isFreeMp3Enabled(currentBeat?.freeMp3Enabled);

  const mappedCurrentBeat: Beat | null = currentBeat
    ? {
      id: currentBeat.id,
      title: currentBeat.title,
      producerName: currentBeat.producerName,
      producerId: '',
      genre: currentBeat.genre ?? 'Unknown',
      bpm: currentBeat.bpm ?? 0,
      key: 'N/A',
      price: currentBeat.price ?? 0,
      coverImage: currentBeat.coverImage ?? '',
      audioUrl: currentBeat.audioUrl,
      tags: [],
      plays: 0,
      likes: 0,
    }
    : null;

  const handlePriceClick = () => {
    if (!mappedCurrentBeat) {
      return;
    }

    if (!getAuthSession()) {
      setAuthPromptCopy({
        title: 'Sign in required',
        message: 'Please sign in or create an account to purchase beats.',
      });
      setIsAuthPromptOpen(true);
      return;
    }

    setIsLicenseModalOpen(true);
  };

  const fetchLyricsSongs = useCallback(async () => {
    const requestId = lyricsRequestIdRef.current + 1;
    lyricsRequestIdRef.current = requestId;

    setLyricsLoading(true);
    setLyricsError('');

    try {
      const res = await authFetch('/lyrics');
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(String(data?.message ?? 'Failed to load lyrics.'));
      }

      const rawSongs = (data?.data?.songs ?? []) as Array<{
        id: string;
        title: string;
        lyrics: string;
        updatedAt: string;
      }>;

      if (lyricsRequestIdRef.current !== requestId) {
        return;
      }

      const hydrated = rawSongs
        .map((song) => ({
          id: String(song.id ?? '').trim(),
          title: String(song.title ?? 'Untitled'),
          lyrics: String(song.lyrics ?? ''),
          updatedAt: Date.parse(String(song.updatedAt ?? '')) || Date.now(),
        }))
        .filter((song) => Boolean(song.id))
        .sort((a, b) => b.updatedAt - a.updatedAt);

      setLyricsSongs(hydrated);
      setLyricsSelectedId(hydrated[0]?.id ?? '');
      lyricsLastSavedRef.current = hydrated.reduce(
        (acc, song) => {
          acc[song.id] = { title: song.title, lyrics: song.lyrics };
          return acc;
        },
        {} as Record<string, { title: string; lyrics: string }>,
      );
      setLyricsSaveStatus({});
    } catch (err) {
      if (lyricsRequestIdRef.current !== requestId) {
        return;
      }
      setLyricsSongs([]);
      setLyricsSelectedId('');
      setLyricsError(err instanceof Error ? err.message : 'Failed to load lyrics.');
    } finally {
      if (lyricsRequestIdRef.current === requestId) {
        setLyricsLoading(false);
      }
    }
  }, []);

  const saveLyricsSong = useCallback(async (songId: string) => {
    const song = lyricsSongsRef.current.find((item) => item.id === songId);
    if (!song) return;

    const version = (lyricsSaveVersionRef.current[songId] ?? 0) + 1;
    lyricsSaveVersionRef.current[songId] = version;
    setLyricsSaveStatus((prev) => ({ ...prev, [songId]: 'saving' }));

    try {
      const res = await authFetch(`/lyrics/${songId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: resolveLyricsTitle(song.title),
          lyrics: song.lyrics,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(String(data?.message ?? 'Failed to save lyrics.'));
      }

      const apiSong = data?.data?.song as { title?: string; lyrics?: string; updatedAt?: string } | undefined;
      const saved = {
        title: String(apiSong?.title ?? song.title),
        lyrics: String(apiSong?.lyrics ?? song.lyrics),
        updatedAt: Date.parse(String(apiSong?.updatedAt ?? '')) || Date.now(),
      };

      if (lyricsSaveVersionRef.current[songId] !== version) {
        return;
      }

      lyricsLastSavedRef.current[songId] = { title: saved.title, lyrics: saved.lyrics };
      setLyricsSongs((prev) =>
        prev
          .map((item) => (item.id === songId ? { ...item, ...saved } : item))
          .sort((a, b) => b.updatedAt - a.updatedAt),
      );
      setLyricsSaveStatus((prev) => ({ ...prev, [songId]: 'saved' }));

      window.setTimeout(() => {
        setLyricsSaveStatus((prev) => (prev[songId] === 'saved' ? { ...prev, [songId]: 'idle' } : prev));
      }, 1200);
    } catch {
      if (lyricsSaveVersionRef.current[songId] !== version) {
        return;
      }
      setLyricsSaveStatus((prev) => ({ ...prev, [songId]: 'error' }));
    }
  }, []);

  const updateLyricsSongLocal = useCallback((songId: string, patch: Partial<{ title: string; lyrics: string }>) => {
    setLyricsSongs((prev) =>
      prev.map((song) => (song.id === songId ? { ...song, ...patch } : song)),
    );
    setLyricsSaveStatus((prev) => ({ ...prev, [songId]: 'dirty' }));

    const existingTimer = lyricsSaveTimersRef.current[songId];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    lyricsSaveTimersRef.current[songId] = window.setTimeout(() => {
      void saveLyricsSong(songId);
    }, 800);
  }, [saveLyricsSong]);

  const createLyricsSong = useCallback(async () => {
    setIsCreatingLyrics(true);
    try {
      const res = await authFetch('/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', lyrics: '' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(String(data?.message ?? 'Failed to create lyric sheet.'));
      }

      const apiSong = data?.data?.song as { id?: string; title?: string; lyrics?: string; updatedAt?: string } | undefined;
      if (!apiSong?.id) {
        throw new Error('Failed to create lyric sheet.');
      }

      const createdSong = {
        id: String(apiSong.id),
        title: String(apiSong.title ?? 'Untitled'),
        lyrics: String(apiSong.lyrics ?? ''),
        updatedAt: Date.parse(String(apiSong.updatedAt ?? '')) || Date.now(),
      };

      lyricsLastSavedRef.current[createdSong.id] = { title: createdSong.title, lyrics: createdSong.lyrics };
      setLyricsSaveStatus((prev) => ({ ...prev, [createdSong.id]: 'idle' }));
      setLyricsSongs((prev) => [createdSong, ...prev].sort((a, b) => b.updatedAt - a.updatedAt));
      setLyricsSelectedId(createdSong.id);
    } catch (err) {
      setLyricsError(err instanceof Error ? err.message : 'Failed to create lyric sheet.');
    } finally {
      setIsCreatingLyrics(false);
    }
  }, []);

  const deleteLyricsSong = useCallback(async (songId: string) => {
    try {
      const res = await authFetch(`/lyrics/${songId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(String(data?.message ?? 'Failed to delete lyric sheet.'));
      }

      setLyricsSongs((prev) => {
        const next = prev.filter((song) => song.id !== songId);
        setLyricsSelectedId((prevSelected) => (prevSelected === songId ? next[0]?.id ?? '' : prevSelected));
        return next;
      });
      setLyricsSaveStatus((prev) => {
        const next = { ...prev };
        delete next[songId];
        return next;
      });
      delete lyricsLastSavedRef.current[songId];
    } catch (err) {
      setLyricsError(err instanceof Error ? err.message : 'Failed to delete lyric sheet.');
    }
  }, []);

  const openLyricsModal = useCallback(() => {
    setActionsMenuOpen(false);

    if (!getAuthSession()) {
      setAuthPromptCopy({
        title: 'Sign in required',
        message: 'Please sign in or create an account to view your saved lyrics.',
      });
      setIsAuthPromptOpen(true);
      return;
    }

    setIsLyricsModalOpen(true);
    void fetchLyricsSongs();
  }, [fetchLyricsSongs]);

  useEffect(() => {
    if (!isLyricsModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLyricsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLyricsModalOpen]);

  useEffect(() => {
    if (isLyricsModalOpen) {
      return undefined;
    }

    const pendingSongIds = Object.keys(lyricsSaveTimersRef.current);
    pendingSongIds.forEach((songId) => {
      window.clearTimeout(lyricsSaveTimersRef.current[songId]);
      void saveLyricsSong(songId);
    });
    lyricsSaveTimersRef.current = {};
    return undefined;
  }, [isLyricsModalOpen, saveLyricsSong]);

  const handleToggleLike = () => {
    if (!getAuthSession()) {
      setAuthPromptCopy({
        title: 'Sign in required',
        message: 'Please sign in or create an account to like beats.',
      });
      setIsAuthPromptOpen(true);
      return;
    }

    if (!mappedCurrentBeat) {
      return;
    }

    toggleLikedBeat(mappedCurrentBeat);
  };

  const showDownloadNotice = (tone: 'success' | 'error', message: string) => {
    setDownloadNotice({ tone, message });
  };

  const openDownloadTermsModal = () => {
    if (!getAuthSession()) {
      setAuthPromptCopy({
        title: 'Sign in required',
        message: 'Please sign in or create an account to download beats.',
      });
      setIsAuthPromptOpen(true);
      return;
    }

    if (!isCurrentBeatDownloadable) {
      showDownloadNotice('error', 'Download is not available for this beat.');
      return;
    }
    setActionsMenuOpen(false);
    setDownloadTermsAccepted(false);
    setIsDownloadTermsOpen(true);
  };

  const handleDownloadBeat = async () => {
    if (!currentBeat?.id) {
      showDownloadNotice('error', 'No beat is currently selected.');
      return;
    }

    setIsDownloadSubmitting(true);

    try {
      const response = await authFetch(`${import.meta.env.VITE_API_URL}/beats/${currentBeat.id}/download`, {
        method: 'POST',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data?.data?.downloadUrl) {
        showDownloadNotice('error', data?.message || 'Download is not available for this beat.');
        return;
      }

      const downloadUrl = String(data.data.downloadUrl);
      const rawTitle = String(data?.data?.title || currentBeat.title || 'beat');
      const safeTitle = rawTitle
        .split('')
        .filter((char) => {
          const code = char.charCodeAt(0);
          return code >= 0x20 && !/[<>:"/\\|?*]/.test(char);
        })
        .join('')
        .trim()
        .slice(0, 120) || 'beat';

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${safeTitle}.mp3`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addDownload({
        beatId: String(data?.data?.beatId ?? currentBeat.id),
        title: safeTitle,
        producerName: currentBeat.producerName || 'Unknown Producer',
        coverImage: currentBeat.coverImage ?? '',
        genre: String(data?.data?.genre ?? currentBeat.genre ?? 'Unknown'),
        bpm: Number(currentBeat.bpm ?? 0),
        key: String(data?.data?.key ?? 'N/A'),
      });

      showDownloadNotice('success', 'Download started.');
      setIsDownloadTermsOpen(false);
    } catch (error) {
      console.error('Failed to download beat', error);
      showDownloadNotice('error', 'Could not download this beat right now.');
    } finally {
      setIsDownloadSubmitting(false);
    }
  };

  useEffect(() => {
    if (!downloadNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDownloadNotice(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [downloadNotice]);

  return (
    <>
      <div
        className={`fixed inset-x-3 bottom-3 ${isLyricsModalOpen ? 'z-[1300]' : 'z-[300]'} overflow-hidden rounded-3xl border border-[#1f1f1f] shadow-[0_12px_34px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out sm:inset-x-0 sm:bottom-0 sm:rounded-none sm:border-0 sm:shadow-none ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="group relative h-1 w-full cursor-pointer bg-[#2a2a2a] transition-all duration-150 hover:h-1.5"
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1ED760] to-[#7C5CFF] transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 sm:h-3 sm:w-3"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

        <div className="flex items-center gap-2 bg-[#0d0d0d]/95 px-2.5 py-2.5 backdrop-blur-2xl sm:gap-4 sm:border-t sm:border-[#1a1a1a] sm:px-6 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:w-64 sm:flex-[0_0_auto] sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#262626] bg-[#1a1a1a] sm:h-11 sm:w-11 sm:rounded-lg">
            {currentBeat?.coverImage ? (
              <img
                src={currentBeat.coverImage}
                alt={currentBeat?.title ?? 'Beat'}
                className="h-full w-full object-cover"
              />
            ) : (
              <Music2 size={16} className="text-[#1ED760] sm:h-[18px] sm:w-[18px]" />
            )}
          </div>

          <div className="hidden h-5 shrink-0 items-end gap-[2px] sm:flex">
            {[0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
              <div
                key={i}
                className="w-[3px] rounded-sm bg-[#1ED760]"
                style={{
                  height: `${h * 100}%`,
                  animation: isPlaying
                    ? `pulse-glow ${0.9 + i * 0.15}s ease-in-out infinite`
                    : 'none',
                  opacity: isPlaying ? 1 : 0.25,
                }}
              />
            ))}
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight text-white sm:text-sm">
              {currentBeat?.title ?? '-'}
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="truncate text-[10px] text-[#B3B3B3] sm:text-xs">
                {currentBeat?.producerName ?? ''}
              </span>
              {currentBeat?.bpm && (
                <>
                  <span className="text-[#444]">|</span>
                  <span className="shrink-0 text-[10px] font-medium text-[#1ED760] sm:text-xs">
                    {currentBeat.bpm} BPM
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1 sm:gap-1.5">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              className="text-[#6B7280] transition-colors duration-150 hover:text-white"
              aria-label="Previous"
            >
              <SkipBack size={16} className="sm:h-[18px] sm:w-[18px]" />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-[0_0_16px_rgba(30,215,96,0.35)] transition-transform duration-150 hover:scale-105 active:scale-95 sm:h-10 sm:w-10"
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" className="sm:h-[18px] sm:w-[18px]" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5 sm:h-[18px] sm:w-[18px]" />
              )}
            </button>

            <button
              className="text-[#6B7280] transition-colors duration-150 hover:text-white"
              aria-label="Next"
            >
              <SkipForward size={16} className="sm:h-[18px] sm:w-[18px]" />
            </button>
          </div>

          <div className="hidden items-center gap-2 font-mono text-[11px] text-[#6B7280] sm:flex">
            <span>{formatTime(currentTime)}</span>
            <span className="text-[#333]">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            onClick={toggleMute}
            aria-label="Toggle mute"
            className="text-[#6B7280] transition-colors hover:text-white"
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div
            ref={volumeBarRef}
            onClick={handleVolumeClick}
            className="group relative h-1 w-20 cursor-pointer rounded-full bg-[#2a2a2a] transition-all duration-150 hover:h-1.5"
            role="slider"
            aria-label="Volume"
            aria-valuenow={Math.round(volume * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#7C5CFF] transition-colors duration-300 group-hover:bg-[#1ED760]"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>

        {!currentBeat?.isOwnedByCurrentUser ? (
          <PriceButton
            price={currentBeat?.price}
            onClick={handlePriceClick}
            showBuyText={false}
            className="px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm"
          />
        ) : null}

        <div className="hidden items-center gap-1.5 pl-2 sm:flex">
          <button
            type="button"
            aria-label="Share beat"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] transition-colors duration-150 hover:text-white"
          >
            <Share2 size={17} />
          </button>
          {isCurrentBeatDownloadable ? (
            <button
              type="button"
              aria-label="Download beat"
              onClick={openDownloadTermsModal}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] transition-colors duration-150 hover:text-white"
            >
              <Download size={17} />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Like beat"
            onClick={handleToggleLike}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150 hover:text-[#FF6FA1] ${
              isCurrentBeatLiked ? 'text-[#FF6FA1]' : 'text-[#6B7280]'
            }`}
          >
            <Heart size={17} fill={isCurrentBeatLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className="text-[#6B7280] transition-colors duration-150 hover:text-white"
            aria-label="Lyrics"
            onClick={openLyricsModal}
          >
            <FileText size={17} />
          </button>
        </div>

        <div className="relative sm:hidden" ref={actionsMenuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActionsMenuOpen((prev) => !prev);
            }}
            aria-label="More actions"
            className="rounded-full p-1 text-[#6B7280] transition-colors duration-150 hover:text-white"
          >
            <MoreVertical size={16} className="sm:h-[18px] sm:w-[18px]" />
          </button>
        </div>
        <button
          onClick={() => {
            setActionsMenuOpen(false);
            close();
          }}
          aria-label="Close player"
          className="text-[#6B7280] transition-colors duration-150 hover:text-white"
        >
          <XIcon size={16} className="sm:h-[18px] sm:w-[18px]" />
        </button>
        </div>
        {downloadNotice ? (
          <div
            className={`pointer-events-none absolute bottom-full right-3 mb-2 rounded-xl border px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.45)] ${
              downloadNotice.tone === 'success'
                ? 'border-[#1ED760]/40 bg-[#0F2217] text-[#DBFFE9]'
                : 'border-[#FF6B81]/40 bg-[#2A1015] text-[#FFD1D8]'
            }`}
          >
            {downloadNotice.message}
          </div>
        ) : null}
      </div>
      {isDownloadTermsOpen && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-3 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  if (isDownloadSubmitting) return;
                  setIsDownloadTermsOpen(false);
                }}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-[#252525] hover:text-white"
                aria-label="Close terms dialog"
              >
                <XIcon size={16} />
              </button>
              <label className="mt-1 flex items-start gap-2 rounded-xl p-1.5 text-left sm:gap-3 sm:p-2">
                <input
                  type="checkbox"
                  checked={downloadTermsAccepted}
                  onChange={(event) => setDownloadTermsAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border border-[#6B7280] bg-transparent text-[#5B10FF] focus:ring-[#5B10FF] sm:h-5 sm:w-5"
                  aria-label="Agree to download terms"
                />
                <span className="text-sm leading-relaxed text-[#D1D5DB] sm:text-lg">
                  I hereby acknowledge and agree that the MP3 music being made available for free
                  download and unlimited use, will only be used for non-commercial purposes such as
                  personal use and/or sharing on social media.
                </span>
              </label>
              <button
                type="button"
                onClick={() => void handleDownloadBeat()}
                disabled={!downloadTermsAccepted || isDownloadSubmitting}
                className="mt-3 w-full rounded-xl bg-[#4C1D95] px-4 py-2 text-base font-semibold text-[#D1D5DB] transition-all hover:bg-[#5B21B6] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-4 sm:py-2.5 sm:text-xl"
              >
                {isDownloadSubmitting ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>,
          document.body,
        )
        : null}
      {mappedCurrentBeat ? (
        <LicensePurchaseModal
          beat={mappedCurrentBeat}
          isOpen={isLicenseModalOpen}
          onClose={() => setIsLicenseModalOpen(false)}
        />
      ) : null}
      {isAuthPromptOpen && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setIsAuthPromptOpen(false)}>
            <div
              className="w-full max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#101010] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white">{authPromptCopy.title}</h3>
              <p className="mt-2 text-sm text-[#B3B3B3]">
                {authPromptCopy.message}
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/sign-up')}
                  className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-sm text-white transition-colors hover:bg-[#171717]"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/sign-in')}
                  className="rounded-lg bg-[#1ED760] px-3 py-2 text-sm font-semibold text-[#0B0B0B] transition-colors hover:bg-[#19c453]"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
      {isLyricsModalOpen && typeof document !== 'undefined'
        ? createPortal(
          <div
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-3 pb-28 backdrop-blur-sm sm:p-4 sm:pb-32"
            onClick={() => setIsLyricsModalOpen(false)}
          >
            <div
              className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#262626] px-4 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-white sm:text-xl">My Lyrics</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLyricsModalOpen(false);
                      navigate('/my-lyrics');
                    }}
                    className="hidden rounded-xl border border-[#2A2A2A] px-3 py-2 text-xs text-white transition-colors hover:bg-[#171717] sm:inline-flex"
                  >
                    Lyrics Page
                  </button>
                </div>
              </div>

              <div className="grid max-h-[50vh] min-h-[480px] grid-cols-1 lg:grid-cols-[320px_1fr] sm:min-h-[560px]">
                <aside className="border-b border-[#262626] bg-[#0B0B0B]/35 p-3 sm:p-4 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#121212] text-[#7C5CFF]">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Songs</h2>
                        <p className="text-xs text-[#9CA3AF]">{lyricsSongs.length} saved</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void createLyricsSong()}
                      disabled={isCreatingLyrics}
                      className="flex items-center gap-2 rounded-lg border border-[#1ED760]/30 bg-[#1ED760]/5 px-3 py-2 text-xs font-medium text-[#1ED760] transition-colors hover:bg-[#1ED760]/15 disabled:opacity-50"
                      aria-label="Create new lyrics"
                    >
                      <Plus size={16} />
                      New
                    </button>
                  </div>

                  <div className="mt-3 space-y-2 overflow-auto pr-1 lg:max-h-[calc(78vh-86px)]">
                    {lyricsLoading ? (
                      <div className="rounded-2xl border border-[#262626] bg-[#0B0B0B]/35 p-4 text-sm text-[#B3B3B3]">
                        Loading your lyrics...
                      </div>
                    ) : lyricsError ? (
                      <div className="rounded-2xl border border-[#3B1F1F] bg-[#0B0B0B]/35 p-4 text-sm text-[#FCA5A5]">
                        {lyricsError}
                      </div>
                    ) : lyricsSongs.length === 0 ? (
                      <div className="rounded-2xl border border-[#262626] bg-[#0B0B0B]/35 p-4 text-sm text-[#B3B3B3]">
                        No lyric sheets yet. Click the + button to create one.
                      </div>
                    ) : (
                      lyricsSongs.map((song) => (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => setLyricsSelectedId(song.id)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                            song.id === lyricsSelectedId
                              ? 'border-[#1ED760]/40 bg-[#121212] text-white'
                              : 'border-[#262626] bg-[#0B0B0B]/15 text-[#B3B3B3] hover:bg-[#121212]/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{song.title.trim() || 'Untitled'}</p>
                              <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                                {song.lyrics.trim() ? song.lyrics.trim().split('\n')[0] : 'No lyrics yet'}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs text-[#6B7280]">
                              {new Date(song.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </aside>

                <section className="p-4 sm:p-6">
                  {!selectedLyricsSong ? (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] text-[#7C5CFF]">
                        <FileText size={22} />
                      </div>
                      <h4 className="mt-4 text-xl font-bold text-white">Select a lyric sheet</h4>
                      <p className="mt-2 max-w-sm text-sm text-[#B3B3B3]">
                        Choose a title on the left to view your lyrics here.
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col">
                      <div className="min-w-0 mb-3">
                        <p className="text-xs uppercase tracking-[0.28em] text-[#9CA3AF]">Title</p>
                        <div className="mt-2 flex gap-3">
                          <input
                            value={selectedLyricsSong.title}
                            onChange={(event) => updateLyricsSongLocal(selectedLyricsSong.id, { title: event.target.value })}
                            className="min-w-0 flex-1 rounded-2xl border border-[#262626] bg-[#0B0B0B]/25 px-4 py-3 text-base font-semibold text-white outline-none transition-colors focus:border-[#1ED760]/45"
                            placeholder="Song title"
                          />
                          <button
                            type="button"
                            onClick={() => void deleteLyricsSong(selectedLyricsSong.id)}
                            className="flex shrink-0 items-center gap-1 rounded-lg border border-[#FCA5A5]/40 bg-[#FCA5A5]/5 px-3 py-1 text-xs font-medium text-[#FCA5A5] transition-colors hover:bg-[#FCA5A5]/15"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-[#6B7280]">
                          {lyricsSaveStatus[selectedLyricsSong.id] === 'saving' ? 'Saving...' : null}
                          {lyricsSaveStatus[selectedLyricsSong.id] === 'dirty' ? 'Unsaved changes' : null}
                          {lyricsSaveStatus[selectedLyricsSong.id] === 'saved' ? 'Saved' : null}
                          {lyricsSaveStatus[selectedLyricsSong.id] === 'error' ? 'Save failed' : null}
                        </div>
                      </div>
                      <label className="text-xs uppercase tracking-[0.28em] text-[#9CA3AF]">Lyrics</label>
                      <div className="mt-2 flex-1 overflow-hidden rounded-2xl border border-[#262626] bg-[#0B0B0B]/25 p-2">
                        <textarea
                          value={selectedLyricsSong.lyrics}
                          onChange={(event) => updateLyricsSongLocal(selectedLyricsSong.id, { lyrics: event.target.value })}
                          placeholder="Write your lyrics here..."
                          className="h-full min-h-[420px] w-full resize-none overflow-auto rounded-xl bg-transparent px-4 py-4 text-sm leading-relaxed text-white outline-none sm:min-h-[460px]"
                        />
                      </div>

                      <p className="mt-2 text-xs text-[#6B7280]">
                        Updated {new Date(selectedLyricsSong.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
      {actionsMenuOpen && typeof document !== 'undefined'
        ? createPortal(
          <div 
            className="fixed inset-0 z-[1200]" 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActionsMenuOpen(false);
              }
            }}
          >
            <div 
              className="absolute bottom-20 right-3 w-40 rounded-xl border border-[#262626] bg-[#101010] p-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLike();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
              >
                <Heart size={14} fill={isCurrentBeatLiked ? 'currentColor' : 'none'} className={isCurrentBeatLiked ? 'text-[#FF6FA1]' : ''} />
                {isCurrentBeatLiked ? 'Unlike' : 'Like'}
              </button>
              {isCurrentBeatDownloadable ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDownloadTermsModal();
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
                >
                  <Download size={14} />
                  Download
                </button>
              ) : null}
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  openLyricsModal();
                }}
              >
                <FileText size={14} />
                Lyrics
              </button>
            </div>
          </div>,
          document.body,
        )
        : null}
    </>
  );
};

export default BeatPreviewPlayer;
