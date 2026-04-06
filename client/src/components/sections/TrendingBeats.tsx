import React from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import BeatCard from '../ui/BeatCard';
import { Button } from '../ui/Button';
import { trendingBeats } from '../../data/trendingBeats';

const TrendingBeats: React.FC = () => {
  return (
    <section id="trending" className="py-24 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-[#1ED760]" />
              <span className="text-sm font-semibold text-[#1ED760] uppercase tracking-widest">
                Right Now
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Trending Beats
            </h2>
            <p className="text-[#6B7280] mt-2">The hottest beats producers are licensing this week</p>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5">
            View All <ArrowRight size={14} />
          </Button>
        </div>

        {/* Beats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {trendingBeats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
        </div>

        <div className="flex justify-center mt-10 sm:hidden">
          <Button variant="secondary">View All Beats <ArrowRight size={14} /></Button>
        </div>
      </div>
    </section>
  );
};

export default TrendingBeats;
