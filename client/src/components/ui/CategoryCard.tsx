import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <div
      className="group relative bg-[#121212] border border-[#262626] rounded-2xl p-5 hover:border-[#1ED760]/30 hover:bg-[#1A1A1A] transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
    >
      {/* Gradient glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"
        style={{ background: category.gradient }}
      />

      {/* Icon box */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: category.gradient, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
      >
        {category.icon}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-semibold text-white mb-1 group-hover:text-[#1ED760] transition-colors duration-200">
            {category.label}
          </h3>
          <p className="text-sm text-[#6B7280]">{category.count.toLocaleString()} beats</p>
        </div>
        <ArrowRight
          size={18}
          className="text-[#6B7280] group-hover:text-[#1ED760] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
        />
      </div>
    </div>
  );
};

export default CategoryCard;
