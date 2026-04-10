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
  Share2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  XIcon,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import PriceButton from '../ui/PriceButton';
import { useLikedBeats } from '../../context/LikedBeatsContext';
import type { Beat } from '../../types';
import { authFetch } from '../../utils/authFetch';
import { useDownloads } from '../../context/DownloadsContext';

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

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

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isDownloadTermsOpen, setIsDownloadTermsOpen] = useState(false);
  const [downloadTermsAccepted, setDownloadTermsAccepted] = useState(false);
  const [isDownloadSubmitting, setIsDownloadSubmitting] = useState(false);

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

  const handleToggleLike = () => {
    if (!mappedCurrentBeat) {
      return;
    }

    toggleLikedBeat(mappedCurrentBeat);
  };

  const showDownloadNotice = (tone: 'success' | 'error', message: string) => {
    setDownloadNotice({ tone, message });
  };

  const openDownloadTermsModal = () => {
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
      const safeTitle = String(data?.data?.title || currentBeat.title || 'beat')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
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
    if (!actionsMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [actionsMenuOpen]);

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
        className={`fixed inset-x-0 bottom-0 z-[300] transition-transform duration-500 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
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

        <div className="flex items-center gap-2 border-t border-[#1a1a1a] bg-[#0d0d0d]/95 px-2.5 py-2.5 backdrop-blur-2xl sm:gap-4 sm:px-6 sm:py-3">
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
          <PriceButton price={currentBeat?.price} showBuyText={false} className="px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm" />
        ) : null}

        <div className="hidden items-center gap-1.5 pl-2 sm:flex">
          <button
            type="button"
            aria-label="Share beat"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] transition-colors duration-150 hover:text-white"
          >
            <Share2 size={17} />
          </button>
          <button
            type="button"
            aria-label="Download beat"
            onClick={openDownloadTermsModal}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] transition-colors duration-150 hover:text-white"
          >
            <Download size={17} />
          </button>
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
          >
            <FileText size={17} />
          </button>
        </div>

        <div className="relative sm:hidden" ref={actionsMenuRef}>
          <button
            type="button"
            onClick={() => setActionsMenuOpen((prev) => !prev)}
            aria-label="More actions"
            className="rounded-full p-1 text-[#6B7280] transition-colors duration-150 hover:text-white"
          >
            <MoreVertical size={16} className="sm:h-[18px] sm:w-[18px]" />
          </button>

          {actionsMenuOpen ? (
            <div className="absolute bottom-full right-0 mb-2 w-40 rounded-xl border border-[#262626] bg-[#101010] p-1.5 shadow-[0_14px_36px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                onClick={handleToggleLike}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
              >
                <Heart size={14} fill={isCurrentBeatLiked ? 'currentColor' : 'none'} className={isCurrentBeatLiked ? 'text-[#FF6FA1]' : ''} />
                {isCurrentBeatLiked ? 'Unlike' : 'Like'}
              </button>
              <button
                type="button"
                onClick={openDownloadTermsModal}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
              >
                <Download size={14} />
                Download
              </button>
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
              >
                <FileText size={14} />
                Lyrics
              </button>
            </div>
          ) : null}
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
    </>
  );
};

export default BeatPreviewPlayer;
