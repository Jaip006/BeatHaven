import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  Heart,
  Music2,
  Play,
  Search,
  ShoppingCart,
  FileText,
  Upload,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

type DropdownKey = 'dashboard' | 'beats' | 'browse' | null;

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'];
const beatOptions = ['All Beats', 'Trending Beats'];
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

const trendingBeats = [
  { title: 'Neon Skyline', producer: 'Aaryan Waves', vibe: 'Trap Soul', bpm: 142, price: '$39' },
  { title: 'Velvet Motion', producer: 'Riz Mixx', vibe: 'R&B', bpm: 96, price: '$29' },
  { title: 'Drift Theory', producer: 'Karma Keys', vibe: 'Melodic Drill', bpm: 138, price: '$44' },
];

const playlists = [
  { name: 'Late Night Writing Camp', tracks: 18, tone: 'Moody vocals and atmospheric drums' },
  { name: 'High Energy Rollout', tracks: 12, tone: 'Big hooks, loud 808s, stadium energy' },
  { name: 'Smooth Replay Picks', tracks: 24, tone: 'Silky R&B pockets for repeat listens' },
];

const producers = [
  { name: 'Aaryan Waves', genre: 'Trap Soul / R&B', followers: '128K', badge: 'Top Seller' },
  { name: 'Riz Mixx', genre: 'Commercial Afro / Pop', followers: '92K', badge: 'Editor Pick' },
  { name: 'Karma Keys', genre: 'Melodic Drill / Hip-Hop', followers: '141K', badge: 'Trending' },
];

const quickAccessItems = [
  { title: 'Liked Beats', hint: 'Your liked beats', icon: Heart, accent: 'text-[#1ED760]' },
  { title: 'Downloads', hint: 'Your downloaded beats', icon: Download, accent: 'text-[#7C5CFF]' },
  { title: 'Cart', hint: 'Review beats ready for checkout', icon: ShoppingCart, accent: 'text-[#1ED760]' },
  { title: 'My Lyrics', hint: 'Keep your writing ideas close', icon: FileText, accent: 'text-[#7C5CFF]' },
];

