import React from 'react';
import { LayoutGrid } from 'lucide-react';
import CategoryCard from '../ui/CategoryCard';
import type { Category } from '../../types';

const mockCategories: Category[] = [
  {
    id: 'c1',
    label: 'Trap',
    icon: '🔥',
    count: 8420,
    gradient: 'linear-gradient(135deg, #FF4444, #FF8C00)',
  },
  {
    id: 'c2',
    label: 'Drill',
    icon: '⚡',
    count: 5300,
    gradient: 'linear-gradient(135deg, #1ED760, #00B4D8)',
  },
  {
    id: 'c3',
    label: 'R&B',
    icon: '💜',
    count: 4210,
    gradient: 'linear-gradient(135deg, #7C5CFF, #C77DFF)',
  },
  {
    id: 'c4',
    label: 'Hip-Hop',
    icon: '🎤',
    count: 12800,
    gradient: 'linear-gradient(135deg, #FFD700, #FF8C00)',
  },
  {
    id: 'c5',
    label: 'Afrobeats',
    icon: '🌍',
    count: 3900,
    gradient: 'linear-gradient(135deg, #00C896, #1ED760)',
  },
  {
    id: 'c6',
    label: 'Pop',
    icon: '🌟',
    count: 6100,
    gradient: 'linear-gradient(135deg, #FF6B9D, #FF4444)',
  },
  {
    id: 'c7',
    label: 'Electronic',
    icon: '🎛️',
    count: 7400,
    gradient: 'linear-gradient(135deg, #00B4D8, #7C5CFF)',
  },
  {
    id: 'c8',
    label: 'Lo-Fi',
    icon: '☕',
    count: 2700,
    gradient: 'linear-gradient(135deg, #8B7355, #C9A96E)',
  },
];

const Categories: React.FC = () => {
  return (
    <section id="categories" className="py-24 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-3">
            <LayoutGrid size={18} className="text-[#1ED760]" />
            <span className="text-sm font-semibold text-[#1ED760] uppercase tracking-widest">
              Browse By Genre
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Beat Categories
          </h2>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Find the perfect sound for your style. From hard-hitting trap to smooth lo-fi, we've got every genre covered.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
