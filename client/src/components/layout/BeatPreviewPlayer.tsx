import React, { useCallback, useRef } from 'react';
import {
  Download,
  FileText,
  Heart,
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
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      <div className="flex items-center gap-4 border-t border-[#1a1a1a] bg-[#0d0d0d]/95 px-4 py-3 backdrop-blur-2xl sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:w-64 sm:flex-[0_0_auto]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#262626] bg-[#1a1a1a]">
            {currentBeat?.coverImage ? (
              <img
                src={currentBeat.coverImage}
                alt={currentBeat?.title ?? 'Beat'}
                className="h-full w-full object-cover"
              />
            ) : (
              <Music2 size={18} className="text-[#1ED760]" />
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
            <p className="truncate text-sm font-semibold leading-tight text-white">
              {currentBeat?.title ?? '-'}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="truncate text-xs text-[#B3B3B3]">
                {currentBeat?.producerName ?? ''}
              </span>
              {currentBeat?.bpm && (
                <>
                  <span className="text-[#444]">·</span>
                  <span className="shrink-0 text-xs font-medium text-[#1ED760]">
                    {currentBeat.bpm} BPM
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-3 sm:pl-4">
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
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] transition-colors duration-150 hover:text-white"
          >
            <Download size={17} />
          </button>
          <button
            type="button"
            aria-label="Like beat"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B7280] transition-colors duration-150 hover:text-[#FF6FA1]"
          >
            <Heart size={17} />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              className="text-[#6B7280] transition-colors duration-150 hover:text-white"
              aria-label="Previous"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_0_16px_rgba(30,215,96,0.35)] transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              className="text-[#6B7280] transition-colors duration-150 hover:text-white"
              aria-label="Next"
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="hidden items-center gap-2 font-mono text-[11px] text-[#6B7280] sm:flex">
            <span>{formatTime(currentTime)}</span>
            <span className="text-[#333]">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          className="text-[#6B7280] transition-colors duration-150 hover:text-white"
          aria-label="Lyrics"
        >
          <FileText size={17} />
        </button>

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

        <PriceButton price={currentBeat?.price} showBuyText={false} />
          <button
            onClick={close}
            aria-label="Close player"
            className="text-[#4B4B4B] transition-colors duration-150 hover:text-white"
          >
            <XIcon size={18} />
          </button>
      </div>
    </div>
  );
};

export default BeatPreviewPlayer;
