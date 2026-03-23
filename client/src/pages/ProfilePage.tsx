import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Mail, Music2, Search, ShieldCheck, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import { getAuthSession, getUserInitials, type AuthUser } from '../utils/auth';

type DropdownKey = 'dashboard' | 'beats' | 'browse' | null;

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'];
const beatOptions = ['My Beats', 'Draft Uploads'];
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};

const browseSections = [
  {
    title: 'Sales',
    items: ['Orders Received', 'Payouts', 'Customers'],
  },
  {
    title: 'Workspace',
    items: ['Analytics', 'Licenses', 'Upload Queue'],
  },
];

const profileHighlights = [
  {
    label: 'Primary Role',
    value: 'Creator Account',
    hint: 'Your default dashboard is based on the role selected at sign in.',
  },
  {
    label: 'Account Access',
    value: 'Buyer + Seller Views',
    hint: 'You can move between both dashboards from the dashboard switcher.',
  },
  {
    label: 'Verification',
    value: 'Email Verified',
    hint: 'Your email is verified and ready for marketplace activity.',
  },
];

const ProfilePage: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [currentUser] = useState<AuthUser | null>(getAuthSession()?.user ?? null);
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
          <div className="relative z-[120] border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
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
                <UserQuickActions />
              </div>
            </div>
          </div>

          <div className="relative z-[110] border-b border-[#262626] bg-[#090909]/80 backdrop-blur-xl">
            <div
              ref={dropdownContainerRef}
              className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-5 lg:px-7"
            >
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('dashboard')}
                  className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]"
                >
                  Dashboard
                  <ChevronDown size={16} className={openDropdown === 'dashboard' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>
                {openDropdown === 'dashboard' ? (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    {dashboardOptions.map((option) => (
                      <Link
                        key={option}
                        to={dashboardRoutes[option]}
                        onClick={() => setOpenDropdown(null)}
                        className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                      >
                        {option}
                      </Link>
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
                  <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
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
                  <div className="absolute left-0 top-full z-[120] mt-3 w-[320px] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[420px]">
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

        <section className="relative z-0 mx-auto max-w-7xl space-y-8 px-4 pb-8 pt-[11.5rem] sm:px-5 sm:pb-10 sm:pt-[12rem] lg:px-7">

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="glass rounded-[1.8rem] border border-[#262626] p-6 sm:p-7">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] text-2xl font-black text-[#0B0B0B]">
                  {getUserInitials(currentUser?.displayName ?? 'User')}
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">
                  {currentUser?.displayName ?? 'BeatHaven User'}
                </h2>
                <p className="mt-2 text-sm text-[#B3B3B3]">
                  {currentUser?.role === 'seller' ? 'Seller-first account' : 'Buyer-first account'}
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <div className="rounded-[1.25rem] border border-[#262626] bg-[#121212]/90 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[#1ED760]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#6B7280]">Email</p>
                      <p className="mt-1 text-sm text-white">{currentUser?.email ?? 'Not available'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-[#262626] bg-[#121212]/90 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-[#7C5CFF]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#6B7280]">Verification</p>
                      <p className="mt-1 text-sm text-white">
                        {currentUser?.isVerified ? 'Verified account' : 'Verification pending'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-[#262626] bg-[#121212]/90 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-[#1ED760]" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#6B7280]">Default Role</p>
                      <p className="mt-1 text-sm capitalize text-white">{currentUser?.role ?? 'buyer'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {profileHighlights.map((item) => (
                <div key={item.label} className="glass rounded-[1.6rem] border border-[#262626] p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-[#1ED760]">{item.label}</p>
                  <h3 className="mt-3 text-2xl font-bold text-white">{item.value}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
