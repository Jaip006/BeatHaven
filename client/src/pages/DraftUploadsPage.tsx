import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileMusic, Trash2, PenLine, Music2 } from 'lucide-react';
import UserQuickActions from '../components/layout/UserQuickActions';
import { getAllDrafts, removeDraft, type StoredDraft } from '../utils/drafts';
import { getAuthSession } from '../utils/auth';


const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'] as const;
const beatOptions = ['My Beats', 'Draft Uploads'] as const;
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};
const beatOptionRoutes: Record<string, string> = {
  'My Beats': '/studio',
  'Draft Uploads': '/dashboard/seller/drafts',
};
const browseItems = ['Analytics', 'My Studio', 'Orders Received'];
const browseItemRoutes: Record<string, string> = {
  'Analytics': '/dashboard/seller',
  'My Studio': '/studio',
  'Orders Received': '/dashboard/seller',
};

const SECTION_LABELS: Record<string, string> = {
  metadata: 'Meta Data',
  media: 'Media Upload',
  license: 'License',
};

const SECTION_COLORS: Record<string, string> = {
  metadata: 'text-[#7C5CFF] bg-[#7C5CFF]/10 border-[#7C5CFF]/20',
  media: 'text-[#1ED760] bg-[#1ED760]/10 border-[#1ED760]/20',
  license: 'text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/20',
};

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

const DraftUploadsPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = getAuthSession()?.user?.id;
  const [drafts, setDrafts] = useState<StoredDraft[]>(() => getAllDrafts(userId));

  const handleDelete = useCallback(
    (id: string) => {
      removeDraft(userId, id);
      setDrafts(getAllDrafts(userId));
    },
    [userId],
  );

  const handleContinue = (id: string) => {
    navigate(`/dashboard/seller/upload?draftId=${id}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-14 left-[-8rem] h-80 w-80 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-9rem] h-80 w-80 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        {/* Navbar */}
        <div className="fixed inset-x-0 top-0 z-[100] border-b border-[#262626] bg-[#0B0B0B]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="relative z-[120]">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
              <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
                <img
                  src="/beathaven.png"
                  alt="BeatHaven logo"
                  className="h-9 w-9 rounded-xl object-cover shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]"
                />
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
                        <Link
                          key={option}
                          to={dashboardRoutes[option]}
                          className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                        >
                          {option}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="group inline-flex items-center gap-1 px-2 py-2 text-sm text-white transition-colors duration-200">
                      Beats
                      <span className="absolute -bottom-0.5 left-2 h-px w-[calc(100%-1rem)] bg-[#1ED760]" />
                    </button>
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {beatOptions.map((option) => (
                        <Link
                          key={option}
                          to={beatOptionRoutes[option] ?? '/'}
                          className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors duration-200 ${
                            option === 'Draft Uploads'
                              ? 'bg-[#161616] text-[#1ED760]'
                              : 'text-[#B3B3B3] hover:bg-[#161616] hover:text-white'
                          }`}
                        >
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
                    <div className="invisible absolute left-0 top-full z-[120] mt-1 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                      {browseItems.map((item) => (
                        <Link
                          key={item}
                          to={browseItemRoutes[item] ?? '/'}
                          className="block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white"
                        >
                          {item}
                        </Link>
                      ))}
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
        </div>

        {/* Page content */}
        <section className="relative z-0 mx-auto max-w-7xl px-4 pb-16 pt-[7.5rem] sm:px-5 sm:pt-[8.25rem] lg:px-7">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Draft Uploads</h1>
              {drafts.length > 0 && (
                <p className="mt-2 text-sm text-[#6B7280]">
                  {drafts.length} saved draft{drafts.length === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </div>

          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#2A2A2A] bg-[#111111]/60 py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A1A1A] text-[#3A3A3A]">
                <Music2 size={32} />
              </div>
              <p className="text-lg font-semibold text-white">No drafts saved</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {drafts.map((draft) => {
                const meta = draft.metadataForm as Record<string, unknown> | undefined;
                const title = (meta?.title as string) || 'Untitled Beat';
                const genre = (meta?.genre as string) || '';
                const tempo = (meta?.tempo as string) || '';
                const section = (draft.activeSection as string) || 'metadata';
                const sectionLabel = SECTION_LABELS[section] ?? section;
                const sectionColor = SECTION_COLORS[section] ?? SECTION_COLORS.metadata;

                return (
                  <div
                    key={draft.id}
                    className="glass flex flex-col rounded-[1.75rem] border border-[#262626] p-5 transition-all duration-200 hover:border-[#3A3A3A]"
                  >
                    {/* Icon + title row */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1A1A1A] text-[#4A4A4A]">
                        <FileMusic size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-white">{title}</p>
                        <p className="mt-0.5 text-xs text-[#6B7280]">{formatDate(draft.savedAt)}</p>
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${sectionColor}`}>
                        Last edited: {sectionLabel}
                      </span>
                      {genre && (
                        <span className="inline-flex items-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2.5 py-1 text-xs text-[#B3B3B3]">
                          {genre}
                        </span>
                      )}
                      {tempo && (
                        <span className="inline-flex items-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2.5 py-1 text-xs text-[#B3B3B3]">
                          {tempo} BPM
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleContinue(draft.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#232323] hover:text-[#1ED760]"
                      >
                        <PenLine size={15} />
                        Continue Editing
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(draft.id)}
                        className="flex items-center justify-center rounded-xl bg-[#1A1A1A] px-3 py-2.5 text-[#6B7280] transition-colors duration-200 hover:bg-[#2A1015] hover:text-[#FF6B81]"
                        aria-label="Delete draft"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DraftUploadsPage;
