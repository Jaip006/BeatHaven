import React, { useEffect, useState } from 'react';
import {
  AtSign,
  Copy,
  Edit2,
  ExternalLink,
  Instagram,
  Link2,
  Music2,
  SlidersHorizontal,
  Twitter,
  Youtube,
  Check,
  X,
  Mic2,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import { getAuthSession, getUserInitials, type AuthUser } from '../utils/auth';
import { authFetch } from '../utils/authFetch';

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'];
const beatOptions = ['My Beats', 'Draft Uploads'];
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};
const browseSections = [
  { title: 'Sales', items: ['Orders Received', 'Payouts', 'Customers'] },
  { title: 'Workspace', items: ['Analytics', 'Licenses', 'Upload Queue'] },
];

const BEATHAVEN_BASE = 'beathaven.com/@';

// ── helpers ────────────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: 'green' | 'purple' | 'blue';
}> = ({ icon, title, subtitle, children, accent = 'green' }) => {
  const accentColor =
    accent === 'green'
      ? 'text-[#1ED760]'
      : accent === 'purple'
        ? 'text-[#7C5CFF]'
        : 'text-blue-400';

  return (
    <div className="rounded-[1.6rem] border border-[#262626] bg-[#0F0F0F]/80 backdrop-blur-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex items-start gap-3 border-b border-[#1E1E1E]">
        <div className={`mt-0.5 ${accentColor}`}>{icon}</div>
        <div>
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
};

// ── Social link row ────────────────────────────────────────────────────────

interface SocialPlatform {
  key: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  prefix: string;
  color: string;
}

interface StudioProfile {
  studioName?: string;
  handle?: string;
  bio?: string;
  socials?: Record<string, string>;
}

const platforms: SocialPlatform[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: <Instagram size={16} />,
    placeholder: 'your_username',
    prefix: 'instagram.com/',
    color: 'text-pink-400',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: <Youtube size={16} />,
    placeholder: '@yourchannel',
    prefix: 'youtube.com/',
    color: 'text-red-400',
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    icon: <Twitter size={16} />,
    placeholder: 'your_handle',
    prefix: 'x.com/',
    color: 'text-sky-400',
  },
  {
    key: 'spotify',
    label: 'Spotify',
    icon: <Music2 size={16} />,
    placeholder: 'artist/your-name',
    prefix: 'open.spotify.com/',
    color: 'text-[#1ED760]',
  },
  {
    key: 'soundcloud',
    label: 'SoundCloud',
    icon: <Mic2 size={16} />,
    placeholder: 'your-profile',
    prefix: 'soundcloud.com/',
    color: 'text-orange-400',
  },
  {
    key: 'website',
    label: 'Personal Website',
    icon: <Link2 size={16} />,
    placeholder: 'https://yoursite.com',
    prefix: '',
    color: 'text-[#7C5CFF]',
  },
];

// ── Main Component ─────────────────────────────────────────────────────────

