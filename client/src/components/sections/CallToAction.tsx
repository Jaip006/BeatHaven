import React from 'react';
import { Play, Upload, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

const CallToAction: React.FC = () => {
  return (
    <section id="cta" className="py-24 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA banner */}
        <div className="relative overflow-hidden rounded-3xl border border-[#1ED760]/20 bg-gradient-to-br from-[#0d1a12] via-[#0B0B0B] to-[#130d2a] p-12 sm:p-16 text-center mb-12">
          {/* Background orbs */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#1ED760]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#7C5CFF]/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(#1ED760 1px, transparent 1px), linear-gradient(90deg, #1ED760 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-full px-4 py-1.5 text-sm text-[#1ED760] font-medium mb-6">
              ✨ Join 200,000+ artists worldwide
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Ready to Create
              <br />
              <span className="gradient-text">Your Next Hit?</span>
            </h2>
            <p className="text-[#B3B3B3] text-lg max-w-xl mx-auto mb-10">
              Start browsing premium beats for free. No credit card required.
              Your music journey starts right here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" size="lg">
                <Play size={18} fill="currentColor" />
                Browse Beats Free
              </Button>
              <Button variant="secondary" size="lg">
                Learn More <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Split CTA for buyer and producer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buyer CTA */}
          <div className="group bg-[#121212] border border-[#262626] rounded-2xl p-8 hover:border-[#1ED760]/40 hover:bg-[#1A1A1A] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(30,215,96,0.1)]">
            <div className="w-12 h-12 rounded-xl bg-[#1ED760]/10 border border-[#1ED760]/20 flex items-center justify-center mb-5">
              <Play size={22} className="text-[#1ED760]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">I'm an Artist</h3>
            <p className="text-[#6B7280] text-sm mb-6 leading-relaxed">
              Browse thousands of beats, preview with full waveforms, and license the perfect track for your next release.
            </p>
            <Button variant="outline" size="md">
              Browse Beats <ArrowRight size={14} />
            </Button>
          </div>

          {/* Producer CTA */}
          <div className="group bg-[#121212] border border-[#262626] rounded-2xl p-8 hover:border-[#7C5CFF]/40 hover:bg-[#1A1A1A] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(124,92,255,0.1)]">
            <div className="w-12 h-12 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 flex items-center justify-center mb-5">
              <Upload size={22} className="text-[#7C5CFF]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">I'm a Producer</h3>
            <p className="text-[#6B7280] text-sm mb-6 leading-relaxed">
              Upload your beats, set your prices, and start earning. Reach thousands of artists looking for your unique sound.
            </p>
            <Button variant="accent" size="md">
              Start Selling <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
