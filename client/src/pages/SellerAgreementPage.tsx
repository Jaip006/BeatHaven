import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Music2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';

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

const agreementSections = [
  {
    eyebrow: 'User Agreement',
    points: [
      'You must provide accurate account information and keep your contact details up to date at all times.',
      'You are responsible for all activity that happens through your account, including uploads, edits, pricing changes, and license updates.',
      'You must keep your login credentials secure and notify BeatHaven immediately if you suspect unauthorized access.',
      'You may not create duplicate, deceptive, or impersonation-based accounts for yourself or for any other creator.',
    ],
  },
  {
    eyebrow: 'Seller Agreement',
    points: [
      'You may only upload beats, stems, artwork, and previews that you own or are fully authorized to distribute commercially.',
      'Any samples, loops, vocals, or third-party materials included in your content must be properly cleared for the licenses you are offering.',
      'You must clearly describe what each license includes, including trackouts, stems, publishing rights, exclusivity, and performance limitations.',
      'BeatHaven may remove content that appears to infringe rights, violate policy, misrepresent ownership, or create legal risk for buyers.',
    ],
  },
  {
    eyebrow: 'Terms and Conditions',
    points: [
      'You agree to maintain fair pricing, honest listing descriptions, and delivery expectations that match the actual product being sold.',
      'You may not manipulate plays, reviews, sales metrics, rankings, or buyer communication through spam, fake traffic, or misleading claims.',
      'Refunds, revisions, file replacements, and support responses must be handled in a timely and professional manner when your listing promises them.',
      'BeatHaven may suspend seller tools, hold payouts, or restrict marketplace visibility if repeated complaints, disputes, or policy violations occur.',
    ],
  },
  {
    eyebrow: 'Payments',
    points: [
      'Platform fees, payment processor fees, taxes, and chargeback adjustments may be deducted before seller payouts are finalized.',
      'Payout timing may vary based on payment provider processing windows, account verification status, and fraud or dispute reviews.',
      'You are responsible for maintaining valid payout details and for reporting your own taxes as required in your jurisdiction.',
      'BeatHaven may delay or withhold payouts tied to suspicious transactions, unresolved customer disputes, or policy enforcement actions.',
    ],
  },
  {
    eyebrow: 'Policy Enforcement',
    points: [
      'Serious violations including copyright abuse, fraud, harassment, or repeated deceptive listings may lead to immediate account suspension.',
      'If your seller access is restricted, BeatHaven may remove listings, pause checkout, cancel active offers, or request additional verification.',
      'Termination of seller privileges does not remove your responsibility for existing customer disputes, refunds, tax obligations, or legal claims.',
      'Continued use of seller tools after policy updates means you accept the latest agreement and marketplace operating rules.',
    ],
  },
];

const SellerAgreementPage: React.FC = () => {
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
          <div className="relative z-[120] border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]">
                    <Music2 size={18} className="text-[#0B0B0B]" />
                  </div>
                  <span className="text-base font-bold tracking-tight text-white sm:text-xl">
                    Beat<span className="text-[#1ED760]">Haven</span>
                  </span>
                </Link>

                <div className="hidden lg:flex items-center gap-3 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-3 text-sm text-[#B3B3B3] lg:min-w-[360px]">
                  <Search size={16} className="text-[#6B7280]" />
                  <span>Search beats, licenses, producers, lyrics</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
                  className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/95 px-2.5 py-1.5 text-[11px] text-white transition-colors duration-200 hover:border-[#1ED760] sm:px-4 sm:py-2.5 sm:text-sm"
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
                  className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/100 px-2.5 py-1.5 text-[11px] text-white transition-colors duration-200 hover:border-[#1ED760] sm:px-4 sm:py-2.5 sm:text-sm"
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
                  className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/100 px-2.5 py-1.5 text-[11px] text-white transition-colors duration-200 hover:border-[#1ED760] sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Browse
                  <ChevronDown size={16} className={openDropdown === 'browse' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>
                {openDropdown === 'browse' ? (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[420px]">
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

        <section className="relative z-0 mx-auto max-w-7xl space-y-8 px-4 pb-8 pt-[11rem] sm:px-5 sm:pb-10 sm:pt-[12rem] lg:px-7">
          <div className="glass rounded-[2rem] border border-[#262626] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  Marketplace rules, terms,
                  <span className="gradient-text"> and seller responsibilities.</span>
                </h1>
              </div>
              <div className="rounded-[1.5rem] border border-[#2A2A2A] bg-[#121212]/85 px-5 py-4 text-sm text-[#B3B3B3]">
                Last reviewed: March 18, 2026
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {agreementSections.map((section) => (
              <div key={section.eyebrow} className="glass rounded-[1.8rem] border border-[#262626] p-6 sm:p-7">
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">{section.eyebrow}</h2>
                <div className="mt-5 space-y-3">
                  {section.points.map((point, index) => (
                    <div
                      key={point}
                      className="rounded-[1.25rem] border border-[#262626] bg-[#121212]/90 px-4 py-4 text-sm leading-relaxed text-[#C8C8C8]"
                    >
                      <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#171717] text-xs font-semibold text-[#1ED760]">
                        {index + 1}
                      </span>
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SellerAgreementPage;








