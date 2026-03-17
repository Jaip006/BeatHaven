import { useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseWaveformOptions {
  url?: string;
  onReady?: () => void;
  onFinish?: () => void;
}

export function useWaveform(containerRef: React.RefObject<HTMLDivElement | null>, options: UseWaveformOptions = {}) {
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const { url, onReady, onFinish } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#262626',
      progressColor: '#1ED760',
      cursorColor: '#22FFA3',
      barWidth: 2,
      barRadius: 2,
      height: 48,
      normalize: true,
      interact: true,
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => onReady?.());
    ws.on('finish', () => onFinish?.());

    if (url) {
      ws.load(url);
    }

    return () => {
      ws.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const play = useCallback(() => wavesurferRef.current?.play(), []);
  const pause = useCallback(() => wavesurferRef.current?.pause(), []);
  const playPause = useCallback(() => wavesurferRef.current?.playPause(), []);
  const stop = useCallback(() => wavesurferRef.current?.stop(), []);

  return { wavesurfer: wavesurferRef, play, pause, playPause, stop };
}
