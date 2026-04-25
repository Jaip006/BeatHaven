import React, { useCallback, useEffect, useState } from 'react';
import {
  Download,
  Heart,
  Search,
  ShoppingCart,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import BeatCard from '../components/ui/BeatCard';
import UserQuickActions from '../components/layout/UserQuickActions';
import type { Beat } from '../types';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { trendingBeats as dummyBeats } from '../data/trendingBeats';
import { usePlayer } from '../context/PlayerContext';
import { authFetch } from '../utils/authFetch';

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'];
const beatOptions = ['All Beats', 'Trending Beats'];
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};
const browseSections = [
  {
    title: 'Orders',
    items: ['My Store', 'Order Placed', 'Order Received'],
  },
  {
    title: 'Library',
    items: ['Liked', 'Downloads', 'My Lyrics'],
  },
];

const beatOptionRoutes: Record<string, string> = {
  'All Beats': '/',
  'Trending Beats': '/',
};
const browseItemRoutes: Record<string, string> = {
  'My Store': '/studio',
  'Order Placed': '/dashboard/buyer',
  'Order Received': '/dashboard/seller',
  Liked: '/liked-beats',
  Downloads: '/downloads',
  'My Lyrics': '/my-lyrics',
};

const quickAccessItems = [
  { title: 'Liked Beats', icon: Heart, accent: 'text-[#1ED760]', route: '/liked-beats' },
  { title: 'Downloads', icon: Download, accent: 'text-[#7C5CFF]', route: '/downloads' },
  { title: 'Cart', icon: ShoppingCart, accent: 'text-[#1ED760]', route: '/cart' },
  { title: 'My Lyrics', icon: FileText, accent: 'text-[#7C5CFF]', route: '/my-lyrics' },
];

type ApiBeatSearchResult = {
  id: string;
  title: string;
  producerName?: string;
  producerId?: string;
  genre?: string;
  beatType?: string;
  tempo?: number;
  bpm?: number;
  key?: string;
  musicalKey?: string;
  price?: number;
  coverImage?: string;
  artworkUrl?: string;
  audioUrl?: string;
  untaggedMp3Url?: string;
  tags?: string[] | string;
  plays?: number;
  likes?: number;
  freeMp3Enabled?: boolean;
};

type SearchFilters = {
  q: string;
};

const resolveBeatGenre = (beat: ApiBeatSearchResult): string => {
  const normalizedTags = Array.isArray(beat.tags)
    ? beat.tags.map((tag) => String(tag ?? '').trim()).filter(Boolean)
    : (typeof beat.tags === 'string'
      ? beat.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : []);

  const genreCandidate = String(beat.genre ?? '').trim();
  if (genreCandidate && genreCandidate.toLowerCase() !== 'unknown') {
    return genreCandidate;
  }

  const beatTypeCandidate = String(beat.beatType ?? '').trim();
  if (beatTypeCandidate && beatTypeCandidate.toLowerCase() !== 'unknown') {
    return beatTypeCandidate;
  }

  const tagCandidate = normalizedTags[0] ?? '';
  if (tagCandidate) {
    return tagCandidate;
  }

  return 'Unknown';
};

const parseFreeMp3Enabled = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
};

const BuyerDashboardPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Beat[]>([]);
  const [isLoadingBeats, setIsLoadingBeats] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);
  const { playBeat, currentBeat, togglePlay } = usePlayer();

  const handleViewAll = () => {
    setSearchQuery('');
    setSubmittedQuery('');
    setSearchResults([]);
    setSearchError('');
    setIsLoadingBeats(false);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(searchQuery.trim());
  };

  const handlePlayBeat = (beat: Beat) => {
    if (!beat.audioUrl) {
      setSearchError('Preview is not available for this beat.');
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

    void authFetch(`${import.meta.env.VITE_API_URL}/beats/${beat.id}/play`, { method: 'POST' }).catch(() => null);
  };

  const fetchBeatsFromDatabase = useCallback(async (filters: SearchFilters) => {
    setIsLoadingBeats(true);
    setSearchError('');

    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      params.set('limit', '48');

      const endpoint = `${API_BASE_URL}/beats/search?${params.toString()}`;
      const res = await fetch(endpoint);
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setSearchResults([]);
        setSearchError(data?.message || 'Failed to fetch beats.');
        return;
      }

      const dbBeats = Array.isArray(data?.data?.beats) ? (data.data.beats as ApiBeatSearchResult[]) : [];
      const mappedBeats: Beat[] = dbBeats.map((beat) => ({
        id: String(beat.id ?? ''),
        title: String(beat.title ?? 'Untitled Beat'),
        producerName: String(beat.producerName ?? 'Unknown Producer'),
        producerId: String(beat.producerId ?? ''),
        genre: resolveBeatGenre(beat),
        bpm: Number(beat.bpm ?? beat.tempo ?? 0),
        key: String(beat.key ?? beat.musicalKey ?? ''),
        price: Number(beat.price ?? 0),
        coverImage: String(beat.coverImage ?? beat.artworkUrl ?? ''),
        audioUrl: String(beat.audioUrl ?? beat.untaggedMp3Url ?? ''),
        tags: Array.isArray(beat.tags)
          ? beat.tags.map((tag) => String(tag ?? '').trim()).filter(Boolean)
          : (typeof beat.tags === 'string'
            ? beat.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : []),
        plays: Number(beat.plays ?? 0),
        likes: Number(beat.likes ?? 0),
        freeMp3Enabled: parseFreeMp3Enabled(beat.freeMp3Enabled),
      }));

      setSearchResults(mappedBeats);
    } catch (error) {
      console.error('Failed to fetch beats', error);
      setSearchResults([]);
      setSearchError('Failed to fetch beats from database.');
    } finally {
      setIsLoadingBeats(false);
    }
  }, []);

  const fetchTrendingBeats = useCallback(async () => {
    try {
      setIsLoadingTrending(true);
      setTrendingError(null);

      const response = await fetch(`${API_BASE_URL}/beats/trending?limit=12&days=30`);
      const data = await response.json();

      if (!data.success || !data.data?.beats) {
        throw new Error(data.message || 'Failed to fetch trending beats');
      }

      // Fill remaining slots with dummy beats if needed
      const realBeats = data.data.beats;
      const allBeats = [
        ...realBeats,
        ...dummyBeats.slice(0, Math.max(0, 12 - realBeats.length))
      ].slice(0, 12);

      setTrendingBeats(allBeats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trending beats';
      setTrendingError(errorMessage);
      // Fallback to dummy beats on error
      setTrendingBeats(dummyBeats.slice(0, 12));
      console.error('Error fetching trending beats:', err);
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  useEffect(() => {
    void fetchTrendingBeats();

    // Refresh trending beats every 1 hour
    const interval = setInterval(() => {
      void fetchTrendingBeats();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchTrendingBeats]);

  useEffect(() => {
    if (!submittedQuery) {
      setSearchResults([]);
      setSearchError('');
      setIsLoadingBeats(false);
      return;
    }
    void fetchBeatsFromDatabase({ q: submittedQuery });
  }, [fetchBeatsFromDatabase, submittedQuery]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-16 left-[-8rem] h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-8rem] h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        <div className="fixed inset-x-0 top-0 z-[100] border-b border-[#262626] bg-[#0B0B0B]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="relative z-[120]">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
              <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
                <img
                  src="/beathaven.png"
                  alt="BeatHaven logo"
                  className="h-9 w-9 rounded-xl object-cover shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]"
                />
                <span className="text-xl font-bold text-white tracking-tight">
              Beat<span className="text-[#1ED760]">Haven</span>
            </span>
              </Link>

              <div className="hidden flex-1 items-center justify-center lg:flex">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <button
                      className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white"
                    >
                      Dashboard
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010]/100 p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {dashboardOptions.map((option) => (
                        <Link
                          key={option}
                          to={dashboardRoutes[option]}
                          className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors duration-200 ${
                            option === 'Buyer Dashboard'
                              ? 'bg-[#161616] text-[#1ED760]'
                              : 'text-[#B3B3B3] hover:bg-[#161616] hover:text-white'
                          }`}
                        >
                          {option}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white"
                    >
                      Beats
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010]/100 p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {beatOptions.map((option) => (
                        <Link
                          key={option}
                          to={beatOptionRoutes[option] ?? '/'}
                          className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                        >
                          {option}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white"
                    >
                      Browse
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-[420px] rounded-[1.4rem] border border-[#262626] bg-[#101010]/100 p-4 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <div className="grid gap-5 sm:grid-cols-2">
                        {browseSections.map((section) => (
                          <div key={section.title}>
                            <div className="space-y-2">
                              {section.items.map((item) => (
                                browseItemRoutes[item] ? (
                                  <Link
                                    key={item}
                                    to={browseItemRoutes[item]}
                                    className="block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white"
                                  >
                                    {item}
                                  </Link>
                                ) : (
                                  <button
                                    key={item}
                                    className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white"
                                  >
                                    {item}
                                  </button>
                                )
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link to="/community" className="px-2 py-2 text-sm text-[#B3B3B3] hover:text-[#1ED760] transition-colors duration-200">Community</Link>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <UserQuickActions />
              </div>
            </div>
          </div>
        </div>

        <section className="relative z-0 mx-auto max-w-7xl space-y-8 px-4 pt-[7.5rem] pb-28 sm:px-5 sm:pt-[8.25rem] lg:px-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  Discover the exact beat
                  <span className="gradient-text"> your next song needs.</span>
                </h1>
            </div>

            <div className="mx-auto mt-8 w-full max-w-3xl">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="flex items-center gap-3 rounded-2xl border border-[#2A2A2A] bg-[#111111]/95 px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  <Search size={18} className="text-[#6B7280]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search beats or producers..."
                    className="h-11 w-full bg-transparent text-base text-white outline-none placeholder:text-[#6B7280]"
                    aria-label="Search beats or producers"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-[#1ED760] to-[#7C5CFF] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-105"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
        
          {submittedQuery ? (
            <div className="glass rounded-[2rem] border border-[#262626] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="mt-2 text-2xl font-bold">Results for &quot;{submittedQuery}&quot;</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={handleViewAll}>Clear Search</Button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((beat) => (
                  <BeatCard key={beat.id} beat={beat} onPlay={handlePlayBeat} />
                ))}
              </div>
              {isLoadingBeats ? (
                <p className="mt-5 text-sm text-[#9CA3AF]">Loading beats from database...</p>
              ) : null}
              {!isLoadingBeats && searchError ? (
                <p className="mt-5 text-sm text-[#FCA5A5]">{searchError}</p>
              ) : null}
              {!isLoadingBeats && !searchError && searchResults.length === 0 ? (
                <p className="mt-5 text-sm text-[#9CA3AF]">
                  No beats match this search yet.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {quickAccessItems.map(({ title, icon: Icon, accent, route }) => {
              const content = (
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#121212] ${accent}`}>
                    <Icon size={16} />
                  </div>
                  <h2 className="text-sm font-bold tracking-tight">{title}</h2>
                </div>
              );

              if (route) {
                return (
                  <Link
                    key={title}
                    to={route}
                    className="glass rounded-2xl border border-[#262626] p-3.5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#1ED760]/50 hover:bg-[#121212]/90"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={title}
                  className="glass rounded-2xl border border-[#262626] p-3.5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#1ED760]/50 hover:bg-[#121212]/90"
                >
                  {content}
                </button>
              );
            })}
          </div>

          <div className="glass rounded-[2rem] border border-[#262626] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[#1ED760]">Trending Beats</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleViewAll}>
                View All
              </Button>
            </div>

            {/* Error State */}
            {trendingError && !isLoadingTrending && trendingBeats.length === 0 && (
              <div className="mt-6 rounded-2xl border border-[#3B1F1F] bg-[#0B0B0B]/50 p-6 text-center">
                <p className="text-[#FCA5A5]">{trendingError}</p>
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
            {isLoadingTrending && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {Array(12)
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
            {!isLoadingTrending && !trendingError && trendingBeats.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {trendingBeats.map((beat) => (
                  <BeatCard key={beat.id} beat={beat} onPlay={handlePlayBeat} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoadingTrending && !trendingError && trendingBeats.length === 0 && (
              <div className="mt-6 rounded-2xl border border-[#262626] bg-[#0B0B0B]/50 p-12 text-center">
                <p className="text-[#B3B3B3]">No trending beats found. Come back soon!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BuyerDashboardPage;









