import React, { useState } from 'react';
import { Play, Pause, Heart, ShoppingCart, Music } from 'lucide-react';
import type { Beat } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatPrice, formatCount } from '../../utils/formatters';

interface BeatCardProps {
  beat: Beat;
  onPlay?: (beat: Beat) => void;
}

const BeatCard: React.FC<BeatCardProps> = ({ beat, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    onPlay?.(beat);
  };

  return (
    <div className="group relative bg-[#121212] border border-[#262626] rounded-2xl overflow-hidden hover:border-[#1ED760]/40 hover:bg-[#1A1A1A] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(30,215,96,0.12)]">
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden">
        {beat.coverImage ? (
          <img
            src={beat.coverImage}
            alt={beat.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1A1A1A] to-[#0B0B0B] flex items-center justify-center">
            <Music size={40} className="text-[#262626]" />
          </div>
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button overlay */}
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <div className="w-14 h-14 rounded-full bg-[#1ED760] text-[#0B0B0B] flex items-center justify-center shadow-[0_0_30px_rgba(30,215,96,0.5)] hover:scale-110 transition-transform duration-200">
            {isPlaying ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" className="ml-1" />
            )}
          </div>
        </button>

        {/* Genre badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="primary">{beat.genre}</Badge>
        </div>

        {/* Like button */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          aria-label="Like"
        >
          <Heart
            size={14}
            className={liked ? 'text-red-500 fill-red-500' : 'text-white'}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate mb-1 group-hover:text-[#1ED760] transition-colors duration-200">
          {beat.title}
        </h3>
        <p className="text-sm text-[#B3B3B3] truncate mb-3">{beat.producerName}</p>

        {/* Stats row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="outline">{beat.bpm} BPM</Badge>
          <Badge variant="outline">{beat.key}</Badge>
          <span className="text-xs text-[#6B7280] ml-auto">{formatCount(beat.plays)} plays</span>
        </div>

        {/* Price + Cart */}
        <div className="flex items-center justify-between">
          <span className="text-[#1ED760] font-bold text-lg">{formatPrice(beat.price)}</span>
          <Button size="sm" variant="primary" className="gap-1.5">
            <ShoppingCart size={13} />
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BeatCard;
