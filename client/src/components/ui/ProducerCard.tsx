import React from 'react';
import { CheckCircle, Music } from 'lucide-react';
import type { Producer } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCount } from '../../utils/formatters';

interface ProducerCardProps {
  producer: Producer;
}

const ProducerCard: React.FC<ProducerCardProps> = ({ producer }) => {
  return (
    <div className="group bg-[#121212] border border-[#262626] rounded-2xl p-6 hover:border-[#7C5CFF]/40 hover:bg-[#1A1A1A] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(124,92,255,0.12)] flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#262626] group-hover:border-[#7C5CFF] transition-colors duration-300">
          {producer.avatar ? (
            <img
              src={producer.avatar}
              alt={producer.displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#7C5CFF]/30 to-[#1ED760]/20 flex items-center justify-center">
              <Music size={28} className="text-[#7C5CFF]" />
            </div>
          )}
        </div>
        {/* Online indicator */}
        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-[#1ED760] rounded-full border-2 border-[#121212]" />
      </div>

      {/* Name + Verified */}
      <div className="flex items-center gap-1.5 mb-1">
        <h3 className="font-semibold text-white group-hover:text-[#7C5CFF] transition-colors duration-200">
          {producer.displayName}
        </h3>
        {producer.verified && (
          <CheckCircle size={14} className="text-[#1ED760] flex-shrink-0" />
        )}
      </div>

      {/* Genres */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {producer.genres.slice(0, 3).map((genre) => (
          <Badge key={genre} variant="accent">{genre}</Badge>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-5 text-sm">
        <div>
          <p className="text-white font-bold">{producer.beatCount}</p>
          <p className="text-[#6B7280] text-xs">Beats</p>
        </div>
        <div className="w-px h-8 bg-[#262626]" />
        <div>
          <p className="text-white font-bold">{formatCount(producer.followers)}</p>
          <p className="text-[#6B7280] text-xs">Followers</p>
        </div>
      </div>

      {/* Follow Button */}
      <Button variant="outline" size="sm" className="w-full">
        Follow
      </Button>
    </div>
  );
};

export default ProducerCard;
