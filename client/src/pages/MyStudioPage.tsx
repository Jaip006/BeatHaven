import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, ShieldCheck, Share2, Expand, ChevronDown, Music2, Search, Trash2, Instagram, Youtube, Twitter, Disc3, Cloud, Globe } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import PriceButton from '../components/ui/PriceButton';
import { getAuthSession } from '../utils/auth';
import { authFetch } from '../utils/authFetch';
import { usePlayer } from '../context/PlayerContext';

type DropdownKey = 'dashboard' | 'beats' | 'browse' | null;

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

interface Beat {
  _id: string;
  title: string;
  tempo: number;
  musicalKey: string;
  basicPrice?: number;
  artworkUrl: string;
  untaggedMp3Url: string;
  sellerId:
    | string
    | {
      displayName?: string;
      avatar?: string;
    };
}

interface Stats {
  plays: number;
  totalBeats: number;
  followers: number;
  verified: boolean;
}

interface StudioProfile {
  ownerId: string;
  studioName: string;
  handle: string;
  bio: string;
  socials: Record<string, string>;
  avatar: string;
  joinedAt: string | null;
  displayName: string;
  mobileVerified?: boolean;
  aadhaarVerified?: boolean;
  isFollowing?: boolean;
}

type SupportedSocialKey = 'instagram' | 'youtube' | 'twitter' | 'spotify' | 'soundcloud' | 'website';

const SOCIAL_META: Record<SupportedSocialKey, { label: string; base?: string; icon: React.ReactNode }> = {
  instagram: { label: 'Instagram', base: 'https://instagram.com/', icon: <Instagram className="h-4 w-4" /> },
  youtube: { label: 'YouTube', base: 'https://youtube.com/', icon: <Youtube className="h-4 w-4" /> },
  twitter: { label: 'X', base: 'https://x.com/', icon: <Twitter className="h-4 w-4" /> },
  spotify: { label: 'Spotify', base: 'https://open.spotify.com/', icon: <Disc3 className="h-4 w-4" /> },
  soundcloud: { label: 'SoundCloud', base: 'https://soundcloud.com/', icon: <Cloud className="h-4 w-4" /> },
  website: { label: 'Website', icon: <Globe className="h-4 w-4" /> },
};

const toSocialHref = (key: SupportedSocialKey, value: string): string => {
  const raw = value.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;

  if (key === 'website') {
    return `https://${raw.replace(/^\/+/, '')}`;
  }

  const noAt = raw.replace(/^@/, '');
  const cleaned = noAt
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '');

  if (key === 'instagram') {
    return `https://instagram.com/${cleaned.replace(/^instagram\.com\//i, '')}`;
  }
  if (key === 'youtube') {
    return `https://youtube.com/${cleaned.replace(/^youtube\.com\//i, '')}`;
  }
  if (key === 'twitter') {
    return `https://x.com/${cleaned.replace(/^(x\.com|twitter\.com)\//i, '')}`;
  }
  if (key === 'spotify') {
    return `https://open.spotify.com/${cleaned.replace(/^open\.spotify\.com\//i, '')}`;
  }
  return `https://soundcloud.com/${cleaned.replace(/^soundcloud\.com\//i, '')}`;
};

