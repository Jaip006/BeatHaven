import React, { useCallback, useEffect, useState } from 'react';
import {
  Download,
  Heart,
  Music2,
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
import { trendingBeats } from '../data/trendingBeats';

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

const quickAccessItems = [
  { title: 'Liked Beats', hint: 'Your liked beats', icon: Heart, accent: 'text-[#1ED760]' },
  { title: 'Downloads', hint: 'Your downloaded beats', icon: Download, accent: 'text-[#7C5CFF]' },
  { title: 'Cart', hint: 'Review beats ready for checkout', icon: ShoppingCart, accent: 'text-[#1ED760]', route: '/cart' },
  { title: 'My Lyrics', hint: 'Keep your writing ideas close', icon: FileText, accent: 'text-[#7C5CFF]' },
];

type ApiBeatSearchResult = {
  id: string;
  title: string;
  producerName?: string;
  producerId?: string;
  genre?: string;
  tempo?: number;
  bpm?: number;
  key?: string;
  musicalKey?: string;
  price?: number;
  coverImage?: string;
  artworkUrl?: string;
  tags?: string[];
  plays?: number;
  likes?: number;
};

type SearchFilters = {
  q: string;
};

const BuyerDashboardPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Beat[]>([]);
  const [isLoadingBeats, setIsLoadingBeats] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

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
        genre: String(beat.genre ?? 'Unknown'),
        bpm: Number(beat.bpm ?? beat.tempo ?? 0),
        key: String(beat.key ?? beat.musicalKey ?? ''),
        price: Number(beat.price ?? 0),
        coverImage: String(beat.coverImage ?? beat.artworkUrl ?? ''),
        tags: Array.isArray(beat.tags) ? beat.tags.map((tag) => String(tag)) : [],
        plays: Number(beat.plays ?? 0),
        likes: Number(beat.likes ?? 0),
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
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]">
                  <Music2 size={18} className="text-[#0B0B0B]" />
                </div>
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
                        <button
                          key={option}
                          className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                        >
                          {option}
                        </button>
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
                                <button
                                  key={item}
                                  className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white"
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
                  <BeatCard key={beat.id} beat={beat} />
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickAccessItems.map(({ title, hint, icon: Icon, accent, route }) => {
              const content = (
                <>
                  <div className="inline-flex items-center justify-between gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121212] ${accent}`}>
                      <Icon size={20} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">{hint}</p>
                </>
              );

              if (route) {
                return (
                  <Link
                    key={title}
                    to={route}
                    className="glass rounded-[1.75rem] border border-[#262626] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#1ED760]/50 hover:bg-[#121212]/90"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={title}
                  className="glass rounded-[1.75rem] border border-[#262626] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#1ED760]/50 hover:bg-[#121212]/90"
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

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {trendingBeats.map((beat) => (
                <BeatCard key={beat.id} beat={beat} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BuyerDashboardPage;









