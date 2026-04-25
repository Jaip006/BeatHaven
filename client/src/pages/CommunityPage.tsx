import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark, BookmarkCheck, Heart, Image, MessageSquare, MoreVertical,
  Music, Plus, Send, Smile, Trash2, User, Video, X, Users, Sparkles, Rss,
} from 'lucide-react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import UserQuickActions from '../components/layout/UserQuickActions';
import { getAuthSession } from '../utils/auth';
import { authFetch } from '../utils/authFetch';
import { API_BASE_URL } from '../utils/apiBaseUrl';

// ── Nav constants ────────────────────────────────────────────────────────────
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

// ── Types ────────────────────────────────────────────────────────────────────
interface MediaItem { url: string; type: 'image' | 'video' | 'audio' }
interface PostUser { id: string; displayName: string; avatar: string; handle: string }
interface Post {
  id: string;
  text: string;
  media: MediaItem[];
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  likes: string[];
  saves: string[];
  createdAt: string;
  user: PostUser;
}
interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: PostUser;
}

type Tab = 'feed' | 'myposts' | 'saved';
type UploadMediaType = 'image' | 'video' | 'audio';

const uploadAcceptMap: Record<UploadMediaType, string> = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
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

const CommunityImage: React.FC<{ src: string; alt?: string; variant: 'feed' | 'composer' }> = ({
  src,
  alt = '',
  variant,
}) => {
  const sizeClass = variant === 'feed'
    ? 'max-h-60 max-w-[360px]'
    : 'max-h-28 max-w-[180px]';

  return (
    <div className="mx-auto w-fit max-w-full">
      <div className="inline-block max-w-full overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0F0F0F]">
        <img src={src} alt={alt} className={`block h-auto w-auto object-contain ${sizeClass}`} />
      </div>
    </div>
  );
};