const MyStudioPage: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [beatToDelete, setBeatToDelete] = useState<Beat | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const currentUserId = getAuthSession()?.user?.id;
  const [searchParams] = useSearchParams();
  const { playBeat, currentBeat, isPlaying, togglePlay } = usePlayer();

  const toggleDropdown = (key: Exclude<DropdownKey, null>) => {
    setOpenDropdown((current) => (current === key ? null : key));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStudioData = useCallback(async () => {
    try {
      const handle = (searchParams.get('handle') || '').trim().toLowerCase();
      const studioEndpoint = handle
        ? `${import.meta.env.VITE_API_URL}/beats/studio?handle=${encodeURIComponent(handle)}`
        : `${import.meta.env.VITE_API_URL}/beats/studio`;
      const res = await authFetch(studioEndpoint);
      const data = await res.json();
      if (data.success) {
        setBeats(data.data.beats);
        setStats(data.data.stats);
        setProfile(data.data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch studio data", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    void fetchStudioData();
  }, [fetchStudioData]);

  useEffect(() => {
    const handleBeatUploaded = () => {
      void fetchStudioData();
    };
    const handleWindowFocus = () => {
      void fetchStudioData();
    };

    window.addEventListener('beathaven-beat-uploaded', handleBeatUploaded);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('beathaven-beat-uploaded', handleBeatUploaded);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchStudioData]);

  const joinedDate = profile?.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '';

  const studioTitle = profile?.studioName || profile?.displayName || 'My Studio';
  const socialLinks = (Object.entries(profile?.socials ?? []) as Array<[SupportedSocialKey, string]>)
    .map(([key, value]) => ({
      key,
      label: SOCIAL_META[key]?.label ?? key,
      icon: SOCIAL_META[key]?.icon ?? null,
      href: toSocialHref(key, value ?? ''),
    }))
    .filter((item) => Boolean(item.icon && item.href));
  const canFollowStudio = Boolean(profile?.ownerId && currentUserId && profile.ownerId !== currentUserId);
  const canDeleteBeats = Boolean(profile?.ownerId && currentUserId && profile.ownerId === currentUserId);
  const isStudioVerified = Boolean(profile?.mobileVerified && profile?.aadhaarVerified);
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);
  const shareUrl = profile?.handle
    ? `${window.location.origin}/studio?handle=${encodeURIComponent(profile.handle)}`
    : `${window.location.origin}/studio`;

  const handleToggleFollowStudio = async () => {
    if (!profile?.ownerId || !canFollowStudio || isFollowSubmitting) return;

    setIsFollowSubmitting(true);
    try {
      const endpoint = profile.isFollowing
        ? `${import.meta.env.VITE_API_URL}/beats/studio/unfollow`
        : `${import.meta.env.VITE_API_URL}/beats/studio/follow`;

      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.ownerId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        alert(data?.message || 'Failed to update follow status.');
        return;
      }

      const followers = Number(data?.data?.followers ?? stats?.followers ?? 0);
      const following = Boolean(data?.data?.following);

      setProfile((prev) => (prev ? { ...prev, isFollowing: following } : prev));
      setStats((prev) =>
        prev
          ? {
            ...prev,
            followers,
          }
          : prev
      );
    } catch (error) {
      console.error('Failed to update follow status', error);
      alert('Failed to update follow status.');
    } finally {
      setIsFollowSubmitting(false);
    }
  };

  const handleDeleteBeat = (beat: Beat) => {
    setDeleteError(null);
    setBeatToDelete(beat);
  };

  const handleCancelDelete = () => {
    if (isDeleteSubmitting) return;
    setDeleteError(null);
    setBeatToDelete(null);
  };

  const handleConfirmDeleteBeat = async () => {
    if (!beatToDelete?._id) return;
    setIsDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/beats/${beatToDelete._id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setDeleteError(data?.message || 'Failed to delete beat.');
        return;
      }

      setBeats((prev) => prev.filter((beat) => beat._id !== beatToDelete._id));
      setStats((prev) =>
        prev
          ? {
            ...prev,
            totalBeats: Math.max(0, prev.totalBeats - 1),
          }
          : prev
      );
      setBeatToDelete(null);
    } catch (error) {
      console.error('Failed to delete beat', error);
      setDeleteError('Failed to delete beat.');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareUrl(true);
      window.setTimeout(() => setCopiedShareUrl(false), 1800);
    } catch (error) {
      console.error('Failed to copy share URL', error);
      alert('Failed to copy URL.');
    }
  };

  const handlePlayBeat = (beat: Beat) => {
    if (currentBeat?.id === beat._id) {
      togglePlay();
      return;
    }
    playBeat({
      id: beat._id,
      title: beat.title,
      producerName:
        profile?.studioName?.trim() || profile?.displayName || 'Unknown Studio',
      coverImage: beat.artworkUrl,
      audioUrl: beat.untaggedMp3Url,
      bpm: beat.tempo,
      price: beat.basicPrice,
    });
    void authFetch(`${import.meta.env.VITE_API_URL}/beats/${beat._id}/play`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data?.incremented) {
          setStats((prev) => prev ? { ...prev, plays: prev.plays + 1 } : prev);
        }
      })
      .catch(() => null);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-16 left-[-8rem] h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-8rem] h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        {/* ── Header ── */}
        <div className="fixed inset-x-0 top-0 z-[100]">
          <div className="relative z-[120] border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]">
                    <Music2 size={18} className="text-[#0B0B0B]" />
                  </div>
                  <span className="text-base font-bold tracking-tight text-white sm:text-xl">Beat<span className="text-[#1ED760]">Haven</span></span>
                </Link>
                <div className="hidden lg:flex items-center gap-3 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-3 text-sm text-[#B3B3B3] lg:min-w-[360px]">
                  <Search size={16} className="text-[#6B7280]" />
                  <span>Search beats, licenses, producers, lyrics</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <UserQuickActions />
              </div>
            </div>
          </div>

          {/* ── Sub-header ── */}
          <div className="relative z-[110] border-b border-[#262626] bg-[#090909]/80 backdrop-blur-xl">
            <div ref={dropdownContainerRef} className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-5 lg:px-7">
              <div className="relative">
                <button onClick={() => toggleDropdown('dashboard')} className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/95 px-2.5 py-1.5 text-[11px] text-white transition-colors duration-200 hover:border-[#1ED760] sm:px-4 sm:py-2.5 sm:text-sm">
                  Dashboard
                  <ChevronDown size={16} className={openDropdown === 'dashboard' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>
                {openDropdown === 'dashboard' ? (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    {dashboardOptions.map((option) => (
                      <Link key={option} to={dashboardRoutes[option]} onClick={() => setOpenDropdown(null)}
                        className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                        {option}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button onClick={() => toggleDropdown('beats')} className="inline-flex items-center gap-2 rounded-full border border-[#1ED760] bg-[#121212] px-2.5 py-1.5 text-[11px] text-white transition-colors duration-200 sm:px-4 sm:py-2.5 sm:text-sm">
                  Beats
                  <ChevronDown size={16} className={openDropdown === 'beats' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>
                {openDropdown === 'beats' ? (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    {beatOptions.map((option) => (
                      <button key={option} className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button onClick={() => toggleDropdown('browse')} className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/100 px-2.5 py-1.5 text-[11px] text-white transition-colors duration-200 hover:border-[#1ED760] sm:px-4 sm:py-2.5 sm:text-sm">
                  Browse
                  <ChevronDown size={16} className={openDropdown === 'browse' ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
                </button>
                {openDropdown === 'browse' ? (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[420px]">
                    <div className="grid gap-5 sm:grid-cols-2">
                      {browseSections.map((section) => (
                        <div key={section.title}>
                          <div className="space-y-2">
                            {section.items.map((item) => (
                              <button key={item} className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white">
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ── Page Content ── */}
        <section className="relative z-0 mx-auto max-w-7xl px-4 pb-28 pt-[11rem] sm:px-5 sm:pt-[12rem] lg:px-7">
          {loading ? (
            <div className="text-center text-[#B3B3B3] py-20">Loading your studio...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

              {/* Left Sidebar */}
              <div className="space-y-4">
                {/* Profile Card */}
                <div className="bg-[#151515] border border-[#262626] rounded-2xl p-6 text-center">
                  <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden mb-4 bg-[#2A2A2A]">
                    <img src={profile?.avatar } alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                    {studioTitle}
                    {isStudioVerified && (
                      <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                    )}
                  </h2>
                  <p className="text-[#8B5CF6] text-sm mt-1">
                    {profile?.handle ? `@${profile.handle}` : 'Versatile Music Producer'}
                  </p>
                  {joinedDate && (
                    <p className="text-gray-400 text-xs mt-2">Joined {joinedDate}</p>
                  )}

                  <div className="mt-6 flex flex-wrap items-start justify-between gap-4 px-2 sm:px-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{stats?.followers || 0}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{stats?.plays || 0}</p>
                      <p className="text-xs text-gray-500">Plays</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{beats.length}</p>
                      <p className="text-xs text-gray-500">Tracks</p>
                    </div>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="ml-auto rounded-xl border border-[#262626] p-2 text-white transition-colors hover:bg-[#202020]"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-6 flex gap-2">
                    {canFollowStudio && (
                      <button
                        onClick={handleToggleFollowStudio}
                        disabled={isFollowSubmitting}
                        className="w-full rounded-xl bg-purple-600 py-2 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isFollowSubmitting ? 'Please wait...' : profile?.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>

                {/* About Me Card */}
                <div className="bg-[#151515] border border-[#262626] rounded-2xl p-6 relative">
                  <h3 className="font-bold mb-2">About me</h3>
                  <p className="text-sm text-gray-400">
                    {profile?.bio || 'Add your bio from Studio Setup to show buyers your style and vibe.'}
                  </p>
                  {socialLinks.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {socialLinks.map((social) => (
                        <a
                          key={social.key}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                          title={social.label}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1F1F1F] text-[#B3B3B3] transition-colors hover:border-[#1ED760]/50 hover:text-[#1ED760]"
                        >
                          {social.icon}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Area - Beats */}
              <div className="bg-[#151515] border border-[#262626] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Beats</h2>
                  <Expand className="w-4 h-4 text-gray-500" />
                </div>

                <div className="space-y-2">
                  {beats.map((beat) => {
                    const studioNameLabel =
                      profile?.studioName?.trim() ||
                      profile?.displayName ||
                      'Unknown Studio';

                    return (
                    <div key={beat._id} className="group flex flex-col gap-3 rounded-xl p-3 transition-colors hover:bg-[#1A1A1A] sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <button
                          onClick={() => handlePlayBeat(beat)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-all shrink-0 ${
                            currentBeat?.id === beat._id
                              ? 'bg-[#1ED760] text-[#0B0B0B] shadow-[0_0_16px_rgba(30,215,96,0.45)]'
                              : 'bg-white text-black'
                          }`}
                        >
                          {currentBeat?.id === beat._id && isPlaying
                            ? <Pause className="w-5 h-5" />
                            : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        <img
                          src={beat.artworkUrl || "https://images.unsplash.com/photo-1614113489855-66422ad300a4?auto=format&fit=crop&w=100&q=80"}
                          alt={beat.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="truncate text-sm font-bold tracking-tight">{beat.title}</h4>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400 sm:gap-3">
                            <span className="text-orange-500">{studioNameLabel}</span>
                            <span>{beat.tempo} BPM</span>
                            <span>{beat.musicalKey}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        {!canDeleteBeats && <PriceButton price={beat.basicPrice} />}
                        {canDeleteBeats && (
                          <button
                            onClick={() => handleDeleteBeat(beat)}
                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete beat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                  {beats.length === 0 && (
                    <div className="text-center text-gray-500 py-10">No beats uploaded yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-xl rounded-2xl border border-[#2A2A2A] bg-[#121212] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-white">Share Studio Link</h3>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-sm text-[#B3B3B3] hover:text-white"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 text-sm text-[#9CA3AF]">
                Anyone can paste this URL in a browser to view the studio page.
              </p>
              <div className="mt-4 rounded-xl border border-[#2A2A2A] bg-[#0E0E0E] px-4 py-3 text-sm text-[#E5E7EB] break-all">
                {shareUrl}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleCopyShareUrl}
                  className="rounded-xl bg-[#1ED760] px-4 py-2 text-sm font-semibold text-black hover:bg-[#19c453]"
                >
                  {copiedShareUrl ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>
          </div>
        )}
        {beatToDelete && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[#2A2A2A] bg-[#121212] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <h3 className="text-lg font-semibold text-white">Delete Beat?</h3>
              <p className="mt-2 text-sm text-[#B3B3B3]">
                You are about to delete <span className="font-semibold text-white">&quot;{beatToDelete.title}&quot;</span>. This action cannot be undone.
              </p>
              {deleteError ? (
                <p className="mt-3 rounded-lg border border-[#4A1D25] bg-[#2A1015] px-3 py-2 text-xs text-[#FFB4C0]">
                  {deleteError}
                </p>
              ) : null}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={isDeleteSubmitting}
                  className="rounded-xl border border-[#2A2A2A] px-4 py-2 text-sm font-medium text-[#B3B3B3] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteBeat}
                  disabled={isDeleteSubmitting}
                  className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeleteSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyStudioPage;








