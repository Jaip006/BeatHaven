import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import BeatCard from '../ui/BeatCard';
import { Button } from '../ui/Button';
import type { Beat } from '../../types';
import { API_BASE_URL } from '../../utils/apiBaseUrl';
import { trendingBeats as dummyBeats } from '../../data/trendingBeats';
import { usePlayer } from '../../context/PlayerContext';
import { authFetch } from '../../utils/authFetch';

const parseFreeMp3Enabled = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
};

const TrendingBeats: React.FC = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playBeat, currentBeat, togglePlay } = usePlayer();

  const handlePlayBeat = (beat: Beat) => {
    if (!beat.audioUrl) {
      console.warn('Preview is not available for this beat.');
      return;
    }

    if (currentBeat?.id === beat.id) {
      togglePlay();
      return;
    }

    playBeat({
      id: beat.id,
      title: beat.title,
      producerName: beat.producerName,
      coverImage: beat.coverImage,
      audioUrl: beat.audioUrl,
      bpm: beat.bpm,
      price: beat.price,
      genre: beat.genre,
      freeMp3Enabled: parseFreeMp3Enabled(beat.freeMp3Enabled),
    });

    void authFetch(`${API_BASE_URL}/beats/${beat.id}/play`, { method: 'POST' }).catch(() => null);
  };

  const fetchTrendingBeats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/beats/trending?limit=16&days=30`);
      const data = await response.json();

      if (!data.success || !data.data?.beats) {
        throw new Error(data.message || 'Failed to fetch trending beats');
      }

      // Fill remaining slots with dummy beats if needed
      const realBeats = data.data.beats;
      const allBeats = [
        ...realBeats,
        ...dummyBeats.slice(0, Math.max(0, 16 - realBeats.length))
      ].slice(0, 16);

      setBeats(allBeats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trending beats';
      setError(errorMessage);
      // Fallback to dummy beats on error
      setBeats(dummyBeats.slice(0, 16));
      console.error('Error fetching trending beats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTrendingBeats();

    // Refresh trending beats every 1 hour
    const interval = setInterval(() => {
      void fetchTrendingBeats();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
  return (
    <section id="trending" className="py-24 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-[#1ED760]" />
              <span className="text-sm font-semibold text-[#1ED760] uppercase tracking-widest">
                Right Now
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Trending Beats
            </h2>
            <p className="text-[#6B7280] mt-2">The hottest beats based on recent plays and likes</p>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5">
            View All <ArrowRight size={14} />
          </Button>
        </div>

        {/* Error State */}
        {error && !isLoading && beats.length === 0 && (
          <div className="rounded-2xl border border-[#3B1F1F] bg-[#0B0B0B]/50 p-6 text-center">
            <p className="text-[#FCA5A5]">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void fetchTrendingBeats()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {Array(16)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-[#121212] animate-pulse border border-[#262626]"
                />
              ))}
          </div>
        )}

        {/* Beats Grid */}
        {!isLoading && !error && beats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {beats.map((beat) => (
              <BeatCard key={beat.id} beat={beat} onPlay={handlePlayBeat} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && beats.length === 0 && (
          <div className="rounded-2xl border border-[#262626] bg-[#0B0B0B]/50 p-12 text-center">
            <p className="text-[#B3B3B3]">No trending beats found. Come back soon!</p>
          </div>
        )}

        <div className="flex justify-center mt-10 sm:hidden">
          <Button variant="secondary">View All Beats <ArrowRight size={14} /></Button>
        </div>
      </div>
    </section>
  );
};

export default TrendingBeats;
