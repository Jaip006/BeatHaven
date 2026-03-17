import React from 'react';
import { Check, X, Shield, FileAudio, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/Button';

const licenses = [
  {
    id: 'basic',
    name: 'Basic Lease',
    price: 29.99,
    fileType: 'High Quality MP3',
    icon: FileAudio,
    color: '#1ED760',
    glow: 'rgba(30,215,96,0.15)',
    features: [
      { text: 'Used for Music Recording', included: true },
      { text: 'Distribute up to 3,000 copies', included: true },
      { text: '500,000 Audio Streams', included: true },
      { text: '1 Music Video', included: true },
      { text: 'For Profit Live Performances', included: false },
      { text: 'Radio Broadcasting Rights', included: false },
      { text: 'Trackout Stems Included', included: false },
    ],
    isPopular: false,
  },
  {
    id: 'premium',
    name: 'Premium Lease',
    price: 59.99,
    fileType: 'WAV + MP3',
    icon: Shield,
    color: '#7C5CFF',
    glow: 'rgba(124,92,255,0.15)',
    features: [
      { text: 'Used for Music Recording', included: true },
      { text: 'Distribute up to 10,000 copies', included: true },
      { text: '1,000,000 Audio Streams', included: true },
      { text: '2 Music Videos', included: true },
      { text: 'For Profit Live Performances', included: true },
      { text: 'Radio Broadcasting Rights', included: false },
      { text: 'Trackout Stems Included', included: false },
    ],
    isPopular: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited Trackout',
    price: 149.99,
    fileType: 'WAV + STEMS + MP3',
    icon: LayoutGrid,
    color: '#1ED760',
    glow: 'rgba(30,215,96,0.15)',
    features: [
      { text: 'Used for Music Recording', included: true },
      { text: 'Unlimited Distribution', included: true },
      { text: 'Unlimited Audio Streams', included: true },
      { text: 'Unlimited Music Videos', included: true },
      { text: 'For Profit Live Performances', included: true },
      { text: 'Radio Broadcasting Rights', included: true },
      { text: 'Trackout Stems Included', included: true },
    ],
    isPopular: false,
  },
];

const Licensing: React.FC = () => {
  return (
    <section id="licensing" className="py-24 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-[#1ED760] uppercase tracking-widest mb-3 block">
            Clear Usage Rights
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Licensing Options
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Choose the license that fits your career stage. Every beat comes with instant delivery and a clear contract.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {licenses.map((license) => {
            const Icon = license.icon;
            return (
              <div
                key={license.id}
                className={`relative bg-[#121212] border rounded-3xl p-8 flex flex-col h-full transition-all duration-300 hover:-translate-y-2 ${
                  license.isPopular
                    ? 'border-[#7C5CFF]/50 shadow-[0_0_40px_rgba(124,92,255,0.1)] z-10 lg:-mt-4 lg:mb-4'
                    : 'border-[#262626] hover:border-[#1ED760]/30 hover:shadow-[0_0_40px_rgba(30,215,96,0.05)]'
                }`}
              >
                {/* Popular Badge */}
                {license.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#7C5CFF] to-[#6a4de0] text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${license.color}22, ${license.color}11)`,
                      border: `1px solid ${license.color}33`,
                    }}
                  >
                    <Icon size={24} style={{ color: license.color }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{license.name}</h3>
                    <p className="text-[#B3B3B3] text-sm font-medium">{license.fileType}</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                  {license.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check size={18} className="text-[#1ED760] shrink-0 mt-0.5" />
                      ) : (
                        <X size={18} className="text-[#262626] shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-[#B3B3B3]' : 'text-[#6B7280]'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <Button
                  variant={license.isPopular ? 'accent' : 'secondary'}
                  className={`w-full ${!license.isPopular && 'hover:bg-[#1A1A1A] hover:text-[#1ED760] hover:border-[#1ED760]'}`}
                >
                  Browse Beats
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Licensing;
