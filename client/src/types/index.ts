// ─── Beat ────────────────────────────────────────────────
export interface Beat {
  id: string;
  title: string;
  producerName: string;
  producerId: string;
  genre: string;
  bpm: number;
  key: string;
  price: number;
  coverImage: string;
  audioUrl?: string;
  tags: string[];
  plays: number;
  likes: number;
}

// ─── Producer ─────────────────────────────────────────────
export interface Producer {
  id: string;
  displayName: string;
  avatar: string;
  genres: string[];
  beatCount: number;
  followers: number;
  verified: boolean;
}

// ─── Category ─────────────────────────────────────────────
export interface Category {
  id: string;
  label: string;
  icon: string;
  count: number;
  gradient: string;
}

// ─── Testimonial ──────────────────────────────────────────
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  quote: string;
}
