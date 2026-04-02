import React, { useCallback, useRef } from 'react';
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Music2,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

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

  // ── Progress bar click / drag ──────────────────────────────────────────────
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(ratio);
    },
    [seek],
  );

  // ── Volume bar click ───────────────────────────────────────────────────────
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

  // If no beat is loaded, render nothing (but keep the DOM so CSS transition works)
  const isVisible = currentBeat !== null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[300] transition-transform duration-500 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Progress bar — sits flush on top of the bar */}
      <div
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="relative h-1 w-full cursor-pointer bg-[#2a2a2a] hover:h-1.5 transition-all duration-150 group"
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Waveform-style glow track fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1ED760] to-[#7C5CFF] transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
        {/* Scrubber thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      {/* Main bar */}
      <div className="flex items-center gap-4 border-t border-[#1a1a1a] bg-[#0d0d0d]/95 px-4 py-3 backdrop-blur-2xl sm:px-6">

        {/* ─── Left: artwork + beat info ─────────────────────────────────── */}
        <div className="flex min-w-0 items-center gap-3 flex-1 sm:flex-[0_0_auto] sm:w-64">
          {/* Cover art / placeholder */}
          <div className="shrink-0 h-11 w-11 rounded-lg overflow-hidden border border-[#262626] bg-[#1a1a1a] flex items-center justify-center">
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

          {/* Animated bars (only when playing) */}
          <div className="hidden sm:flex items-end gap-[2px] h-5 shrink-0">
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
            <p className="truncate text-sm font-semibold text-white leading-tight">
              {currentBeat?.title ?? '—'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="truncate text-xs text-[#B3B3B3]">
                {currentBeat?.producerName ?? ''}
              </span>
              {currentBeat?.bpm && (
                <>
                  <span className="text-[#444]">·</span>
                  <span className="text-xs text-[#1ED760] font-medium shrink-0">
                    {currentBeat.bpm} BPM
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── Center: controls + time ───────────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center gap-1.5">
          {/* Transport buttons */}
          <div className="flex items-center gap-4">
            <button
              className="text-[#6B7280] hover:text-white transition-colors duration-150"
              aria-label="Previous"
            >
              <SkipBack size={18} />
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_0_16px_rgba(30,215,96,0.35)] hover:scale-105 active:scale-95 transition-transform duration-150"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>

            <button
              className="text-[#6B7280] hover:text-white transition-colors duration-150"
              aria-label="Next"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Time display (hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#6B7280] font-mono">
            <span>{formatTime(currentTime)}</span>
            <span className="text-[#333]">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* ─── Right: volume + close ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 sm:gap-4 sm:w-64 justify-end">
          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={toggleMute} aria-label="Toggle mute" className="text-[#6B7280] hover:text-white transition-colors">
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div
              ref={volumeBarRef}
              onClick={handleVolumeClick}
              className="relative h-1 w-20 cursor-pointer rounded-full bg-[#2a2a2a] hover:h-1.5 transition-all duration-150 group"
              role="slider"
              aria-label="Volume"
              aria-valuenow={Math.round(volume * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#7C5CFF] group-hover:bg-[#1ED760] transition-colors duration-300"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>

          {/* Buy / price button */}
          {currentBeat?.price != null && (
            <button className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#7C5CFF] bg-[#7C5CFF]/10 px-3.5 py-1.5 text-xs font-semibold text-[#c4b5fd] hover:bg-[#7C5CFF]/25 transition-colors duration-150 shrink-0">
              ₹{currentBeat.price.toLocaleString('en-IN')}
            </button>
          )}

          {/* Close */}
          <button
            onClick={close}
            aria-label="Close player"
            className="text-[#4B4B4B] hover:text-white transition-colors duration-150"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BeatPreviewPlayer;
