import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import { Button } from '../components/ui/Button';
import BeatCard from '../components/ui/BeatCard';
import { useLikedBeats } from '../context/LikedBeatsContext';
import { usePlayer } from '../context/PlayerContext';
import { authFetch } from '../utils/authFetch';
import type { Beat } from '../types';

const parseFreeMp3Enabled = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
};

const LikedBeatsPage: React.FC = () => {
  const { likedBeats, likedCount, clearLikedBeats, upsertLikedBeat } = useLikedBeats();
  const { playBeat, currentBeat, togglePlay } = usePlayer();
  const refreshAttemptedRef = useRef<Set<string>>(new Set());

  const resolveBeatPreview = async (beatId: string): Promise<Beat | null> => {
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/beats/${beatId}/preview`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data?.data) {
        return null;
      }

      const apiBeat = data.data as Partial<Beat>;
      const rawTags = Array.isArray(apiBeat.tags) ? apiBeat.tags.map((tag) => String(tag ?? '').trim()).filter(Boolean) : [];
      const genreCandidate = String((apiBeat as Partial<Record<'genre', unknown>>).genre ?? '').trim();
      const beatTypeCandidate = String((apiBeat as Partial<Record<'beatType', unknown>>).beatType ?? '').trim();
      const resolvedGenre =
        (genreCandidate && genreCandidate.toLowerCase() !== 'unknown' ? genreCandidate : '') ||
        (beatTypeCandidate && beatTypeCandidate.toLowerCase() !== 'unknown' ? beatTypeCandidate : '') ||
        rawTags[0] ||
        'Unknown';

      return {
        id: String(apiBeat.id ?? beatId),
        title: String(apiBeat.title ?? 'Untitled Beat'),
        producerName: String(apiBeat.producerName ?? 'Unknown Producer'),
        producerId: String(apiBeat.producerId ?? ''),
        genre: resolvedGenre,
        bpm: Number(apiBeat.bpm ?? 0),
        key: String(apiBeat.key ?? ''),
        price: Number(apiBeat.price ?? 0),
        coverImage: String(apiBeat.coverImage ?? ''),
        audioUrl: String(apiBeat.audioUrl ?? ''),
        tags: rawTags,
        plays: Number(apiBeat.plays ?? 0),
        likes: Number(apiBeat.likes ?? 0),
        freeMp3Enabled: parseFreeMp3Enabled(apiBeat.freeMp3Enabled),
      };
    } catch {
      return null;
    }
  };

  const handlePlayBeat = async (beat: (typeof likedBeats)[number]) => {
    let playableBeat = beat;

    if (!playableBeat.audioUrl || typeof playableBeat.freeMp3Enabled !== 'boolean') {
      const resolvedBeat = await resolveBeatPreview(beat.id);
      if (!resolvedBeat?.audioUrl) {
        return;
      }
      upsertLikedBeat(resolvedBeat);
      playableBeat = resolvedBeat;
    }

    if (!playableBeat.audioUrl) {
      return;
    }

    if (currentBeat?.id === playableBeat.id) {
      togglePlay();
      return;
    }

    playBeat({
      id: playableBeat.id,
      title: playableBeat.title,
      producerName: playableBeat.producerName,
      coverImage: playableBeat.coverImage,
      audioUrl: playableBeat.audioUrl,
      bpm: playableBeat.bpm,
      price: playableBeat.price,
      genre: playableBeat.genre,
      freeMp3Enabled: parseFreeMp3Enabled(playableBeat.freeMp3Enabled),
    });

    void authFetch(`${import.meta.env.VITE_API_URL}/beats/${playableBeat.id}/play`, { method: 'POST' }).catch(() => null);
  };

  useEffect(() => {
    const beatsNeedingRefresh = likedBeats.filter(
      (beat) =>
        !refreshAttemptedRef.current.has(beat.id) &&
        (
        !beat.audioUrl ||
        !beat.key?.trim() ||
        !beat.genre?.trim() ||
        beat.genre.trim().toLowerCase() === 'unknown' ||
        typeof beat.freeMp3Enabled !== 'boolean'
        ),
    );

    if (beatsNeedingRefresh.length === 0) {
      return;
    }

    let isCancelled = false;

    void Promise.all(
      beatsNeedingRefresh.map(async (beat) => {
        refreshAttemptedRef.current.add(beat.id);
        const resolvedBeat = await resolveBeatPreview(beat.id);
        if (!resolvedBeat || isCancelled) {
          return;
        }
        upsertLikedBeat(resolvedBeat);
      }),
    );

    return () => {
      isCancelled = true;
    };
  }, [likedBeats, upsertLikedBeat]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-20 left-[-8rem] h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-8rem] h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        <header className="sticky top-0 z-[110] border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link to="/dashboard/buyer">
                <Button variant="secondary" size="sm" className="px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm">
                  <ArrowLeft size={14} />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-white sm:text-3xl">
                  Liked Beats
                </h1>
                <p className="hidden text-xs text-[#B3B3B3] sm:block sm:text-sm">
                  {likedCount} beat{likedCount === 1 ? '' : 's'} saved
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <UserQuickActions />
            </div>
          </div>
        </header>

        <section className="relative z-0 mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-5 lg:px-7">
          {likedBeats.length === 0 ? (
            <div className="glass rounded-[1.8rem] border border-[#262626] p-6 sm:p-8">
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] text-[#1ED760]">
                  <Heart size={22} />
                </div>
                <h2 className="mt-4 text-2xl font-bold">No liked beats yet</h2>
                <p className="mt-2 max-w-sm text-sm text-[#B3B3B3]">
                  Tap the heart icon on any beat to save it here.
                </p>
                <Link to="/dashboard/buyer" className="mt-6">
                  <Button variant="primary">Discover Beats</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass rounded-[1.8rem] border border-[#262626] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white sm:text-2xl">Your Collection</h2>
                <Button variant="secondary" size="sm" onClick={clearLikedBeats}>
                  Clear All
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {likedBeats.map((beat) => (
                  <BeatCard key={beat.id} beat={beat} onPlay={(selectedBeat) => { void handlePlayBeat(selectedBeat); }} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default LikedBeatsPage;
