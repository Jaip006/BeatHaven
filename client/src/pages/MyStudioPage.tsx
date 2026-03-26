import React, { useEffect, useRef, useState } from 'react';
import { Play, TrendingUp, ShieldCheck, Share2, Expand, ChevronDown, Music2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';

type DropdownKey = 'dashboard' | 'beats' | 'browse' | null;

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'] as const;
const beatOptions = ['My Beats', 'Draft Uploads'] as const;
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};
const browseSections = [
  { title: 'Sales', items: ['Orders Received', 'Payouts', 'Customers'] },
  { title: 'Workspace', items: ['Analytics', 'Licenses', 'Upload Queue'] },
];

interface Beat {
  _id: string;
  title: string;
  tempo: number;
  musicalKey: string;
  basicPrice?: number;
  artworkUrl: string;
  untaggedMp3Url: string;
  sellerId: {
    displayName: string;
    avatar?: string;
  };
}

interface Stats {
  plays: number;
  totalBeats: number;
  followers: number;
  verified: boolean;
}

const MyStudioPage: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const toggleDropdown = (key: Exclude<DropdownKey, null>) => {
    setOpenDropdown((current) => (current === key ? null : key));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStudioData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("http://localhost:5000/api/v1/beats/studio", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setBeats(data.data.beats);
          setStats(data.data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch studio data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudioData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-16 left-[-8rem] h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-8rem] h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        {/* ── Header ── */}
        <div className="fixed inset-x-0 top-0 z-[100]">
          <div className="relative z-[120] border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5 lg:px-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <Link to="/" className="flex items-center gap-2.5 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]">
                    <Music2 size={18} className="text-[#0B0B0B]" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">Beat<span className="text-[#1ED760]">Haven</span></span>
                </Link>
                <div className="flex items-center gap-3 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-3 text-sm text-[#B3B3B3] lg:min-w-[360px]">
                  <Search size={16} className="text-[#6B7280]" />
                  <span>Search beats, licenses, producers, lyrics</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <UserQuickActions />
              </div>
            </div>
          </div>

          {/* ── Sub-header ── */}
          <div className="relative z-[110] border-b border-[#262626] bg-[#090909]/80 backdrop-blur-xl">
            <div ref={dropdownContainerRef} className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-5 lg:px-7">
              <div className="relative">
                <button onClick={() => toggleDropdown('dashboard')} className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]">
                  Dashboard
                  <ChevronDown size={16} className={openDropdown === 'dashboard' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>
                {openDropdown === 'dashboard' ? (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    {dashboardOptions.map((option) => (
                      <Link key={option} to={dashboardRoutes[option]} onClick={() => setOpenDropdown(null)}
                        className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                        {option}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button onClick={() => toggleDropdown('beats')} className="inline-flex items-center gap-2 rounded-full border border-[#1ED760] bg-[#121212] px-4 py-2.5 text-sm text-white transition-colors duration-200">
                  Beats
                  <ChevronDown size={16} className={openDropdown === 'beats' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>
                {openDropdown === 'beats' ? (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    {beatOptions.map((option) => (
                      <button key={option} className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button onClick={() => toggleDropdown('browse')} className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/100 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]">
                  Browse
                  <ChevronDown size={16} className={openDropdown === 'browse' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>
                {openDropdown === 'browse' ? (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-[320px] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[420px]">
                    <div className="grid gap-5 sm:grid-cols-2">
                      {browseSections.map((section) => (
                        <div key={section.title}>
                          <div className="space-y-2">
                            {section.items.map((item) => (
                              <button key={item} className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white">
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

        {/* ── Page Content ── */}
        <section className="relative z-0 mx-auto max-w-7xl px-4 pb-10 pt-[11.5rem] sm:px-5 sm:pb-12 sm:pt-[12rem] lg:px-7">
          {loading ? (
            <div className="text-center text-[#B3B3B3] py-20">Loading your studio...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

              {/* Left Sidebar */}
              <div className="space-y-4">
                {/* Profile Card */}
                <div className="bg-[#151515] border border-[#262626] rounded-2xl p-6 text-center">
                  <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden mb-4 bg-[#2A2A2A]">
                    <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                    Level On The Beat
                    <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                    <span className="bg-[#F5A623] text-black text-[10px] font-black px-1.5 py-0.5 rounded uppercase leading-none">Pro</span>
                  </h2>
                  <p className="text-[#8B5CF6] text-sm mt-1">Versatile Music Producer</p>
                  <p className="text-gray-400 text-xs mt-2">Joined 12 Feb 2024</p>

                  <div className="flex justify-between mt-6 px-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{stats?.followers || 333}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">67.5k</p>
                      <p className="text-xs text-gray-500">Plays</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{stats?.totalBeats || 0}</p>
                      <p className="text-xs text-gray-500">Tracks</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl font-semibold transition-colors">
                      Follow
                    </button>
                    <button className="p-2 border border-[#262626] rounded-xl hover:bg-[#202020] transition-colors text-white">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Recognition Card */}
                <div className="bg-[#151515] border border-[#262626] rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Recognition</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-[#333] text-xs font-bold">10K</div>
                      <span className="text-sm font-medium">67.5k+ Plays</span>
                    </div>
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔥</span>
                        <span className="text-sm font-medium">Trending Now</span>
                      </div>
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* About Me Card */}
                <div className="bg-[#151515] border border-[#262626] rounded-2xl p-6 relative">
                  <Expand className="w-4 h-4 absolute top-4 right-4 text-gray-500" />
                  <h3 className="font-bold mb-2">About me</h3>
                  <p className="text-sm text-gray-400">
                    Hello I'm Level Contact :-<br />
                    levelonthebeat@gmail.com
                  </p>
                </div>
              </div>

              {/* Right Area - Beats */}
              <div className="bg-[#151515] border border-[#262626] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Beats</h2>
                  <Expand className="w-4 h-4 text-gray-500" />
                </div>

                <div className="space-y-2">
                  {beats.map((beat) => (
                    <div key={beat._id} className="group flex items-center justify-between p-3 hover:bg-[#1A1A1A] rounded-xl transition-colors">
                      <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0">
                          <Play className="w-5 h-5 ml-1" />
                        </button>
                        <img
                          src={beat.artworkUrl || "https://images.unsplash.com/photo-1614113489855-66422ad300a4?auto=format&fit=crop&w=100&q=80"}
                          alt={beat.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-sm tracking-tight">{beat.title}</h4>
                          <div className="flex items-center text-xs text-gray-400 gap-3 mt-0.5">
                            <span className="text-orange-500">{beat.sellerId?.displayName || "Level on the Beat"} ✪</span>
                            <span>ıll {beat.tempo} BPM</span>
                            <span>♪ {beat.musicalKey}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5">
                          🛒 ₹{beat.basicPrice || 799}
                        </button>
                        <button className="p-2 text-gray-500 hover:text-white transition-colors">⋮</button>
                      </div>
                    </div>
                  ))}
                  {beats.length === 0 && (
                    <div className="text-center text-gray-500 py-10">No beats uploaded yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MyStudioPage;
