import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Music2, Search, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthSession, hydrateAuthSession, subscribeToAuthChanges } from '../../utils/auth';
import { API_BASE_URL } from '../../utils/apiBaseUrl';

// Decorative waveform bars
const WaveformDecoration: React.FC = () => {
  const heights = [20, 40, 60, 80, 100, 80, 60, 90, 70, 50, 80, 60, 100, 40, 70, 90, 50, 60, 80, 40, 70, 100, 60, 80, 50];
  return (
    <div className="flex items-end gap-1 h-24 opacity-30">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-full"
          style={{
            height: `${h}%`,
            background: i % 3 === 0
              ? 'linear-gradient(180deg, #1ED760, #1ED76080)'
              : i % 3 === 1
              ? 'linear-gradient(180deg, #7C5CFF, #7C5CFF80)'
              : '#262626',
            animationDelay: `${i * 0.08}s`,
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
};

const Hero: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(Boolean(getAuthSession()));
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [beatResults, setBeatResults] = useState<Array<{
    id: string;
    title: string;
    genre: string;
    tempo: number;
    price: number;
    producerName: string;
    producerHandle?: string;
  }>>([]);
  const [producerResults, setProducerResults] = useState<Array<{
    id: string;
    displayName: string;
    handle: string;
    followers: number;
  }>>([]);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => subscribeToAuthChanges(() => {
    setIsSignedIn(Boolean(getAuthSession()));
  }), []);

  useEffect(() => {
    if (isSignedIn) {
      return;
    }

    let isMounted = true;

    void hydrateAuthSession().then((session) => {
      if (isMounted && session) {
        setIsSignedIn(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isSignedIn]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setBeatResults([]);
      setProducerResults([]);
      setLoadingSearch(false);
      setSearchError(null);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoadingSearch(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/beats/search?q=${encodeURIComponent(trimmedQuery)}&limit=6`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error('Search request failed');
        }

        const payload = await response.json();
        const beats = Array.isArray(payload?.data?.beats) ? payload.data.beats : [];
        const producers = Array.isArray(payload?.data?.producers) ? payload.data.producers : [];
        setBeatResults(beats);
        setProducerResults(producers);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setSearchError('Could not fetch search results right now.');
      } finally {
        setLoadingSearch(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const flattenedResults = useMemo(() => {
    const producerItems = producerResults.map((producer) => ({ type: 'producer' as const, producer }));
    const beatItems = beatResults.map((beat) => ({ type: 'beat' as const, beat }));
    return [...producerItems, ...beatItems];
  }, [producerResults, beatResults]);

  const goToSearchTarget = (target: { type: 'producer'; producer: { handle: string } } | { type: 'beat'; beat: { producerHandle?: string } }) => {
    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }

    if (target.type === 'producer') {
      navigate(`/studio?handle=${encodeURIComponent(target.producer.handle)}`);
      return;
    }

    if (target.beat.producerHandle) {
      navigate(`/studio?handle=${encodeURIComponent(target.beat.producerHandle)}`);
      return;
    }

    navigate('/dashboard/buyer');
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeIndex >= 0 && flattenedResults[activeIndex]) {
      goToSearchTarget(flattenedResults[activeIndex]);
      return;
    }

    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }

    if (flattenedResults[0]) {
      goToSearchTarget(flattenedResults[0]);
      return;
    }

    navigate('/dashboard/buyer');
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!flattenedResults.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((previous) => (previous + 1) % flattenedResults.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((previous) => (previous <= 0 ? flattenedResults.length - 1 : previous - 1));
      return;
    }
    if (event.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  const showResultsPanel = isSearchFocused && query.trim().length >= 2;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-gradient pt-16">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#1ED760]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#7C5CFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1ED760]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
  

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black mb-5 mt-14 leading-[1.05] tracking-tight">
          <span className="text-white">Where Hits</span>
          <br />
          <span className="gradient-text">Get Made.</span>
        </h1>

        {/* Sub copy */}
        <p className="text-lg sm:text-xl text-[#B3B3B3] max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover and license premium beats from the India's top producers.
          Get studio-quality waveforms for your next big track.
       </p>

        {/* Smart Search */}
        <div className="mx-auto mb-16 w-full max-w-3xl" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center gap-3 rounded-2xl border border-[#2A2A2A] bg-[#111111]/95 px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <Search size={18} className="text-[#6B7280]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
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

            {showResultsPanel ? (
              <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0F0F0F]/98 p-2 text-left shadow-[0_24px_70px_rgba(0,0,0,0.56)] backdrop-blur-xl">
                {loadingSearch ? <p className="px-3 py-4 text-sm text-[#9CA3AF]">Searching...</p> : null}
                {!loadingSearch && searchError ? <p className="px-3 py-4 text-sm text-[#FCA5A5]">{searchError}</p> : null}
                {!loadingSearch && !searchError && flattenedResults.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[#9CA3AF]">No matches found.</p>
                ) : null}

                {!loadingSearch && !searchError && flattenedResults.length > 0 ? (
                  <div className="max-h-[320px] overflow-y-auto">
                    {flattenedResults.map((item, index) => {
                      const isActive = index === activeIndex;
                      if (item.type === 'producer') {
                        return (
                          <button
                            key={`producer-${item.producer.id}`}
                            type="button"
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => goToSearchTarget(item)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                              isActive ? 'bg-[#1B1B1B]' : 'hover:bg-[#171717]'
                            }`}
                          >
                            <span className="inline-flex items-center gap-2 text-sm text-white">
                              <UserRound size={15} className="text-[#1ED760]" />
                              {item.producer.displayName}
                            </span>
                            <span className="text-xs text-[#9CA3AF]">@{item.producer.handle}</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={`beat-${item.beat.id}`}
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => goToSearchTarget(item)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                            isActive ? 'bg-[#1B1B1B]' : 'hover:bg-[#171717]'
                          }`}
                        >
                          <span className="inline-flex min-w-0 items-center gap-2 text-sm text-white">
                            <Music2 size={15} className="text-[#7C5CFF]" />
                            <span className="truncate">{item.beat.title}</span>
                          </span>
                          <span className="truncate pl-3 text-xs text-[#9CA3AF]">{item.beat.producerName}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </form>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 mb-16">
          {[
            { value: '50K+', label: 'Beats Available' },
            { value: '5K+', label: 'Producers' },
            { value: '200K+', label: 'Artists Served' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black text-white mb-1">{value}</p>
              <p className="text-sm text-[#6B7280]">{label}</p>
            </div>
          ))}
        </div>

        {/* Waveform decoration */}
        <div className="max-w-2xl mx-auto">
          <WaveformDecoration />
        </div>

        {/* Scroll hint */}
        <a
          href="#trending"
          className="inline-flex flex-col items-center gap-2 text-[#6B7280] hover:text-[#1ED760] transition-colors duration-200 mt-8 group"
        >
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <ChevronDown
            size={18}
            className="group-hover:translate-y-1 transition-transform duration-300"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
          />
        </a>
      </div>
    </section>
  );
};

export default Hero;
