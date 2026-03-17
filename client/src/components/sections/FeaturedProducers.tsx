import React from 'react';
import { Users, ArrowRight } from 'lucide-react';
import ProducerCard from '../ui/ProducerCard';
import { Button } from '../ui/Button';
import type { Producer } from '../../types';

const mockProducers: Producer[] = [
  {
    id: 'p1',
    displayName: 'TrapKing808',
    avatar: 'https://picsum.photos/seed/prod1/200/200',
    genres: ['Trap', 'Drill', 'Dark'],
    beatCount: 142,
    followers: 24800,
    verified: true,
  },
  {
    id: 'p2',
    displayName: 'SynthWave_',
    avatar: 'https://picsum.photos/seed/prod2/200/200',
    genres: ['R&B', 'Electronic', 'Lo-Fi'],
    beatCount: 89,
    followers: 18200,
    verified: true,
  },
  {
    id: 'p3',
    displayName: 'AfroGod_',
    avatar: 'https://picsum.photos/seed/prod3/200/200',
    genres: ['Afrobeats', 'Dancehall'],
    beatCount: 215,
    followers: 56400,
    verified: true,
  },
  {
    id: 'p4',
    displayName: 'HipHopLegend',
    avatar: 'https://picsum.photos/seed/prod4/200/200',
    genres: ['Hip-Hop', 'Boom Bap'],
    beatCount: 310,
    followers: 92000,
    verified: true,
  },
  {
    id: 'p5',
    displayName: 'ChillVibes_',
    avatar: 'https://picsum.photos/seed/prod5/200/200',
    genres: ['Lo-Fi', 'Jazz', 'Chill'],
    beatCount: 67,
    followers: 11300,
    verified: false,
  },
  {
    id: 'p6',
    displayName: 'EDMFactory',
    avatar: 'https://picsum.photos/seed/prod6/200/200',
    genres: ['Electronic', 'House', 'Techno'],
    beatCount: 190,
    followers: 45600,
    verified: true,
  },
];

const FeaturedProducers: React.FC = () => {
  return (
    <section id="producers" className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-[#7C5CFF]" />
              <span className="text-sm font-semibold text-[#7C5CFF] uppercase tracking-widest">
                Top Producers
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Featured Producers
            </h2>
            <p className="text-[#6B7280] mt-2">Connect with the world's best beat makers</p>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5">
            All Producers <ArrowRight size={14} />
          </Button>
        </div>

        {/* Producers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockProducers.map((producer) => (
            <ProducerCard key={producer.id} producer={producer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducers;
