import React, { useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import { Button } from '../components/ui/Button';
import { useDownloads } from '../context/DownloadsContext';
import { authFetch } from '../utils/authFetch';

const formatDownloadedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DownloadsPage: React.FC = () => {
  const { history, historyCount, clearHistory, repairDownloadItem } = useDownloads();

  useEffect(() => {
    if (history.length === 0) {
      return;
    }

    let isCancelled = false;

    void Promise.all(history.map(async (item) => {
      if (!item.beatId) {
        return;
      }
      try {
        const res = await authFetch(`${import.meta.env.VITE_API_URL}/beats/${item.beatId}/preview`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !data?.data || isCancelled) {
          return;
        }

        repairDownloadItem(item.id, {
          genre: String(data.data.genre ?? item.genre),
          key: String(data.data.key ?? data.data.musicalKey ?? item.key),
          bpm: Number(data.data.bpm ?? item.bpm),
        });
      } catch {
        // Ignore metadata repair failures; history still remains visible.
      }
    }));

    return () => {
      isCancelled = true;
    };
  }, [history, repairDownloadItem]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-20 left-[-8rem] h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-8rem] h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        <header className="sticky top-0 z-[110] border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link to="/dashboard/buyer">
                <Button variant="secondary" size="sm" className="px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm">
                  <ArrowLeft size={14} />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight text-white sm:text-3xl">Downloads</h1>
                <p className="hidden text-xs text-[#B3B3B3] sm:block sm:text-sm">
                  {historyCount} download{historyCount === 1 ? '' : 's'} in your history
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <UserQuickActions />
            </div>
          </div>
        </header>

        <section className="relative z-0 mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-5 lg:px-7">
          {history.length === 0 ? (
            <div className="glass rounded-[1.8rem] border border-[#262626] p-6 sm:p-8">
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] text-[#7C5CFF]">
                  <Download size={22} />
                </div>
                <h2 className="mt-4 text-2xl font-bold">No downloads yet</h2>
                <p className="mt-2 max-w-sm text-sm text-[#B3B3B3]">
                  Downloaded beats will appear here with timestamp history.
                </p>
                <Link to="/dashboard/buyer" className="mt-6">
                  <Button variant="primary">Discover Beats</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass rounded-[1.8rem] border border-[#262626] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white sm:text-2xl">Download History</h2>
                <Button variant="secondary" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#262626] bg-[#121212]/90 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-lg border border-[#262626] bg-[#1A1A1A]">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#6B7280]">
                            <Download size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                        <p className="truncate text-xs text-[#B3B3B3]">{item.producerName}</p>
                        <p className="mt-1 text-xs text-[#9CA3AF]">
                          {item.genre} - {item.bpm} BPM - {item.key || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-[11px] text-[#9CA3AF]">{formatDownloadedAt(item.downloadedAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DownloadsPage;
