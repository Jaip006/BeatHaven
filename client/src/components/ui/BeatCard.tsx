import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Heart, Music } from 'lucide-react';
import type { Beat } from '../../types';
import { Badge } from '../ui/Badge';
import PriceButton from './PriceButton';
import LicensePurchaseModal from './LicensePurchaseModal';
import { getAuthSession } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { useLikedBeats } from '../../context/LikedBeatsContext';

interface BeatCardProps {
  beat: Beat;
  onPlay?: (beat: Beat) => void;
}

const BeatCard: React.FC<BeatCardProps> = ({ beat, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [authPromptCopy, setAuthPromptCopy] = useState<{ title: string; message: string }>({
    title: 'Sign in required',
    message: 'Please sign in or create an account to purchase beats.',
  });
  const navigate = useNavigate();
  const { isLikedBeat, toggleLikedBeat } = useLikedBeats();
  const currentUserId = getAuthSession()?.user?.id;
  const isOwnBeat = Boolean(currentUserId && currentUserId === beat.producerId);
  const liked = isLikedBeat(beat.id);
  const primaryTag = Array.isArray(beat.tags) && beat.tags.length > 0 ? String(beat.tags[0]) : '';
  const formattedPrimaryTag = primaryTag
    ? primaryTag
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
    : '';
  const genreBadgeLabel =
    beat.genre && beat.genre.trim() && beat.genre.toLowerCase() !== 'unknown'
      ? beat.genre
      : (formattedPrimaryTag || 'Unknown');

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    onPlay?.(beat);
  };

  const handlePriceClick = () => {
    if (!getAuthSession()) {
      setAuthPromptCopy({
        title: 'Sign in required',
        message: 'Please sign in or create an account to purchase beats.',
      });
      setIsAuthPromptOpen(true);
      return;
    }
    setIsLicenseModalOpen(true);
  };

  const handleToggleLike = () => {
    if (!getAuthSession()) {
      setAuthPromptCopy({
        title: 'Sign in required',
        message: 'Please sign in or create an account to like beats.',
      });
      setIsAuthPromptOpen(true);
      return;
    }
    toggleLikedBeat(beat);
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
          <Badge variant="primary">{genreBadgeLabel}</Badge>
        </div>

        {/* Like button */}
        <button
          onClick={handleToggleLike}
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
        <h3
          className="font-semibold text-white truncate mb-1 hover:text-[#1ED760] transition-colors duration-200 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); navigate(`/beats/${beat.id}`); }}
        >
          {beat.title}
        </h3>
        <p
          className={`text-sm truncate mb-3 transition-colors duration-200 ${beat.producerHandle ? 'text-[#B3B3B3] hover:text-white cursor-pointer' : 'text-[#B3B3B3]'}`}
          onClick={(e) => {
            if (!beat.producerHandle) return;
            e.stopPropagation();
            navigate(`/studio?handle=${beat.producerHandle}`);
          }}
        >
          {beat.producerName}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="outline">{beat.bpm} BPM</Badge>
          <Badge variant="outline">{beat.key}</Badge>
        </div>

        {/* Price + Cart */}
        {isOwnBeat ? null : (
          <div className="flex items-center justify-end">
            <PriceButton price={beat.price} onClick={handlePriceClick} />
          </div>
        )}
      </div>

      {isOwnBeat ? null : (
        <LicensePurchaseModal
          beat={beat}
          isOpen={isLicenseModalOpen}
          onClose={() => setIsLicenseModalOpen(false)}
        />
      )}

      {isAuthPromptOpen && typeof document !== 'undefined'
        ? createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setIsAuthPromptOpen(false)}>
            <div
              className="w-full max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#101010] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white">{authPromptCopy.title}</h3>
              <p className="mt-2 text-sm text-[#B3B3B3]">
                {authPromptCopy.message}
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/sign-up')}
                  className="rounded-lg border border-[#2A2A2A] px-3 py-2 text-sm text-white transition-colors hover:bg-[#171717]"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/sign-in')}
                  className="rounded-lg bg-[#1ED760] px-3 py-2 text-sm font-semibold text-[#0B0B0B] transition-colors hover:bg-[#19c453]"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
};

export default BeatCard;
