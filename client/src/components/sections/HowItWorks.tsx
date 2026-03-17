import React from 'react';
import { Search, Headphones, CreditCard } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Browse & Discover',
    description:
      'Explore thousands of premium beats across every genre. Filter by BPM, key, mood, and style to find your perfect sound.',
    color: '#1ED760',
    glow: 'rgba(30,215,96,0.2)',
  },
  {
    number: '02',
    icon: Headphones,
    title: 'Preview with Waveform',
    description:
      'Listen to beats in full using our professional waveform player. Visualize the sound and feel every drop before you buy.',
    color: '#7C5CFF',
    glow: 'rgba(124,92,255,0.2)',
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'License & Download',
    description:
      'Choose your license type — Basic, Premium, or Exclusive — and instantly download your beat with full usage rights.',
    color: '#1ED760',
    glow: 'rgba(30,215,96,0.2)',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#1ED760] uppercase tracking-widest mb-3 block">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            How It Works
          </h2>
          <p className="text-[#6B7280] max-w-lg mx-auto">
            From discovery to download in three simple steps. Your next hit is just minutes away.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative flex flex-col items-center text-center bg-[#121212] border border-[#262626] rounded-2xl p-8 hover:border-[#1ED760]/30 hover:-translate-y-1 transition-all duration-300"
                  style={{
                    '--glow': step.glow,
                  } as React.CSSProperties}
                >
                  {/* Number */}
                  <div className="text-6xl font-black text-[#1A1A1A] mb-4 absolute top-4 right-6 leading-none select-none">
                    {step.number}
                  </div>

                  {/* Icon circle */}
                  <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}22, ${step.color}11)`,
                      border: `1px solid ${step.color}33`,
                      boxShadow: `0 0 20px ${step.glow}`,
                    }}
                  >
                    <Icon size={28} style={{ color: step.color }} />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
