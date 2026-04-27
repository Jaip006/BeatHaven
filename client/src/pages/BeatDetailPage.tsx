import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Music, MoreVertical, Pause, Pin, Play, Send, Share2, Smile, Trash2, User } from 'lucide-react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import UserQuickActions from '../components/layout/UserQuickActions';
import type { Beat } from '../types';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { usePlayer } from '../context/PlayerContext';
import { Badge } from '../components/ui/Badge';
import PriceButton from '../components/ui/PriceButton';
import LicensePurchaseModal from '../components/ui/LicensePurchaseModal';
import { getAuthSession } from '../utils/auth';
import { authFetch } from '../utils/authFetch';

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'] as const;
const beatOptions = ['My Beats', 'Draft Uploads'] as const;
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};
const browseSections = [
  { title: 'Sales', items: ['Orders Received', 'Payouts', 'Customers'] },
  { title: 'Workspace', items: ['Analytics', 'Licenses', 'Upload Queue'] },
];
const beatOptionRoutes: Record<string, string> = {
  'My Beats': '/studio',
  'Draft Uploads': '/dashboard/seller/upload',
};
const browseItemRoutes: Record<string, string> = {
  'Orders Received': '/dashboard/seller',
  Payouts: '/dashboard/seller',
  Customers: '/dashboard/seller',
  Analytics: '/dashboard/seller',
  Licenses: '/dashboard/seller',
  'Upload Queue': '/dashboard/seller/upload',
};

interface BeatDetail extends Beat {
  moods?: string[];
  beatType?: string;
  createdAt?: string;
}

interface Comment {
  id: string;
  text: string;
  pinned: boolean;
  createdAt: string;
  user: { id: string; displayName: string; avatar: string };
}

