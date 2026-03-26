import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useWaveform } from '../../hooks/useWaveform';

interface WaveformPlayerProps {
  audioUrl: string;
  trackTitle?: string;
}

const PLACEHOLDER_BARS = Array.from({ length: 40 }, (_, i) => `${20 + ((i * 17) % 61)}%`);

const WaveformPlayer: React.FC<WaveformPlayerProps> = ({ audioUrl, trackTitle }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { wavesurfer, playPause } = useWaveform(containerRef, {
    url: audioUrl,
    onReady: () => setIsReady(true),
    onFinish: () => setIsPlaying(false),
  });

  useEffect(() => {
    const ws = wavesurfer.current;
    if (!ws) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    ws.on('play', onPlay);
    ws.on('pause', onPause);
    return () => {
      ws.un('play', onPlay);
      ws.un('pause', onPause);
    };
  }, [wavesurfer]);

  const handlePlayPause = () => {
    playPause();
  };

  return (
    <div className="flex items-center gap-3 bg-[#121212] border border-[#262626] rounded-xl p-3">
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        disabled={!isReady}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-[#1ED760] text-[#0B0B0B] flex items-center justify-center hover:bg-[#22FFA3] transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>

      {/* Waveform */}
      <div className="flex-1 min-w-0">
        {trackTitle && (
          <p className="text-xs text-[#B3B3B3] mb-1 truncate">{trackTitle}</p>
        )}
        <div ref={containerRef} className="w-full" />
        {!isReady && (
          <div className="flex gap-0.5 items-end h-12">
            {PLACEHOLDER_BARS.map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-[#262626] rounded-sm"
                style={{ height }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Volume icon */}
      <Volume2 size={16} className="text-[#6B7280] flex-shrink-0" />
    </div>
  );
};

export default WaveformPlayer;
