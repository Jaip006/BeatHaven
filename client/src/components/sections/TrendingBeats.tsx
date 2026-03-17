import React from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import BeatCard from '../ui/BeatCard';
import { Button } from '../ui/Button';
import type { Beat } from '../../types';

const mockBeats: Beat[] = [
  {
    id: '1',
    title: 'Midnight Drip',
    producerName: 'TrapKing808',
    producerId: 'p1',
    genre: 'Trap',
    bpm: 140,
    key: 'Am',
    price: 29,
    coverImage: `https://picsum.photos/seed/beat1/400/400`,
    tags: ['trap', 'dark', '808'],
    plays: 18400,
    likes: 1230,
  },
  {
    id: '2',
    title: 'Neon Vibes',
    producerName: 'SynthWave_',
    producerId: 'p2',
    genre: 'R&B',
    bpm: 90,
    key: 'Dm',
    price: 39,
    coverImage: `https://picsum.photos/seed/beat2/400/400`,
    tags: ['rnb', 'chill', 'melodic'],
    plays: 24100,
    likes: 2050,
  },
  {
    id: '3',
    title: 'Lagos Nights',
    producerName: 'AfroGod_',
    producerId: 'p3',
    genre: 'Afrobeats',
    bpm: 105,
    key: 'F',
    price: 45,
    coverImage: `https://picsum.photos/seed/beat3/400/400`,
    tags: ['afrobeats', 'dancehall', 'party'],
    plays: 31800,
    likes: 3100,
  },
  {
    id: '4',
    title: 'Cold World',
    producerName: 'DrillMaestro',
    producerId: 'p4',
    genre: 'Drill',
    bpm: 144,
    key: 'Gm',
    price: 35,
    coverImage: `https://picsum.photos/seed/beat4/400/400`,
    tags: ['drill', 'uk', 'dark'],
    plays: 15600,
    likes: 980,
  },
  {
    id: '5',
    title: 'Lotus Dream',
    producerName: 'ChillVibes_',
    producerId: 'p5',
    genre: 'Lo-Fi',
    bpm: 75,
    key: 'C',
    price: 19,
    coverImage: `https://picsum.photos/seed/beat5/400/400`,
    tags: ['lofi', 'chill', 'study'],
    plays: 9800,
    likes: 720,
  },
  {
    id: '6',
    title: 'Gold Rush',
    producerName: 'HipHopLegend',
    producerId: 'p6',
    genre: 'Hip-Hop',
    bpm: 95,
    key: 'Bb',
    price: 49,
    coverImage: `https://picsum.photos/seed/beat6/400/400`,
    tags: ['hiphop', 'boom-bap', 'golden'],
    plays: 42000,
    likes: 4400,
  },
  {
    id: '7',
    title: 'Electric Feel',
    producerName: 'EDMFactory',
    producerId: 'p7',
    genre: 'Electronic',
    bpm: 128,
    key: 'A',
    price: 55,
    coverImage: `https://picsum.photos/seed/beat7/400/400`,
    tags: ['edm', 'electronic', 'festival'],
    plays: 28000,
    likes: 2800,
  },
  {
    id: '8',
    title: 'Heartbreak Hotel',
    producerName: 'MelancholyBeat',
    producerId: 'p8',
    genre: 'Pop',
    bpm: 118,
    key: 'Em',
    price: 42,
    coverImage: `https://picsum.photos/seed/beat8/400/400`,
    tags: ['pop', 'emotional', 'melodic'],
    plays: 19500,
    likes: 1600,
  },
];

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
          {mockBeats.map((beat) => (
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
