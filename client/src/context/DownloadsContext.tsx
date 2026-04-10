import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const DOWNLOAD_HISTORY_STORAGE_KEY = 'beathaven_download_history_v1';

export interface DownloadHistoryItem {
  id: string;
  beatId: string;
  title: string;
  producerName: string;
  coverImage: string;
  genre: string;
  bpm: number;
  key: string;
  downloadedAt: string;
}

interface DownloadsContextValue {
  history: DownloadHistoryItem[];
  historyCount: number;
  addDownload: (item: Omit<DownloadHistoryItem, 'id' | 'downloadedAt'>) => void;
  repairDownloadItem: (itemId: string, patch: Partial<Pick<DownloadHistoryItem, 'genre' | 'key' | 'bpm'>>) => void;
  clearHistory: () => void;
}

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

const readStoredDownloadHistory = (): DownloadHistoryItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(DOWNLOAD_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as DownloadHistoryItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => item?.id && item?.beatId);
  } catch {
    return [];
  }
};

export const DownloadsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<DownloadHistoryItem[]>(readStoredDownloadHistory);

  useEffect(() => {
    localStorage.setItem(DOWNLOAD_HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addDownload = useCallback((item: Omit<DownloadHistoryItem, 'id' | 'downloadedAt'>) => {
    setHistory((current) => ([
      {
        ...item,
        id: `${item.beatId}-${Date.now()}`,
        downloadedAt: new Date().toISOString(),
      },
      ...current,
    ]));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const repairDownloadItem = useCallback((itemId: string, patch: Partial<Pick<DownloadHistoryItem, 'genre' | 'key' | 'bpm'>>) => {
    setHistory((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          ...patch,
          genre: String((patch.genre ?? item.genre) || 'Unknown'),
          key: String((patch.key ?? item.key) || 'N/A'),
          bpm: Number.isFinite(Number(patch.bpm ?? item.bpm)) ? Number(patch.bpm ?? item.bpm) : item.bpm,
        };
      }),
    );
  }, []);

  const value = useMemo<DownloadsContextValue>(() => ({
    history,
    historyCount: history.length,
    addDownload,
    repairDownloadItem,
    clearHistory,
  }), [addDownload, clearHistory, history, repairDownloadItem]);

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDownloads = (): DownloadsContextValue => {
  const context = useContext(DownloadsContext);

  if (!context) {
    throw new Error('useDownloads must be used within a DownloadsProvider.');
  }

  return context;
};
