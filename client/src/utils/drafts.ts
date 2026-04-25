const DRAFTS_KEY_PREFIX = 'beathaven_seller_upload_drafts';

export type StoredDraft = {
  id: string;
  savedAt: number;
  [key: string]: unknown;
};

const storageKey = (userId?: string | null) =>
  `${DRAFTS_KEY_PREFIX}:${userId ?? 'guest'}`;

export const getAllDrafts = (userId?: string | null): StoredDraft[] => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as StoredDraft[];
  } catch {
    return [];
  }
};

export const getDraftById = (
  userId: string | null | undefined,
  draftId: string,
): StoredDraft | null =>
  getAllDrafts(userId).find((d) => d.id === draftId) ?? null;

export const upsertDraft = (
  userId: string | null | undefined,
  draft: StoredDraft,
) => {
  const list = getAllDrafts(userId);
  const idx = list.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    list[idx] = draft;
  } else {
    list.unshift(draft);
  }
  localStorage.setItem(storageKey(userId), JSON.stringify(list));
};

export const removeDraft = (
  userId: string | null | undefined,
  draftId: string,
) => {
  const list = getAllDrafts(userId).filter((d) => d.id !== draftId);
  localStorage.setItem(storageKey(userId), JSON.stringify(list));
};