// ── PostCard ─────────────────────────────────────────────────────────────────
const PostCard: React.FC<{
  post: Post;
  currentUserId?: string;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ post, currentUserId, onLike, onSave, onDelete }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.commentsCount);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentEmojiPos, setCommentEmojiPos] = useState({ top: 0, left: 0 });
  const commentEmojiButtonRef = useRef<HTMLButtonElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const liked = currentUserId ? post.likes.includes(currentUserId) : false;
  const saved = currentUserId ? post.saves.includes(currentUserId) : false;
  const isOwn = currentUserId === post.user.id;

  const loadComments = useCallback(async () => {
    if (commentsLoading) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/community/${post.id}/comments?limit=20`);
      const data = await res.json();
      if (data.success) setComments(data.data.comments ?? []);
    } catch { /* ignore */ } finally {
      setCommentsLoading(false);
    }
  }, [post.id, commentsLoading]);

  const toggleComments = () => {
    if (!showComments && comments.length === 0) loadComments();
    setShowComments((v) => !v);
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || submitting) return;
    if (!getAuthSession()) { navigate('/sign-in'); return; }
    setSubmitting(true);
    try {
      const res = await authFetch(`/community/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [data.data, ...prev]);
        setLocalCommentsCount((c) => c + 1);
        setCommentText('');
      }
    } catch { /* ignore */ } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await authFetch(`/community/${post.id}/comments/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setLocalCommentsCount((c) => Math.max(0, c - 1));
      }
    } catch { /* ignore */ }
  };

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
    setShowEmojiPicker(false);
  };

  return (
    <div className="group rounded-2xl border border-[#1F1F1F] bg-[#0D0D0D] overflow-hidden transition-all duration-300 hover:border-[#2A2A2A] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 pt-3 sm:pt-5 pb-2 sm:pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#222] border border-[#2A2A2A] flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
            {post.user.avatar
              ? <img src={post.user.avatar} className="w-full h-full object-cover" alt={post.user.displayName} />
              : <User size={14} className="text-[#6B7280]" />}
          </div>
          <div>
            <p
              className={`text-xs sm:text-sm font-semibold text-white leading-tight ${post.user.handle ? 'hover:text-[#1ED760] cursor-pointer transition-colors duration-150' : ''}`}
              onClick={() => post.user.handle && navigate(`/studio?handle=${post.user.handle}`)}
            >
              {post.user.displayName}
            </p>
            <p className="text-[10px] sm:text-[11px] text-[#555] mt-0.5">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {isOwn && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#444] hover:text-[#B3B3B3] hover:bg-[#1A1A1A] transition-colors"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-[#262626] bg-[#111] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(post.id); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#FCA5A5] hover:bg-[#1A1A1A] transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Text */}
      {post.text && (
        <p className="px-3 sm:px-5 pb-3 sm:pb-4 text-xs sm:text-sm text-[#C8C8C8] leading-relaxed whitespace-pre-wrap break-words">
          {post.text}
        </p>
      )}

      {/* Media */}
      {post.media.length > 0 && (
        <div className={`px-3 sm:px-5 pb-3 sm:pb-4 ${post.media.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
          {post.media.map((m, i) => (
            m.type === 'image' ? (
              <CommunityImage key={i} src={m.url} variant="feed" />
            ) : (
              <div key={i} className="rounded-xl overflow-hidden bg-[#141414] border border-[#1F1F1F]">
                {m.type === 'video' && (
                <video src={m.url} controls className="w-full max-h-72" />
                )}
                {m.type === 'audio' && (
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1ED760]/10 flex items-center justify-center flex-shrink-0">
                      <Music size={14} className="text-[#1ED760]" />
                    </div>
                    <audio src={m.url} controls className="flex-1 h-8" style={{ accentColor: '#1ED760' }} />
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2.5 border-t border-[#161616]">
        <button
          onClick={() => { if (!currentUserId) { navigate('/sign-in'); return; } onLike(post.id); }}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
            liked
              ? 'text-[#FF6FA1] bg-[#FF6FA1]/8'
              : 'text-[#555] hover:text-[#FF6FA1] hover:bg-[#FF6FA1]/8'
          }`}
        >
          <Heart size={13} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 2} />
          <span className="text-[11px]">{post.likesCount}</span>
        </button>

        <button
          onClick={toggleComments}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
            showComments
              ? 'text-[#1ED760] bg-[#1ED760]/8'
              : 'text-[#555] hover:text-[#1ED760] hover:bg-[#1ED760]/8'
          }`}
        >
          <MessageSquare size={13} />
          <span className="text-[11px]">{localCommentsCount}</span>
        </button>

        <button
          onClick={() => { if (!currentUserId) { navigate('/sign-in'); return; } onSave(post.id); }}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-sm font-medium transition-all duration-150 ml-auto ${
            saved
              ? 'text-[#7C5CFF] bg-[#7C5CFF]/8'
              : 'text-[#555] hover:text-[#7C5CFF] hover:bg-[#7C5CFF]/8'
          }`}
        >
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-[#161616] bg-[#0A0A0A] px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
          {currentUserId && (
            <div className="flex gap-2.5">
              <div className="flex-1 relative flex items-end gap-2 border-b border-[#262626] focus-within:border-[#1ED760] transition-colors pb-1">
                <div className="relative flex-shrink-0 pb-[3px]">
                  <button
                    ref={commentEmojiButtonRef}
                    type="button"
                    onClick={() => {
                      const rect = commentEmojiButtonRef.current?.getBoundingClientRect();
                      if (rect) setCommentEmojiPos({ top: rect.top - 328, left: rect.left });
                      setShowEmojiPicker((v) => !v);
                    }}
                    className="text-[#444] hover:text-[#1ED760] transition-colors"
                  >
                    <Smile size={15} />
                  </button>
                  {showEmojiPicker && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                      <div className="fixed z-40" style={{ top: commentEmojiPos.top, left: commentEmojiPos.left }}>
                        <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} lazyLoadEmojis skinTonesDisabled height={320} width={280} />
                      </div>
                    </>
                  )}
                </div>
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmitComment(); } }}
                  placeholder="Add a comment…"
                  rows={1}
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-[#444] py-1.5 resize-none"
                />
              </div>
              <button
                onClick={() => void handleSubmitComment()}
                disabled={!commentText.trim() || submitting}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#1ED760] text-[#0B0B0B] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#19c453] transition-colors self-end mb-1"
              >
                <Send size={13} />
              </button>
            </div>
          )}

          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2.5 animate-pulse">
                  <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-2.5 w-20 bg-[#1A1A1A] rounded" />
                    <div className="h-2.5 w-full bg-[#1A1A1A] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-[#444]">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-3.5">
              {comments.map((c) => {
                const canDelete = currentUserId === c.user.id || currentUserId === post.user.id;
                return (
                  <div key={c.id} className="flex gap-2.5 group/comment">
                    <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-[#222] flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {c.user.avatar
                        ? <img src={c.user.avatar} className="w-full h-full object-cover" alt="" />
                        : <User size={11} className="text-[#555]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{c.user.displayName}</span>
                        <span className="text-[10px] text-[#444]">{timeAgo(c.createdAt)}</span>
                        {canDelete && (
                          <button
                            onClick={() => void handleDeleteComment(c.id)}
                            className="ml-auto opacity-0 group-hover/comment:opacity-100 text-[#444] hover:text-red-400 transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#B3B3B3] leading-relaxed mt-0.5 break-words">{c.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
const PostSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-[#1F1F1F] bg-[#0D0D0D] p-5 animate-pulse">
    <div className="flex gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex-shrink-0" />
      <div className="space-y-2 pt-1">
        <div className="h-3 w-28 bg-[#1A1A1A] rounded" />
        <div className="h-2.5 w-16 bg-[#1A1A1A] rounded" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 w-full bg-[#1A1A1A] rounded" />
      <div className="h-3 w-4/5 bg-[#1A1A1A] rounded" />
      <div className="h-3 w-3/5 bg-[#1A1A1A] rounded" />
    </div>
    <div className="h-px bg-[#161616] mb-3" />
    <div className="flex gap-2">
      <div className="h-8 w-16 bg-[#1A1A1A] rounded-xl" />
      <div className="h-8 w-16 bg-[#1A1A1A] rounded-xl" />
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const session = getAuthSession();
  const currentUserId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [tabPosts, setTabPosts] = useState<Record<Tab, Post[]>>({ feed: [], myposts: [], saved: [] });
  const [tabLoading, setTabLoading] = useState<Record<Tab, boolean>>({ feed: true, myposts: false, saved: false });
  const [tabHasMore, setTabHasMore] = useState<Record<Tab, boolean>>({ feed: false, myposts: false, saved: false });
  const [tabLoadingMore, setTabLoadingMore] = useState<Record<Tab, boolean>>({ feed: false, myposts: false, saved: false });
  const [tabFetched, setTabFetched] = useState<Record<Tab, boolean>>({ feed: false, myposts: false, saved: false });

  // Create post state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postText, setPostText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' | 'audio' }[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [showPostEmoji, setShowPostEmoji] = useState(false);
  const [emojiPickerPos, setEmojiPickerPos] = useState({ top: 0, left: 0 });
  const postInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const selectedUploadTypeRef = useRef<UploadMediaType>('image');
  const canUsePortal = typeof window !== 'undefined' && typeof document !== 'undefined';

  const buildUrl = useCallback((tab: Tab, skip: number): string => {
    const base = `${API_BASE_URL}/community/feed?limit=10&skip=${skip}`;
    if (tab === 'myposts' && currentUserId) return `${base}&authorId=${currentUserId}`;
    if (tab === 'saved' && currentUserId) return `${base}&savedBy=${currentUserId}`;
    return base;
  }, [currentUserId]);

  const fetchTab = useCallback(async (tab: Tab, skip = 0, append = false) => {
    if (append) {
      setTabLoadingMore((prev) => ({ ...prev, [tab]: true }));
    } else {
      setTabLoading((prev) => ({ ...prev, [tab]: true }));
    }
    try {
      const res = await fetch(buildUrl(tab, skip));
      const data = await res.json();
      if (data.success) {
        setTabPosts((prev) => ({
          ...prev,
          [tab]: append ? [...prev[tab], ...data.data.posts] : data.data.posts,
        }));
        setTabHasMore((prev) => ({ ...prev, [tab]: data.data.hasMore }));
        setTabFetched((prev) => ({ ...prev, [tab]: true }));
      }
    } catch { /* ignore */ } finally {
      if (append) {
        setTabLoadingMore((prev) => ({ ...prev, [tab]: false }));
      } else {
        setTabLoading((prev) => ({ ...prev, [tab]: false }));
      }
    }
  }, [buildUrl]);

  useEffect(() => { void fetchTab('feed'); }, [fetchTab]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (!tabFetched[tab]) {
      void fetchTab(tab);
    }
  };

  const getMediaTypeFromFile = (file: File): UploadMediaType | null => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return null;
  };

  const openFilePicker = (mediaType: UploadMediaType) => {
    selectedUploadTypeRef.current = mediaType;
    const input = fileInputRef.current;
    if (!input) return;
    input.accept = uploadAcceptMap[mediaType];
    input.click();
  };

  const positionPostEmojiPicker = useCallback(() => {
    const rect = emojiButtonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pickerWidth = 300;
    const pickerHeight = 360;
    const gutter = 10;
    const screenMargin = 8;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.left;
    const maxLeft = Math.max(screenMargin, viewportWidth - pickerWidth - screenMargin);
    left = Math.min(Math.max(left, screenMargin), maxLeft);

    let top = rect.top - pickerHeight - gutter;
    if (top < screenMargin) {
      top = rect.bottom + gutter;
    }
    const maxTop = Math.max(screenMargin, viewportHeight - pickerHeight - screenMargin);
    top = Math.min(Math.max(top, screenMargin), maxTop);

    setEmojiPickerPos({ top, left });
  }, []);

  const togglePostEmojiPicker = useCallback(() => {
    if (showPostEmoji) {
      setShowPostEmoji(false);
      return;
    }
    positionPostEmojiPicker();
    setShowPostEmoji(true);
  }, [positionPostEmojiPicker, showPostEmoji]);

  useEffect(() => {
    if (!showPostEmoji) return;

    const reposition = () => positionPostEmojiPicker();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [positionPostEmojiPicker, showPostEmoji]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const selectedType = selectedUploadTypeRef.current;
    const hasInvalidFile = files.some((file) => getMediaTypeFromFile(file) !== selectedType);

    if (hasInvalidFile) {
      setPostError(`Please choose only ${selectedType} files for this upload button.`);
      e.target.value = '';
      return;
    }

    if (mediaFiles.length + files.length > 4) {
      setPostError('You can attach up to 4 media files.');
      e.target.value = '';
      return;
    }

    const newPreviews = files.map((f) => {
      const url = URL.createObjectURL(f);
      const type = selectedType;
      return { url, type };
    });
    setPostError(null);
    setMediaFiles((prev) => [...prev, ...files]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index].url);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePostEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = postInputRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? postText.length;
      const end = textarea.selectionEnd ?? postText.length;
      const newText = postText.slice(0, start) + emojiData.emoji + postText.slice(end);
      setPostText(newText);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
      });
    } else {
      setPostText((prev) => prev + emojiData.emoji);
    }
    setShowPostEmoji(false);
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && mediaFiles.length === 0) return;
    if (!session) { navigate('/sign-in'); return; }
    setPosting(true);
    setPostError(null);
    try {
      const formData = new FormData();
      formData.append('text', postText.trim());
      mediaFiles.forEach((f) => formData.append('media', f));
      const res = await authFetch('/community', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setTabPosts((prev) => ({ ...prev, feed: [data.data, ...prev.feed] }));
        if (currentUserId) {
          setTabPosts((prev) => ({ ...prev, myposts: [data.data, ...prev.myposts] }));
        }
        setPostText('');
        setMediaFiles([]);
        mediaPreviews.forEach((p) => URL.revokeObjectURL(p.url));
        setMediaPreviews([]);
        setActiveTab('feed');
      } else {
        setPostError(data.message || 'Failed to post.');
      }
    } catch { setPostError('Something went wrong.'); } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const updatePosts = (prev: Post[]) => prev.map((p) => {
      if (p.id !== postId) return p;
      const isLiked = p.likes.includes(currentUserId!);
      return {
        ...p,
        likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
        likes: isLiked ? p.likes.filter((id) => id !== currentUserId) : [...p.likes, currentUserId!],
      };
    });
    setTabPosts((prev) => ({
      feed: updatePosts(prev.feed),
      myposts: updatePosts(prev.myposts),
      saved: updatePosts(prev.saved),
    }));
    try {
      await authFetch(`/community/${postId}/like`, { method: 'POST' });
    } catch { void fetchTab(activeTab); }
  };

  const handleSave = async (postId: string) => {
    const updatePosts = (prev: Post[]) => prev.map((p) => {
      if (p.id !== postId) return p;
      const isSaved = p.saves.includes(currentUserId!);
      return {
        ...p,
        savesCount: isSaved ? p.savesCount - 1 : p.savesCount + 1,
        saves: isSaved ? p.saves.filter((id) => id !== currentUserId) : [...p.saves, currentUserId!],
      };
    });
    setTabPosts((prev) => ({
      feed: updatePosts(prev.feed),
      myposts: updatePosts(prev.myposts),
      saved: updatePosts(prev.saved),
    }));
    try {
      const res = await authFetch(`/community/${postId}/save`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) void fetchTab(activeTab);
    } catch { void fetchTab(activeTab); }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await authFetch(`/community/${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTabPosts((prev) => ({
          feed: prev.feed.filter((p) => p.id !== postId),
          myposts: prev.myposts.filter((p) => p.id !== postId),
          saved: prev.saved.filter((p) => p.id !== postId),
        }));
      }
    } catch { /* ignore */ }
  };

  const posts = tabPosts[activeTab];
  const loading = tabLoading[activeTab];
  const hasMore = tabHasMore[activeTab];
  const loadingMore = tabLoadingMore[activeTab];

  const tabs: { key: Tab; label: string; icon: React.ReactNode; requiresAuth?: boolean }[] = [
    { key: 'feed', label: 'Feed', icon: <Rss size={14} /> },
    { key: 'myposts', label: 'My Posts', icon: <User size={14} />, requiresAuth: true },
    { key: 'saved', label: 'Saved', icon: <Bookmark size={14} />, requiresAuth: true },
  ];

  const emptyMessages: Record<Tab, { title: string; body: string }> = {
    feed: { title: 'Nothing here yet', body: 'Be the first to share something with the community.' },
    myposts: { title: "You haven't posted yet", body: 'Create your first post and let the community hear you.' },
    saved: { title: 'No saved posts', body: 'Save posts you love and find them here anytime.' },
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0B0B0B] text-white">
      <main className="relative h-full overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 animated-gradient opacity-60 pointer-events-none" />
        <div className="absolute top-20 left-[-6rem] h-80 w-80 rounded-full bg-[#1ED760]/8 blur-[140px] pointer-events-none" />
        <div className="absolute top-60 right-[-6rem] h-80 w-80 rounded-full bg-[#7C5CFF]/8 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-40 left-1/3 h-60 w-60 rounded-full bg-[#1ED760]/5 blur-[120px] pointer-events-none" />

        {/* ── Navbar ── */}
        <div className="fixed inset-x-0 top-0 z-[100] border-b border-[#262626] bg-[#0B0B0B]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-7">
            <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
              <img src="/beathaven.png" alt="BeatHaven logo" className="h-9 w-9 rounded-xl object-cover shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]" />
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
                      <Link key={option} to={beatOptionRoutes[option] ?? '/'} className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white">{option}</Link>
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
                              <Link key={item} to={browseItemRoutes[item] ?? '/'} className="block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white">{item}</Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Link to="/community" className="px-2 py-2 text-sm text-[#1ED760] font-medium">Community</Link>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <UserQuickActions />
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="relative z-0 max-w-5xl mx-auto px-3 sm:px-4 pt-[72px] sm:pt-[88px] h-full flex flex-col">

          {/* Hero header */}
          <div className="mb-4 pt-3 sm:pt-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#1ED760]/20 to-[#1ED760]/5 border border-[#1ED760]/20 flex items-center justify-center">
                <Users size={16} className="text-[#1ED760]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">Community</h1>
              </div>
            </div>
          </div>

          {/* Mobile tabs — visible below lg */}
          <div className="flex lg:hidden gap-1 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map((tab) => {
              if (tab.requiresAuth && !currentUserId) return null;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                    isActive
                      ? 'bg-[#1A1A1A] text-white border-[#2A2A2A]'
                      : 'text-[#555] border-transparent hover:text-[#B3B3B3] hover:bg-[#141414]'
                  }`}
                >
                  <span className={isActive ? 'text-[#1ED760]' : ''}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Two-column layout */}
          <div className="flex gap-0 flex-1 min-h-0">

            {/* ── Left sidebar: tabs ── */}
            <div className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0 self-start pr-5 pt-2">
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#0D0D0D] p-2">
                {tabs.map((tab) => {
                  if (tab.requiresAuth && !currentUserId) return null;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#1A1A1A] text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                          : 'text-[#555] hover:text-[#B3B3B3] hover:bg-[#141414]'
                      }`}
                    >
                      <span className={isActive ? 'text-[#1ED760]' : ''}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden lg:block w-px bg-[#1F1F1F] flex-shrink-0 mt-5 mb-10" />

            {/* ── Right column: feed + create post ── */}
            <div className="flex-1 min-w-0 lg:pl-5 flex flex-col min-h-0">

              {/* Feed */}
              <div className="flex-1 overflow-y-auto space-y-4 pt-2 pb-36 lg:pb-2 pr-1">
                {loading ? (
                  <>
                    {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
                  </>
                ) : posts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'saved'
                        ? <Bookmark size={22} className="text-[#333]" />
                        : activeTab === 'myposts'
                        ? <User size={22} className="text-[#333]" />
                        : <Rss size={22} className="text-[#333]" />}
                    </div>
                    <p className="text-sm font-semibold text-[#555] mb-1">{emptyMessages[activeTab].title}</p>
                    <p className="text-xs text-[#3A3A3A]">{emptyMessages[activeTab].body}</p>
                  </div>
                ) : (
                  <>
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        onLike={handleLike}
                        onSave={handleSave}
                        onDelete={handleDelete}
                      />
                    ))}
                    {hasMore && (
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => void fetchTab(activeTab, posts.length, true)}
                          disabled={loadingMore}
                          className="rounded-full border border-[#262626] px-6 py-2.5 text-sm text-[#555] hover:text-white hover:border-[#1ED760]/40 transition-colors disabled:opacity-50"
                        >
                          {loadingMore ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Create post — only on Feed tab, pinned at bottom */}
              {/* Backdrop — closes create post when tapping outside on mobile */}
              {showCreatePost && (
                <div className="lg:hidden fixed inset-0 z-[89]" onClick={() => setShowCreatePost(false)} />
              )}

              {/* FAB — mobile only, toggles create post */}
              {session && activeTab === 'feed' && (
                <button
                  onClick={() => setShowCreatePost(v => !v)}
                  className={`lg:hidden fixed bottom-5 right-4 z-[95] w-12 h-12 rounded-full bg-[#1ED760] text-[#0B0B0B] shadow-[0_4px_24px_rgba(30,215,96,0.45)] flex items-center justify-center transition-all duration-300 active:scale-90 ${showCreatePost ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
                >
                  <Plus size={22} />
                </button>
              )}

              {session && activeTab === 'feed' ? (
                <div className={`fixed bottom-3 inset-x-3 z-[90] transition-transform duration-300 ease-out lg:relative lg:bottom-auto lg:inset-x-auto lg:z-auto lg:translate-y-0 lg:mt-3 lg:mb-6 rounded-2xl border border-[#262626] bg-[#0D0D0D]/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(0,0,0,0.6)] overflow-hidden flex-shrink-0 ${showCreatePost ? 'translate-y-0' : 'translate-y-[110%] lg:translate-y-0'}`}>
                  <div className="p-3 sm:p-4 pb-2 sm:pb-3">
                    <div className="flex gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#222] border border-[#2A2A2A] flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                        {session.user?.avatar
                          ? <img src={session.user.avatar} className="w-full h-full object-cover" alt="" />
                          : <User size={12} className="text-[#555]" />}
                      </div>
                      <div className="flex-1 flex items-start gap-2">
                        <div className="relative flex-shrink-0 mt-[7px]">
                          <button
                            ref={emojiButtonRef}
                            type="button"
                            onClick={togglePostEmojiPicker}
                            className="text-[#444] hover:text-[#1ED760] transition-colors"
                          >
                            <Smile size={14} />
                          </button>
                          {showPostEmoji && canUsePortal && createPortal(
                            <>
                              <div className="fixed inset-0 z-[130]" onClick={() => setShowPostEmoji(false)} />
                              <div className="fixed z-[140]" style={{ top: emojiPickerPos.top, left: emojiPickerPos.left }}>
                                <EmojiPicker onEmojiClick={handlePostEmojiClick} theme={Theme.DARK} lazyLoadEmojis skinTonesDisabled height={360} width={300} />
                              </div>
                            </>,
                            document.body,
                          )}
                        </div>
                        <textarea
                          ref={postInputRef}
                          value={postText}
                          onChange={(e) => setPostText(e.target.value)}
                          placeholder="Share something with the community…"
                          rows={2}
                          className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-white placeholder-[#444] resize-none leading-relaxed pt-1"
                        />
                      </div>
                    </div>

                    {mediaPreviews.length > 0 && (
                      <div className={`mt-3 ml-8 sm:ml-12 ${mediaPreviews.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
                        {mediaPreviews.map((m, i) => (
                          m.type === 'image' ? (
                            <div key={i} className="relative mx-auto w-fit max-w-full">
                              <CommunityImage src={m.url} variant="composer" />
                              <button
                                onClick={() => removeMedia(i)}
                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center text-white hover:bg-black transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <div key={i} className="relative rounded-xl overflow-hidden bg-[#141414] border border-[#1F1F1F]">
                              {m.type === 'video' && <video src={m.url} className="w-full max-h-36" />}
                              {m.type === 'audio' && (
                                <div className="flex items-center gap-2 p-3">
                                  <Music size={14} className="text-[#1ED760]" />
                                  <audio src={m.url} controls className="flex-1 h-7" />
                                </div>
                              )}
                              <button
                                onClick={() => removeMedia(i)}
                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center text-white hover:bg-black transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {postError && <p className="text-xs text-red-400 mt-2 ml-8 sm:ml-12">{postError}</p>}
                  </div>

                  <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-t border-[#161616] bg-[#0A0A0A]">
                    <div className="flex items-center gap-0.5">
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                      <button type="button" onClick={() => openFilePicker('image')} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg text-xs text-[#555] hover:text-[#1ED760] hover:bg-[#1ED760]/8 transition-colors" title="Photo">
                        <Image size={13} />
                      </button>
                      <button type="button" onClick={() => openFilePicker('video')} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg text-xs text-[#555] hover:text-[#1ED760] hover:bg-[#1ED760]/8 transition-colors" title="Video">
                        <Video size={13} />
                      </button>
                      <button type="button" onClick={() => openFilePicker('audio')} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg text-xs text-[#555] hover:text-[#1ED760] hover:bg-[#1ED760]/8 transition-colors" title="Audio">
                        <Music size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => void handleCreatePost()}
                      disabled={(!postText.trim() && mediaFiles.length === 0) || posting}
                      className="flex items-center gap-1.5 bg-[#1ED760] hover:bg-[#19c453] text-[#0B0B0B] text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={11} />
                      {posting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>
              ) : activeTab === 'feed' ? (
                <div className="sticky bottom-6 rounded-2xl border border-[#1F1F1F] bg-[#0D0D0D] p-5 text-center">
                  <p className="text-sm font-semibold text-white mb-1">Join the community</p>
                  <p className="text-xs text-[#555] mb-3">Sign in to post and interact with producers and artists</p>
                  <div className="flex justify-center gap-2">
                    <button onClick={() => navigate('/sign-up')} className="rounded-full border border-[#2A2A2A] px-5 py-2 text-sm text-[#B3B3B3] hover:bg-[#171717] hover:text-white transition-colors">Sign Up</button>
                    <button onClick={() => navigate('/sign-in')} className="rounded-full bg-[#1ED760] px-5 py-2 text-sm font-bold text-[#0B0B0B] hover:bg-[#19c453] transition-colors">Sign In</button>
                  </div>
                </div>
              ) : null}

            </div>{/* end right column */}
          </div>{/* end two-column flex */}
        </div>{/* end content container */}
      </main>
    </div>
  );
};

export default CommunityPage;
