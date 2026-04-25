import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, FileText, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import { Button } from '../components/ui/Button';
import { authFetch } from '../utils/authFetch';

type LyricSong = {
  id: string;
  title: string;
  lyrics: string;
  updatedAt: number;
};

const resolveTitleLabel = (title: string) => title.trim() || 'Untitled';
type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type ApiLyricSong = {
  id: string;
  title: string;
  lyrics: string;
  createdAt?: string;
  updatedAt: string;
};

const parseApiSong = (song: ApiLyricSong): LyricSong => ({
  id: String(song.id ?? '').trim(),
  title: String(song.title ?? 'Untitled'),
  lyrics: String(song.lyrics ?? ''),
  updatedAt: Date.parse(String(song.updatedAt ?? '')) || Date.now(),
});

const MyLyricsPage: React.FC = () => {
  const [songs, setSongs] = useState<LyricSong[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});

  const lastSavedRef = useRef<Record<string, { title: string; lyrics: string }>>({});
  const saveVersionRef = useRef<Record<string, number>>({});
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadSongs = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const res = await authFetch('/lyrics');
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(String(data?.message ?? 'Failed to load lyrics.'));
        }

        const rawSongs = (data?.data?.songs ?? []) as ApiLyricSong[];
        const hydrated = rawSongs.map(parseApiSong).filter((song) => Boolean(song.id));
        hydrated.sort((a, b) => b.updatedAt - a.updatedAt);

        if (isCancelled) return;

        setSongs(hydrated);
        setSelectedSongId(hydrated[0]?.id ?? '');
        lastSavedRef.current = hydrated.reduce(
          (acc, song) => {
            acc[song.id] = { title: song.title, lyrics: song.lyrics };
            return acc;
          },
          {} as Record<string, { title: string; lyrics: string }>,
        );
        setSaveStatus({});
      } catch (err) {
        if (isCancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to load lyrics.');
        setSongs([]);
        setSelectedSongId('');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSongs();

    return () => {
      isCancelled = true;
    };
  }, []);

  const selectedSong = useMemo(
    () => songs.find((song) => song.id === selectedSongId) ?? null,
    [songs, selectedSongId],
  );

  const saveSong = async (song: LyricSong) => {
    const version = (saveVersionRef.current[song.id] ?? 0) + 1;
    saveVersionRef.current[song.id] = version;
    setSaveStatus((prev) => ({ ...prev, [song.id]: 'saving' }));

    try {
      const res = await authFetch(`/lyrics/${song.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: song.title, lyrics: song.lyrics }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(String(data?.message ?? 'Failed to save.'));
      }

      const apiSong = data?.data?.song as ApiLyricSong | undefined;
      const savedSong = apiSong ? parseApiSong(apiSong) : { ...song, updatedAt: Date.now() };

      if (saveVersionRef.current[song.id] !== version) {
        return;
      }

      lastSavedRef.current[song.id] = { title: savedSong.title, lyrics: savedSong.lyrics };
      setSongs((prev) => prev.map((item) => (item.id === song.id ? { ...item, ...savedSong } : item)).sort((a, b) => b.updatedAt - a.updatedAt));
      setSaveStatus((prev) => ({ ...prev, [song.id]: 'saved' }));

      window.setTimeout(() => {
        setSaveStatus((prev) => (prev[song.id] === 'saved' ? { ...prev, [song.id]: 'idle' } : prev));
      }, 1200);
    } catch {
      if (saveVersionRef.current[song.id] !== version) {
        return;
      }
      setSaveStatus((prev) => ({ ...prev, [song.id]: 'error' }));
    }
  };

  useEffect(() => {
    if (!selectedSong) return;

    const last = lastSavedRef.current[selectedSong.id];
    const isSameAsLast =
      last &&
      resolveTitleLabel(selectedSong.title) === resolveTitleLabel(last.title) &&
      selectedSong.lyrics === last.lyrics;

    if (isSameAsLast) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void saveSong({ ...selectedSong, title: resolveTitleLabel(selectedSong.title) });
    }, 800);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [selectedSong]);

  const handleCreateSong = async () => {
    try {
      const res = await authFetch('/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', lyrics: '' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(String(data?.message ?? 'Failed to create lyric sheet.'));
      }

      const apiSong = data?.data?.song as ApiLyricSong | undefined;
      if (!apiSong) {
        throw new Error('Failed to create lyric sheet.');
      }
      const createdSong = parseApiSong(apiSong);
      lastSavedRef.current[createdSong.id] = { title: createdSong.title, lyrics: createdSong.lyrics };
      setSaveStatus((prev) => ({ ...prev, [createdSong.id]: 'idle' }));
      setSongs((prev) => [createdSong, ...prev].sort((a, b) => b.updatedAt - a.updatedAt));
      setSelectedSongId(createdSong.id);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to create lyric sheet.');
    }
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      const res = await authFetch(`/lyrics/${songId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(String(data?.message ?? 'Failed to delete lyric sheet.'));
      }

      setSongs((prev) => {
        const next = prev.filter((song) => song.id !== songId);
        setSelectedSongId((prevSelected) => (prevSelected === songId ? next[0]?.id ?? '' : prevSelected));
        if (selectedSongId === songId) setMobileView('list');
        return next;
      });
      setSaveStatus((prev) => {
        const next = { ...prev };
        delete next[songId];
        return next;
      });
      delete lastSavedRef.current[songId];
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to delete lyric sheet.');
    }
  };

  const updateSelectedSong = (patch: Partial<Pick<LyricSong, 'title' | 'lyrics'>>) => {
    if (!selectedSongId) return;
    setSongs((prev) =>
      prev
        .map((song) =>
          song.id === selectedSongId
            ? {
                ...song,
                ...patch,
                updatedAt: Date.now(),
              }
            : song,
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    );
    setSaveStatus((prev) => ({ ...prev, [selectedSongId]: 'dirty' }));
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="pointer-events-none absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-8rem] top-56 h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px]" />

        <header className="sticky top-0 z-[110] border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link to="/dashboard/buyer">
                <Button variant="secondary" size="sm" className="px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm">
                  <ArrowLeft size={14} />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-white sm:text-3xl">My Lyrics</h1>
              </div>
            </div>
            <div className="shrink-0">
              <UserQuickActions />
            </div>
          </div>
        </header>

        <section className="relative z-0 mx-auto max-w-7xl px-4 pb-12 pt-7 sm:px-5 lg:px-7">
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <aside className={`glass h-fit rounded-[1.8rem] border border-[#262626] p-5 sm:p-6 ${mobileView === 'editor' ? 'hidden lg:block' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#121212] text-[#7C5CFF]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Songs</h2>
                    <p className="text-xs text-[#9CA3AF]">{songs.length} saved</p>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => { void handleCreateSong(); setMobileView('editor'); }}>
                  <Plus size={16} className="mr-1" />
                  New
                </Button>
              </div>

              <div className="mt-5 space-y-2">
                {isLoading ? (
                  <div className="rounded-2xl border border-[#262626] bg-[#0B0B0B]/40 p-4 text-sm text-[#B3B3B3]">
                    Loading your lyric sheets...
                  </div>
                ) : loadError ? (
                  <div className="rounded-2xl border border-[#3B1F1F] bg-[#0B0B0B]/40 p-4 text-sm text-[#FCA5A5]">
                    {loadError}
                  </div>
                ) : songs.length === 0 ? (
                  null
                ) : (
                  songs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => { setSelectedSongId(song.id); setMobileView('editor'); }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                        song.id === selectedSongId
                          ? 'border-[#1ED760]/40 bg-[#121212] text-white'
                          : 'border-[#262626] bg-[#0B0B0B]/30 text-[#B3B3B3] hover:bg-[#121212]/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{resolveTitleLabel(song.title)}</p>
                          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                            {song.lyrics.trim() ? song.lyrics.trim().split('\n')[0] : 'No lyrics yet'}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-[#6B7280]">
                          {new Date(song.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <div className={`glass rounded-[1.8rem] border border-[#262626] p-5 sm:p-6 ${mobileView === 'list' ? 'hidden lg:block' : ''}`}>
              <button
                onClick={() => setMobileView('list')}
                className="lg:hidden flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft size={15} /> Back to songs
              </button>
              {!selectedSong ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] text-[#1ED760]">
                    <FileText size={22} />
                  </div>
                  <h2 className="mt-4 text-2xl font-bold">Start writing</h2>
                  <p className="mt-2 max-w-sm text-sm text-[#B3B3B3]">
                    Create a new lyric sheet and your words will appear here.
                  </p>
                  <div className="mt-6">
                    <Button variant="primary" onClick={() => { void handleCreateSong(); }}>
                      <Plus size={18} className="mr-2" />
                      New Lyric Sheet
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="min-w-0">
                    <label className="text-xs uppercase tracking-[0.28em] text-[#9CA3AF]">Title</label>
                    <div className="mt-2 flex gap-3">
                      <input
                        value={selectedSong.title}
                        onChange={(e) => updateSelectedSong({ title: e.target.value })}
                        className="flex-1 rounded-2xl border border-[#262626] bg-[#0B0B0B]/30 px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-[#1ED760]/50"
                        placeholder="Song title"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { void handleDeleteSong(selectedSong.id); }}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-[#FCA5A5]/40 bg-[#FCA5A5]/5 px-4 py-1 text-xs font-medium text-[#FCA5A5] transition-colors hover:bg-[#FCA5A5]/15"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className=" text-xs text-[#6B7280]">
                      <span className="mr-1">
                        {saveStatus[selectedSong.id] === 'saving' ? 'Saving...' : null}
                        {saveStatus[selectedSong.id] === 'dirty' ? 'Unsaved' : null}
                        {saveStatus[selectedSong.id] === 'saved' ? 'Saved' : null}
                        {saveStatus[selectedSong.id] === 'error' ? 'Save failed' : null}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.28em] text-[#9CA3AF]">Lyrics</label>
                    <textarea
                      value={selectedSong.lyrics}
                      onChange={(e) => updateSelectedSong({ lyrics: e.target.value })}
                      placeholder="Write your lyrics here..."
                      className="mt-2 min-h-[420px] w-full resize-y rounded-2xl border border-[#262626] bg-[#0B0B0B]/30 px-4 py-4 text-xs leading-relaxed text-white outline-none transition-colors focus:border-[#7C5CFF]/55"
                    />
                    <p className="mt-2 text-xs text-[#6B7280]">
                      Auto-saved to your account.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyLyricsPage;
