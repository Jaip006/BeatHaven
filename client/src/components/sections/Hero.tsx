import React from 'react';
import { Play, ChevronDown, Zap, Star } from 'lucide-react';
import { Button } from '../ui/Button';

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
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-gradient pt-16">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#1ED760]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#7C5CFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1ED760]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Announcement badge */}
        <div className="inline-flex items-center gap-2 bg-[#121212] border border-[#262626] rounded-full px-4 py-2 mb-8 text-sm">
          <Zap size={14} className="text-[#1ED760]" />
          <span className="text-[#B3B3B3]">New beats added daily by top producers</span>
          <Star size={12} className="text-[#7C5CFF]" />
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black mb-6 leading-[1.05] tracking-tight">
          <span className="text-white">Where Hits</span>
          <br />
          <span className="gradient-text">Get Made.</span>
        </h1>

        {/* Sub copy */}
        <p className="text-lg sm:text-xl text-[#B3B3B3] max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover and license premium beats from the India's top producers.
          Preview with studio-quality waveforms for your next big track.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">
            <Play size={18} fill="currentColor" />
            Browse Beats
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            Sell Your Beats
          </Button>
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