const parseFreeMp3Enabled = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const BeatDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playBeat, currentBeat, isPlaying, togglePlay } = usePlayer();

  const [beat, setBeat] = useState<BeatDetail | null>(null);
  const [moreBeats, setMoreBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/beats/${id}` : '';
  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareUrl(true);
      window.setTimeout(() => setCopiedShareUrl(false), 1800);
    } catch { /* ignore */ }
  };

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = commentInputRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? commentText.length;
      const end = textarea.selectionEnd ?? commentText.length;
      const newText = commentText.slice(0, start) + emojiData.emoji + commentText.slice(end);
      setCommentText(newText);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
      });
    } else {
      setCommentText((prev) => prev + emojiData.emoji);
    }
  };

  const session = getAuthSession();
  const currentUserId = session?.user?.id;
  const isOwnBeat = Boolean(currentUserId && beat && currentUserId === beat.producerId);
  const isCurrentlyPlaying = currentBeat?.id === beat?.id && isPlaying;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      const res = await fetch(`${API_BASE_URL}/beats/${id}`);
      const data = await res.json();
      if (cancelled) return;
      if (!data.success) { navigate('/'); return; }

      const b = data.data as BeatDetail;
      setBeat(b);

      fetch(`${API_BASE_URL}/beats/by-producer/${b.producerId}?exclude=${id}&limit=6`)
        .then((r) => r.json())
        .then((d) => { if (!cancelled && d.success) setMoreBeats(d.data.beats ?? []); })
        .catch(() => null)
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    load().catch(() => { if (!cancelled) { navigate('/'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setCommentLoading(true);

    fetch(`${API_BASE_URL}/beats/${id}/comments?limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) {
          setComments(d.data.comments ?? []);
          setCommentTotal(d.data.total ?? 0);
        }
      })
      .catch(() => null)
      .finally(() => { if (!cancelled) setCommentLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  const handlePlay = () => {
    if (!beat?.audioUrl) return;
    if (currentBeat?.id === beat.id) { togglePlay(); return; }
    playBeat({
      id: beat.id, title: beat.title, producerName: beat.producerName,
      coverImage: beat.coverImage, audioUrl: beat.audioUrl,
      bpm: beat.bpm, price: beat.price, genre: beat.genre,
      freeMp3Enabled: parseFreeMp3Enabled(beat.freeMp3Enabled),
    });
    void authFetch(`${import.meta.env.VITE_API_URL}/beats/${beat.id}/play`, { method: 'POST' }).catch(() => null);
  };

  const handleMoreBeatPlay = (b: Beat) => {
    if (!b.audioUrl) return;
    if (currentBeat?.id === b.id) { togglePlay(); return; }
    playBeat({
      id: b.id, title: b.title, producerName: b.producerName,
      coverImage: b.coverImage, audioUrl: b.audioUrl,
      bpm: b.bpm, price: b.price, genre: b.genre,
      freeMp3Enabled: parseFreeMp3Enabled(b.freeMp3Enabled),
    });
    void authFetch(`${import.meta.env.VITE_API_URL}/beats/${b.id}/play`, { method: 'POST' }).catch(() => null);
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || submitting) return;
    if (!session) { navigate('/sign-in'); return; }

    setSubmitting(true);
    setCommentError(null);
    try {
      const res = await authFetch(`/beats/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [data.data, ...prev]);
        setCommentTotal((prev) => prev + 1);
        setCommentText('');
      } else {
        setCommentError(data.message || 'Failed to post comment.');
      }
    } catch (err) {
      console.error('Comment submit error:', err);
      setCommentError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinComment = async (commentId: string) => {
    setOpenMenuId(null);
    try {
      const res = await authFetch(`/beats/${id}/comments/${commentId}/pin`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev
            .map((c) => (c.id === commentId ? { ...c, pinned: data.data.pinned } : c))
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
        );
      }
    } catch (err) {
      console.error('Pin error:', err);
    }
  };

  const handleRemoveComment = async (commentId: string) => {
    setOpenMenuId(null);
    try {
      const res = await authFetch(`/beats/${id}/comments/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentTotal((prev) => prev - 1);
      }
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#1ED760] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!beat) return null;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white pb-32 pt-[65px]">
      {/* ── Header ── */}
      <div className="fixed inset-x-0 top-0 z-[100] border-b border-[#262626] bg-[#0B0B0B]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <img
              src="/beathaven.png"
              alt="BeatHaven logo"
              className="h-9 w-9 rounded-xl object-cover shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]"
            />
            <span className="hidden text-xl font-bold tracking-tight text-white sm:inline">Beat<span className="text-[#1ED760]">Haven</span></span>
          </Link>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                  Dashboard
                  <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                </button>
                <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  {dashboardOptions.map((option) => (
                    <Link key={option} to={dashboardRoutes[option]}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                      {option}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                  Beats
                  <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                </button>
                <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  {beatOptions.map((option) => (
                    <Link key={option} to={beatOptionRoutes[option] ?? '/'} className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                      {option}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:text-white">
                  Browse
                  <span className="absolute -bottom-0.5 left-2 h-px w-0 bg-[#1ED760] transition-all duration-300 group-hover:w-[calc(100%-1rem)]" />
                </button>
                <div className="invisible absolute left-0 top-full z-[120] mt-1 w-[420px] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {browseSections.map((section) => (
                      <div key={section.title}>
                        <div className="space-y-2">
                          {section.items.map((item) => (
                            <Link key={item} to={browseItemRoutes[item] ?? '/'} className="block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white">
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Link to="/community" className="px-2 py-2 text-sm text-[#B3B3B3] hover:text-[#1ED760] transition-colors duration-200">Community</Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <UserQuickActions />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Main grid: left content + right sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-8 lg:gap-12">

          {/* ── Left column ───────────────────────────────────────── */}
          <div className="min-w-0">
            {/* Beat hero */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 mb-10">

              {/* ── Top row: cover + identity (always side-by-side) ── */}
              <div className="flex flex-row gap-4 sm:contents">
                {/* Cover */}
                <div className="flex-shrink-0 w-36 sm:w-52 lg:w-60 aspect-square rounded-2xl overflow-hidden bg-[#121212] border border-[#262626]">
                  {beat.coverImage ? (
                    <img src={beat.coverImage} alt={beat.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={48} className="text-[#262626]" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col justify-end gap-3 flex-1 min-w-0">
                  <div>
                    <p className="text-xs font-semibold text-[#1ED760] uppercase tracking-widest mb-1">
                      {beat.genre}
                    </p>
                    <h1 className="text-lg sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-2 break-words">
                      {beat.title}
                    </h1>
                    <button
                      onClick={() => beat.producerHandle && navigate(`/studio?handle=${beat.producerHandle}`)}
                      className="flex items-center gap-2 text-[#B3B3B3] hover:text-white transition-colors"
                    >
                      <User size={14} />
                      <span className="text-sm">{beat.producerName}</span>
                    </button>
                  </div>

                  {/* Badges / tags / plays — hidden on mobile, shown sm+ */}
                  <div className="hidden sm:flex flex-wrap gap-2">
                    <Badge variant="outline">{beat.bpm} BPM</Badge>
                    <Badge variant="outline">{beat.key}</Badge>
                    {beat.beatType && <Badge variant="outline">{beat.beatType}</Badge>}
                    {beat.moods?.map((mood) => <Badge key={mood} variant="outline">{mood}</Badge>)}
                  </div>

                  {beat.tags?.length > 0 && (
                    <div className="hidden sm:flex flex-wrap gap-1.5">
                      {beat.tags.map((tag) => (
                        <span key={tag} className="text-xs text-[#6B7280] bg-[#1A1A1A] border border-[#262626] px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="hidden sm:flex items-center gap-4 text-sm text-[#6B7280]">
                    <span>{beat.plays?.toLocaleString()} plays</span>
                    <span>{beat.likes?.toLocaleString()} likes</span>
                  </div>

                  {/* Buttons — sm+ only */}
                  <div className="hidden sm:flex items-center gap-3 flex-wrap">
                    {beat.audioUrl && (
                      <button
                        onClick={handlePlay}
                        className="flex items-center gap-2 bg-[#1ED760] hover:bg-[#19c453] text-[#0B0B0B] font-bold px-5 py-2.5 rounded-full transition-colors"
                      >
                        {isCurrentlyPlaying
                          ? <Pause size={16} fill="currentColor" />
                          : <Play size={16} fill="currentColor" className="ml-0.5" />}
                        {isCurrentlyPlaying ? 'Pause' : 'Preview'}
                      </button>
                    )}
                    <button
                      onClick={() => { setIsShareModalOpen(true); setCopiedShareUrl(false); }}
                      className="flex items-center gap-2 border border-[#262626] hover:border-[#1ED760]/50 text-[#B3B3B3] hover:text-white px-5 py-2.5 rounded-full transition-colors"
                    >
                      <Share2 size={15} />
                      Share
                    </button>
                    {!isOwnBeat && (
                      <PriceButton price={beat.price} onClick={() => {
                        if (!session) { navigate('/sign-in'); return; }
                        setIsLicenseModalOpen(true);
                      }} />
                    )}
                  </div>
                </div>
              </div>

              {/* ── Mobile-only: badges / tags / plays / buttons below ── */}
              <div className="flex sm:hidden flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{beat.bpm} BPM</Badge>
                  <Badge variant="outline">{beat.key}</Badge>
                  {beat.beatType && <Badge variant="outline">{beat.beatType}</Badge>}
                  {beat.moods?.map((mood) => <Badge key={mood} variant="outline">{mood}</Badge>)}
                </div>

                {beat.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {beat.tags.map((tag) => (
                      <span key={tag} className="text-xs text-[#6B7280] bg-[#1A1A1A] border border-[#262626] px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                  <span>{beat.plays?.toLocaleString()} plays</span>
                  <span>{beat.likes?.toLocaleString()} likes</span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {beat.audioUrl && (
                    <button
                      onClick={handlePlay}
                      className="flex items-center gap-2 bg-[#1ED760] hover:bg-[#19c453] text-[#0B0B0B] font-bold px-5 py-2.5 rounded-full transition-colors"
                    >
                      {isCurrentlyPlaying
                        ? <Pause size={16} fill="currentColor" />
                        : <Play size={16} fill="currentColor" className="ml-0.5" />}
                      {isCurrentlyPlaying ? 'Pause' : 'Preview'}
                    </button>
                  )}
                  <button
                    onClick={() => { setIsShareModalOpen(true); setCopiedShareUrl(false); }}
                    className="flex items-center gap-2 border border-[#262626] hover:border-[#1ED760]/50 text-[#B3B3B3] hover:text-white px-5 py-2.5 rounded-full transition-colors"
                  >
                    <Share2 size={15} />
                    Share
                  </button>
                  {!isOwnBeat && (
                    <PriceButton price={beat.price} onClick={() => {
                      if (!session) { navigate('/sign-in'); return; }
                      setIsLicenseModalOpen(true);
                    }} />
                  )}
                </div>
              </div>

            </div>

            {/* ── Comments section ───────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare size={18} className="text-[#1ED760]" />
                <h2 className="text-lg font-bold text-white">
                  Comments <span className="text-[#6B7280] font-normal text-sm ml-1">{commentTotal > 0 ? commentTotal : ''}</span>
                </h2>
              </div>

              {/* Input */}
              <div className="flex gap-3 mb-8">
                <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#262626] flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {session?.user?.avatar ? (
                    <img src={session.user.avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User size={16} className="text-[#6B7280]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="relative flex items-end gap-2 border-b border-[#262626] focus-within:border-[#1ED760] transition-colors">
                    {session && (
                      <div className="relative flex-shrink-0 pb-[3px]">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker((v) => !v)}
                          className="text-[#6B7280] hover:text-[#1ED760] transition-colors"
                          aria-label="Emoji picker"
                        >
                          <Smile size={16} />
                        </button>
                        {showEmojiPicker && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                            <div className="absolute left-0 top-8 z-40">
                              <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                theme={Theme.DARK}
                                lazyLoadEmojis
                                skinTonesDisabled
                                height={380}
                                width={300}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmitComment(); } }}
                      placeholder={session ? 'Add a comment…' : 'Sign in to comment'}
                      disabled={!session || submitting}
                      rows={1}
                      className="flex-1 bg-transparent outline-none text-sm text-white placeholder-[#6B7280] py-2 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  {commentError && (
                    <p className="text-xs text-red-400 mt-2">{commentError}</p>
                  )}
                  {commentText.trim() && (
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setCommentText(''); setShowEmojiPicker(false); }}
                        className="text-xs text-[#6B7280] hover:text-white px-3 py-1.5 rounded-full transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleSubmitComment()}
                        disabled={submitting}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-[#1ED760] hover:bg-[#19c453] text-[#0B0B0B] px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                      >
                        <Send size={12} />
                        {submitting ? 'Posting…' : 'Comment'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment list */}
              {commentLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-[#1A1A1A] flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 w-24 bg-[#1A1A1A] rounded" />
                        <div className="h-3 w-full bg-[#1A1A1A] rounded" />
                        <div className="h-3 w-3/4 bg-[#1A1A1A] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[#6B7280] text-sm">No comments yet. Be the first!</p>
              ) : (
                <div className="space-y-6">
                  {comments.map((c) => {
                    const canPin = currentUserId === beat.producerId;
                    const canRemove = currentUserId === c.user.id || currentUserId === beat.producerId;
                    const showMenu = canPin || canRemove;
                    return (
                      <div key={c.id} className="flex gap-3 relative">
                        <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#262626] flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {c.user.avatar ? (
                            <img src={c.user.avatar} className="w-full h-full object-cover" alt={c.user.displayName} />
                          ) : (
                            <User size={14} className="text-[#6B7280]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{c.user.displayName}</span>
                            <span className="text-xs text-[#6B7280]">{timeAgo(c.createdAt)}</span>
                            {c.pinned && (
                              <span className="flex items-center gap-0.5 text-[10px] text-[#1ED760]">
                                <Pin size={10} />
                                Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[#D1D5DB] leading-relaxed break-words">{c.text}</p>
                        </div>

                        {/* Three-dot menu */}
                        {showMenu && (
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full text-[#6B7280] hover:text-white hover:bg-[#262626] transition-colors"
                            >
                              <MoreVertical size={14} />
                            </button>
                            {openMenuId === c.id && (
                              <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-[#262626] bg-[#111] shadow-[0_8px_24px_rgba(0,0,0,0.5)] overflow-hidden">
                                  {canPin && (
                                    <button
                                      onClick={() => void handlePinComment(c.id)}
                                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-[#D1D5DB] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                                    >
                                      <Pin size={13} className="text-[#1ED760]" />
                                      {c.pinned ? 'Unpin' : 'Pin'}
                                    </button>
                                  )}
                                  {canRemove && (
                                    <button
                                      onClick={() => void handleRemoveComment(c.id)}
                                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-[#FCA5A5] hover:bg-[#1A1A1A] hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 size={13} />
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── Right sidebar: more from producer ─────────────── */}
          {moreBeats.length > 0 && (
            <aside className="lg:sticky lg:top-[60px] lg:self-start">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#0D0D0D]">
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-[#1A1A1A]">
                  <p className="text-[10px] font-semibold text-[#1ED760] uppercase tracking-[0.2em] mb-1">More from</p>
                  <h2 className="text-base font-bold">
                    <span
                      className={`truncate transition-colors duration-150 ${beat.producerHandle ? 'hover:text-[#1ED760] cursor-pointer' : ''} text-white`}
                      onClick={() => beat.producerHandle && navigate(`/studio?handle=${beat.producerHandle}`)}
                    >
                      {beat.producerName}
                    </span>
                  </h2>
                </div>

                {/* Beat list */}
                <div className="p-3 space-y-1">
                  {moreBeats.map((b) => {
                    const isActive = currentBeat?.id === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => navigate(`/beats/${b.id}`)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer group transition-all duration-150 ${
                          isActive ? 'bg-[#1ED760]/10 border border-[#1ED760]/20' : 'hover:bg-[#171717] border border-transparent'
                        }`}
                      >
                        {/* Cover with play overlay */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                          {b.coverImage ? (
                            <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                              <Music size={16} className="text-[#444]" />
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMoreBeatPlay(b); }}
                            className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                          >
                            {isActive && isPlaying
                              ? <Pause size={14} fill="currentColor" className="text-[#1ED760]" />
                              : <Play size={14} fill="currentColor" className="text-white ml-0.5" />}
                          </button>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate transition-colors duration-150 ${
                            isActive ? 'text-[#1ED760]' : 'text-white group-hover:text-[#1ED760]'
                          }`}>
                            {b.title}
                          </p>
                          <p className="text-xs text-[#6B7280] truncate mt-0.5">
                            {b.genre} · {b.bpm} BPM
                          </p>
                        </div>

                        {/* Price tag */}
                        <span className="text-xs font-semibold text-[#6B7280] flex-shrink-0">
                          ₹{b.price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {!isOwnBeat && beat && (
        <LicensePurchaseModal
          beat={beat}
          isOpen={isLicenseModalOpen}
          onClose={() => setIsLicenseModalOpen(false)}
        />
      )}

      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#101010] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-[#6B7280] hover:text-white transition-colors text-lg leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {beat.coverImage && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#171717] border border-[#262626]">
                <img src={beat.coverImage} alt={beat.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{beat.title}</p>
                  <p className="text-xs text-[#6B7280] truncate">{beat.producerName}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-[#6B7280] mb-2">Beat link</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 min-w-0 rounded-xl border border-[#262626] bg-[#171717] px-3 py-2 text-xs text-[#D1D5DB] outline-none"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={() => void handleCopyShareUrl()}
                className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                  copiedShareUrl
                    ? 'bg-[#1ED760]/20 text-[#1ED760]'
                    : 'bg-[#1ED760] text-[#0B0B0B] hover:bg-[#19c453]'
                }`}
              >
                {copiedShareUrl ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeatDetailPage;