const StudioSetupPage: React.FC = () => {
  const [currentUser] = useState<AuthUser | null>(getAuthSession()?.user ?? null);

  /* studio name */
  const [studioName, setStudioName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  /* studio handle */
  const [handle, setHandle] = useState('');
  const [handleSaved, setHandleSaved] = useState(false);
  const [handleError, setHandleError] = useState('');
  const [copied, setCopied] = useState(false);

  /* bio */
  const [bio, setBio] = useState('');
  const BIO_LIMIT = 280;

  /* social links */
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchStudioProfile = async () => {
      try {
        const res = await authFetch(`${import.meta.env.VITE_API_URL}/beats/studio`);
        const data = await res.json();
        if (!data.success) return;

        const profile: StudioProfile = data.data?.profile ?? {};
        setStudioName(profile.studioName ?? '');
        setTempName(profile.studioName ?? '');
        setHandle(profile.handle ?? '');
        setHandleSaved(Boolean(profile.handle));
        setBio(profile.bio ?? '');
        setSocials(profile.socials ?? {});
      } catch (err) {
        console.error('Failed to fetch studio profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchStudioProfile();
  }, []);

  /* derived */
  const initials = getUserInitials(currentUser?.displayName ?? 'User');
  const profileUrl = `${BEATHAVEN_BASE}${handle || 'yourhandle'}`;

  const handleSaveName = () => {
    setStudioName(tempName.trim() || studioName);
    setEditingName(false);
  };

  const validateHandle = (val: string) => /^[a-z0-9._-]{3,30}$/.test(val);

  const handleSaveHandle = () => {
    if (handle && !validateHandle(handle)) {
      setHandleError('Handle must be 3–30 chars: lowercase letters, numbers, _ . -');
      return;
    }
    setHandleError('');
    setHandleSaved(true);
  };

  const handleSaveStudioSettings = async () => {
    if (handle && !validateHandle(handle)) {
      setHandleError('Handle must be 3-30 chars: lowercase letters, numbers, _ . -');
      return;
    }
    const resolvedStudioName = (editingName ? tempName : studioName).trim();

    setSaveError('');
    setSaveMessage('');
    setIsSaving(true);

    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/beats/studio/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioName: resolvedStudioName,
          handle: handle.trim().toLowerCase(),
          bio: bio.trim(),
          socials,
        }),
      });

      const raw = await res.text();
      let data: { success?: boolean; message?: string; error?: { code?: string }; data?: { profile?: StudioProfile } } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { success?: boolean; message?: string; error?: { code?: string }; data?: { profile?: StudioProfile } };
        } catch {
          data = {};
        }
      }
      if (!res.ok || !data.success) {
        const fallback = `Failed to save studio settings (HTTP ${res.status}).`;
        setSaveError(data.message || fallback);
        return;
      }

      const profile: StudioProfile = data.data?.profile ?? {};
      setStudioName(profile.studioName ?? '');
      setTempName(profile.studioName ?? '');
      setHandle(profile.handle ?? '');
      setHandleSaved(Boolean(profile.handle));
      setBio(profile.bio ?? '');
      setSocials(profile.socials ?? {});
      setEditingName(false);
      setSaveMessage('Studio settings updated successfully.');
    } catch (err) {
      console.error('Failed to save studio settings', err);
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        setSaveError('Your session expired. Please sign in again and retry.');
        return;
      }
      if (err instanceof Error && err.message.trim()) {
        setSaveError(err.message);
        return;
      }
      setSaveError('Failed to save studio settings. Please check server connection and retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    void navigator.clipboard.writeText(`https://${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateSocial = (key: string, val: string) =>
    setSocials((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-16 left-[-8rem] h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-8rem] h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        {/* ── Navbar ── */}
        <div className="fixed inset-x-0 top-0 z-[100] border-b border-[#262626] bg-[#0B0B0B]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="relative z-[120]">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
              <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]">
                  <Music2 size={18} className="text-[#0B0B0B]" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Beat<span className="text-[#1ED760]">Haven</span>
                </span>
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
                        <Link key={option} to={dashboardRoutes[option]} className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
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
                        <button key={option} className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
                          {option}
                        </button>
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
                                <button key={item} className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white">
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <UserQuickActions />
              </div>
            </div>
          </div>
        </div>

        <section className="relative z-0 mx-auto max-w-3xl space-y-5 px-4 pb-16 pt-[7.5rem] sm:px-5 sm:pt-[8.25rem] lg:px-7">

          {/* Header */}
          <div className="mb-2 flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] text-lg font-black text-[#0B0B0B] shadow-[0_0_20px_rgba(30,215,96,0.2)]">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Studio Setup</h1>
              <p className="mt-0.5 text-sm text-[#6B7280]">
                Customise your public producer profile on BeatHaven.
              </p>
            </div>
          </div>
          {isLoading && (
            <p className="text-sm text-[#6B7280]">Loading saved studio settings...</p>
          )}

          {/* Live preview pill */}
          {handle && handleSaved && (
            <div className="flex items-center justify-between rounded-[0.9rem] border border-[#1ED760]/20 bg-[#1ED760]/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[#1ED760]">
                <Store size={14} />
                <span className="font-medium">beathaven.com/</span>
                <span className="font-bold">@{handle}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-xl border border-[#1ED760]/30 bg-[#1ED760]/10 px-3 py-1.5 text-xs font-medium text-[#1ED760] transition-all duration-200 hover:bg-[#1ED760]/20"
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              1. STUDIO NAME
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Store size={18} />}
            title="Studio Name"
            subtitle="This is what buyers see on your beats and public profile. You can change it anytime."
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                  Display Name
                </label>
                {!editingName ? (
                  <button
                    onClick={() => { setTempName(studioName); setEditingName(true); }}
                    className="flex items-center gap-1 text-[11px] text-[#1ED760] transition-opacity hover:opacity-80"
                  >
                    <Edit2 size={11} /> Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveName} className="flex items-center gap-1 text-[11px] text-[#1ED760] hover:opacity-80">
                      <Check size={11} /> Save
                    </button>
                    <button onClick={() => setEditingName(false)} className="flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-white">
                      <X size={11} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              {editingName ? (
                <input
                  type="text"
                  autoFocus
                  maxLength={60}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="e.g. LoFi Lab, Trap Syndicate…"
                  className="rounded-[0.85rem] border border-[#1ED760]/50 bg-[#121212] px-4 py-3 text-sm text-white outline-none ring-1 ring-[#1ED760]/20 placeholder-[#4B4B4B]"
                />
              ) : (
                <div
                  onClick={() => { setTempName(studioName); setEditingName(true); }}
                  className="cursor-text rounded-[0.85rem] border border-[#262626] bg-[#121212] px-4 py-3 text-sm transition-colors duration-150 hover:border-[#1ED760]/30"
                >
                  {studioName
                    ? <span className="text-white">{studioName}</span>
                    : <span className="text-[#4B4B4B]">Click to set your studio name…</span>}
                </div>
              )}
              <p className="text-[11px] text-[#4B4B4B]">
                Tip — keep it short and memorable. Max 60 characters.
              </p>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════
              2. STUDIO HANDLE
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<AtSign size={18} />}
            title="Studio Handle"
            subtitle="Your unique shareable link on BeatHaven. Lowercase letters, numbers, _ . - only."
            accent="purple"
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                  Handle
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {/* prefix badge */}
                  <div className="flex w-full items-center justify-center gap-1.5 rounded-[0.85rem] border border-[#262626] bg-[#0B0B0B] px-3 py-3 text-xs font-medium text-[#7C5CFF] sm:w-auto sm:justify-start">
                    beathaven.com/@
                  </div>
                  <input
                    type="text"
                    value={handle}
                    maxLength={30}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                      setHandle(v);
                      setHandleSaved(false);
                      setHandleError('');
                    }}
                    placeholder="yourhandle"
                    className="min-w-0 flex-1 rounded-[0.85rem] border border-[#262626] bg-[#121212] px-4 py-3 text-sm text-white placeholder-[#4B4B4B] outline-none focus:border-[#7C5CFF]/60 focus:ring-1 focus:ring-[#7C5CFF]/20"
                  />
                  <button
                    onClick={handleSaveHandle}
                    className="w-full rounded-[0.85rem] bg-[#7C5CFF] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6D4FF5] active:scale-95 sm:w-auto"
                  >
                    {handleSaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
                {handleError && (
                  <p className="text-[11px] text-red-400">{handleError}</p>
                )}
              </div>

              <div className="flex flex-col items-start gap-3 rounded-[0.85rem] border border-[#1E1E1E] bg-[#0B0B0B] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 size={13} className="text-[#4B4B4B] flex-shrink-0" />
                  <span className="text-xs text-[#6B7280] truncate">
                    https://<span className="text-[#7C5CFF]">beathaven.com/@</span>
                    <span className="text-white">{handle || 'yourhandle'}</span>
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#161616] px-3 py-1.5 text-[11px] font-medium text-[#B3B3B3] transition-all duration-200 hover:text-white"
                >
                  {copied ? <Check size={11} className="text-[#1ED760]" /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════
              3. BIO
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<SlidersHorizontal size={18} />}
            title="Bio"
            subtitle="Tell buyers about your style, experience and vibe. Shown on your public studio page."
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                  About You
                </label>
                <span className={`text-[11px] ${bio.length > BIO_LIMIT * 0.9 ? 'text-yellow-400' : 'text-[#4B4B4B]'}`}>
                  {bio.length}/{BIO_LIMIT}
                </span>
              </div>
              <textarea
                value={bio}
                maxLength={BIO_LIMIT}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="e.g. Producer from Mumbai crafting cinematic trap, lo-fi and Bollywood fusion beats. Available for custom work…"
                className="w-full resize-none rounded-[0.85rem] border border-[#262626] bg-[#121212] px-4 py-3 text-sm text-white placeholder-[#4B4B4B] outline-none focus:border-[#1ED760]/60 focus:ring-1 focus:ring-[#1ED760]/20 leading-relaxed"
              />
              <p className="text-[11px] text-[#4B4B4B]">
                A great bio increases your chance of getting hired for custom beats.
              </p>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════
              4. SOCIAL MEDIA HANDLES
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Link2 size={18} />}
            title="Social Media Links"
            subtitle="Connect your socials — they'll appear on your public studio page to build credibility."
            accent="purple"
          >
            <div className="space-y-3">
              {platforms.map((p) => (
                <div key={p.key} className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                    {p.label}
                  </label>
                  <div className="flex items-center gap-2">
                    {/* icon badge */}
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[0.75rem] border border-[#262626] bg-[#0F0F0F] ${p.color}`}>
                      {p.icon}
                    </div>
                    <div className="relative flex-1 flex items-center">
                      {p.prefix && (
                        <span className="absolute left-3 text-xs text-[#4B4B4B] select-none pointer-events-none whitespace-nowrap hidden sm:inline">
                          {p.prefix}
                        </span>
                      )}
                      <input
                        type="text"
                        value={socials[p.key] ?? ''}
                        onChange={(e) => updateSocial(p.key, e.target.value)}
                        placeholder={p.placeholder}
                        className={`w-full rounded-[0.85rem] border border-[#262626] bg-[#121212] py-3 text-sm text-white placeholder-[#4B4B4B] outline-none transition-all duration-200 focus:border-[#7C5CFF]/60 focus:ring-1 focus:ring-[#7C5CFF]/20 ${p.prefix ? 'px-4 sm:pl-32' : 'px-4'}`}
                      />
                    </div>
                    {/* external preview */}
                    {socials[p.key] && (
                      <a
                        href={p.prefix ? `https://${p.prefix}${socials[p.key]}` : socials[p.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-[0.75rem] border border-[#262626] bg-[#161616] text-[#6B7280] transition-colors duration-200 hover:text-white"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── Save Footer ── */}
          <div className="pt-2 pb-4 flex justify-center">
            <button
              onClick={handleSaveStudioSettings}
              disabled={isSaving || isLoading}
              className="rounded-[1rem] bg-gradient-to-r from-[#1ED760] to-[#17C955] px-10 py-4 text-sm font-bold text-[#0B0B0B] shadow-[0_4px_24px_rgba(30,215,96,0.3)] transition-all duration-200 hover:shadow-[0_4px_36px_rgba(30,215,96,0.45)] active:scale-[0.99] tracking-wide disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save Studio Settings'}
            </button>
          </div>
          {saveError && (
            <p className="text-center text-sm text-red-400 pb-6">{saveError}</p>
          )}
          {saveMessage && !saveError && (
            <p className="text-center text-sm text-[#1ED760] pb-6">{saveMessage}</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default StudioSetupPage;









