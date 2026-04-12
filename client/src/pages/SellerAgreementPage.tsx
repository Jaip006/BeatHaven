import React from 'react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';

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
                    <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                      Dashboard
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {dashboardOptions.map((option) => (
                        <Link key={option} to={dashboardRoutes[option]} className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                          {option}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                      Beats
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {beatOptions.map((option) => (
                        <button key={option} className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                      Browse
                      <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-[420px] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
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
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <UserQuickActions />
              </div>
            </div>
          </div>
        </div>

        <section className="relative z-0 mx-auto max-w-7xl space-y-8 px-4 pb-8 pt-[7.5rem] sm:px-5 sm:pb-10 sm:pt-[8.25rem] lg:px-7">
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








