import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

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

  return (
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

        <div className="relative" ref={actionsMenuRef}>
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
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#D1D5DB] transition-colors duration-150 hover:bg-[#161616] hover:text-white"
              >
                <Heart size={14} />
                Like
              </button>
              <button
                type="button"
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
    </div>
  );
};

export default BeatPreviewPlayer;
