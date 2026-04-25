import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  FolderOpen,
  Upload,
  Waves,
  Home,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import { authFetch } from '../utils/authFetch';

type StudioStats = {
  totalBeats?: number;
  plays?: number;
};

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'];
const beatOptions = ['My Beats', 'Draft Uploads'];
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};
const browseSections = [
  { title: 'Sales', items: ['Orders Received', 'Payouts', 'Customers'] },
  { title: 'Workspace', items: ['Analytics', 'Licenses', 'Upload Queue'] },
];
const beatOptionRoutes: Record<string, string> = {
  'My Beats': '/studio',
  'Draft Uploads': '/dashboard/seller/upload',
};
const browseItemRoutes: Record<string, string> = {
  'Orders Received': '/dashboard/seller',
  Payouts: '/dashboard/seller',
  Customers: '/dashboard/seller',
  Analytics: '/dashboard/seller',
  Licenses: '/dashboard/seller',
  'Upload Queue': '/dashboard/seller/upload',
};

const SellerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<StudioStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authFetch(`${import.meta.env.VITE_API_URL}/beats/studio`);
        const data = await res.json();
        if (data.success) {
          setStats(data.data.stats);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const computedStats = [
    {
      title: 'Active Beats',
      value: stats?.totalBeats?.toString() || '0',
      note: 'Total uploaded beats',
      icon: Waves,
      accent: 'text-[#1ED760]',
    },
    {
      title: 'Total Plays',
      value: stats?.plays?.toString() || '0',
      note: 'Total plays across all beats',
      icon: FolderOpen,
      accent: 'text-[#7C5CFF]',
    },
    {
      title: 'Total Earnings',
      value: '0',
      note: 'Up 14% from last month',
      icon: IndianRupee,
      accent: 'text-[#1ED760]',
    },
  ];

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
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {dashboardOptions.map((option) => (
                        <Link
                          key={option}
                          to={dashboardRoutes[option]}
                          className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors duration-200 ${
                            option === 'Seller Dashboard'
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
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
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
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-[420px] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      <div className="grid gap-5 sm:grid-cols-2">
                        {browseSections.map((section) => (
                          <div key={section.title}>
                            <div className="space-y-2">
                              {section.items.map((item) => (
                                <Link
                                  key={item}
                                  to={browseItemRoutes[item] ?? '/'}
                                  className="block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white"
                                >
                                  {item}
                                </Link>
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

        <section className="relative z-0 mx-auto max-w-7xl space-y-8 px-4 pb-6 pt-[7.5rem] sm:px-5 sm:pb-8 sm:pt-[8.25rem] lg:px-7">
          <div className="glass mb-20 rounded-[2rem] border border-[#262626] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  Drop your next beat pack into
                  <span className="gradient-text"> the marketplace</span>
                </h1>
                <p className="mt-4 text-base leading-relaxed text-[#B3B3B3] sm:text-lg">
                  Upload WAV, MP3, stems, and cover art. Set BPM, key, mood tags, and lease pricing before publishing.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6">
                <Link
                  to="/studio"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1ED760] px-8 py-3.5 text-base font-semibold text-black transition-all duration-200 hover:scale-105 hover:bg-[#1db954] active:scale-100"
                >
                  <Home size={16} />
                  My Studio
                </Link>
                <Link
                  to="/dashboard/seller/upload"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7C5CFF] px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-[#6a4de0] active:scale-100"
                >
                  <Upload size={16} />
                  New Upload
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {computedStats.map(({ title, value, note, icon: Icon, accent }) => (
              <div
                key={title}
                className="glass rounded-[1.75rem] border border-[#262626] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#1ED760]/40 hover:bg-[#121212]/90"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-[#6B7280]">{title}</p>
                    <h2 className="mt-4 text-4xl font-black tracking-tight text-white">{value}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">{note}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121212] ${accent}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SellerDashboardPage;