const BuyerDashboardPage: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = (key: Exclude<DropdownKey, null>) => {
    setOpenDropdown((current) => (current === key ? null : key));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-16 left-[-8rem] h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-8rem] h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        <div className="fixed inset-x-0 top-0 z-[100]">
          <div className="border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5 lg:px-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <Link to="/" className="flex items-center gap-2.5 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]">
                    <Music2 size={18} className="text-[#0B0B0B]" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">
                    Beat<span className="text-[#1ED760]">Haven</span>
                  </span>
                </Link>

                <div className="flex items-center gap-3 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-3 text-sm text-[#B3B3B3] lg:min-w-[360px]">
                  <Search size={16} className="text-[#6B7280]" />
                  <span>Search beats, licenses, producers, lyrics</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-[#262626] bg-[#121212]/95 text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                  <ShoppingCart size={18} />
                </button>
                <Button variant="primary" size="md">
                  <Upload size={16} />
                  Upload
                </Button>
                <button className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-[#1ED760]">
                  <User size={16} className="text-[#1ED760]" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-[#262626] bg-[#090909]/80 backdrop-blur-xl">
            <div ref={dropdownContainerRef} className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-5 lg:px-7">
            <div className="relative">
              <button
                onClick={() => toggleDropdown('dashboard')}
                className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]"
              >
                Dashboard
                <ChevronDown size={16} className={openDropdown === 'dashboard' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
              </button>
              {openDropdown === 'dashboard' ? (
                <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010]/100 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  {dashboardOptions.map((option) => (
                    <button
                      key={option}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors duration-200 ${
                        option === 'Buyer Dashboard'
                          ? 'bg-[#161616] text-[#1ED760]'
                          : 'text-[#B3B3B3] hover:bg-[#161616] hover:text-white'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                onClick={() => toggleDropdown('beats')}
                className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/100 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]"
              >
                Beats
                <ChevronDown size={16} className={openDropdown === 'beats' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
              </button>
              {openDropdown === 'beats' ? (
                <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010]/100 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  {beatOptions.map((option) => (
                    <button
                      key={option}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                onClick={() => toggleDropdown('browse')}
                className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/100 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]"
              >
                Browse
                <ChevronDown size={16} className={openDropdown === 'browse' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
              </button>
              {openDropdown === 'browse' ? (
                <div className="absolute left-0 top-full z-[120] mt-3 w-[320px] rounded-[1.4rem] border border-[#262626] bg-[#101010]/100 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[420px]">
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
              ) : null}
            </div>
            </div>
          </div>
        </div>

        <section className="relative z-0 mx-auto max-w-7xl space-y-8 px-4 pt-[11.5rem] pb-6 sm:px-5 sm:pt-[12rem] sm:pb-8 lg:px-7">
          <div className="glass rounded-[2rem] border border-[#262626] mb-20 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  Discover the exact beat
                  <span className="gradient-text"> your next song needs.</span>
                </h1>
                <p className="mt-4 text-base leading-relaxed text-[#B3B3B3] sm:text-lg">
                  Search by vibe, BPM, and genre with a cleaner discovery flow built for buyers.
                </p>
              </div>
              <Button variant="accent" size="lg">
                <Search size={16} />
                Search
              </Button>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
              <div className="flex items-center gap-3 rounded-[1.4rem] border border-[#262626] bg-[#121212]/90 px-4 py-4 text-sm text-[#B3B3B3]">
                <Search size={18} className="text-[#6B7280]" />
                <span>Search by title, producer, genre, or mood</span>
              </div>
              <button className="rounded-[1.4rem] border border-[#262626] bg-[#121212]/90 px-4 py-4 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#1ED760] hover:text-white">
                Genre: All
              </button>
              <button className="rounded-[1.4rem] border border-[#262626] bg-[#121212]/90 px-4 py-4 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#1ED760] hover:text-white">
                BPM: Any
              </button>
            </div>
          </div>
        
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickAccessItems.map(({ title, hint, icon: Icon, accent }) => (
              <button
                key={title}
                className="glass rounded-[1.75rem] border border-[#262626] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#1ED760]/50 hover:bg-[#121212]/90"
              >
                <div className="inline-flex items-center justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121212] ${accent}`}>
                    <Icon size={20} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">{hint}</p>
              </button>
            ))}
          </div>

          <div className="glass rounded-[2rem] border border-[#262626] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[#1ED760]">Trending Beats</p>
                <h2 className="mt-2 text-2xl font-bold">What buyers are replaying right now</h2>
              </div>
              <Button variant="secondary" size="sm">View All</Button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {trendingBeats.map((beat) => (
                <div key={beat.title} className="rounded-[1.6rem] border border-[#262626] bg-[#121212]/90 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{beat.title}</h3>
                      <p className="mt-1 text-sm text-[#B3B3B3]">{beat.producer}</p>
                    </div>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A] text-[#1ED760] transition-colors duration-200 hover:bg-[#242424]">
                      <Play size={16} fill="currentColor" />
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-[#6B7280]">
                    {beat.vibe} • {beat.bpm} BPM
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-lg font-bold text-[#1ED760]">{beat.price}</span>
                    <Button variant="accent" size="sm">Add To Cart</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[2rem] border border-[#262626] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[#1ED760]">Playlists</p>
                <h2 className="mt-2 text-2xl font-bold">Curated lanes for every writing mood</h2>
              </div>
              <Button variant="secondary" size="sm">Open Library</Button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {playlists.map((playlist, index) => (
                <div key={playlist.name} className="rounded-[1.6rem] border border-[#262626] bg-[#121212]/90 p-5">
                  <div
                    className={`mb-4 h-32 rounded-[1.25rem] ${
                      index === 0
                        ? 'bg-[linear-gradient(135deg,rgba(30,215,96,0.22),rgba(124,92,255,0.14))]'
                        : index === 1
                          ? 'bg-[linear-gradient(135deg,rgba(124,92,255,0.24),rgba(30,215,96,0.10))]'
                          : 'bg-[linear-gradient(135deg,rgba(18,18,18,1),rgba(30,215,96,0.12))]'
                    } border border-[#2A2A2A]`}
                  />
                  <h3 className="text-lg font-semibold">{playlist.name}</h3>
                  <p className="mt-2 text-sm text-[#B3B3B3]">{playlist.tone}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">{playlist.tracks} tracks</span>
                    <Button variant="ghost" size="sm">Play Now</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[2rem] border border-[#262626] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[#1ED760]">Famous Producers</p>
                <h2 className="mt-2 text-2xl font-bold">Top creators shaping the marketplace</h2>
              </div>
              <Button variant="secondary" size="sm">Explore Producers</Button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {producers.map((producer) => (
                <div key={producer.name} className="rounded-[1.6rem] border border-[#262626] bg-[#121212]/90 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] text-lg font-bold text-[#0B0B0B]">
                      {producer.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{producer.name}</h3>
                      <p className="text-sm text-[#B3B3B3]">{producer.genre}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="rounded-full border border-[#2A2A2A] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#6B7280]">
                      {producer.badge}
                    </span>
                    <span className="text-sm text-[#1ED760]">{producer.followers} followers</span>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-5 w-full rounded-2xl border border-[#262626]">
                    View Profile
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BuyerDashboardPage;
