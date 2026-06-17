import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Beat } from '../types';
import { API_BASE_URL } from '../utils/apiBaseUrl';

const CART_STORAGE_KEY = 'beathaven_cart_v1';
const BEAT_DELETED_EVENT = 'beathaven-beat-deleted';

interface CartItem {
  beat: Beat;
  quantity: 1;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (beat: Beat) => void;
  removeFromCart: (beatId: string) => void;
  clearCart: () => void;
  isInCart: (beatId: string) => boolean;
  getItemQuantity: (beatId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const readStoredCart = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item?.beat?.id)
      .map((item) => ({ ...item, quantity: 1 as const }));
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((beat: Beat) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.beat.id === beat.id);
      if (existingItem) {
        return currentItems;
      }

      return [...currentItems, { beat, quantity: 1 as const }];
    });
  }, []);

  const removeFromCart = useCallback((beatId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.beat.id !== beatId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const pruneDeletedBeats = useCallback(async () => {
    if (typeof window === 'undefined' || items.length === 0) {
      return;
    }

    const checks = await Promise.allSettled(
      items.map(async (item) => {
        const response = await fetch(`${API_BASE_URL}/beats/${item.beat.id}`);
        return {
          beatId: item.beat.id,
          status: response.status,
        };
      }),
    );

    const deletedBeatIds = checks.flatMap((result) => {
      if (result.status !== 'fulfilled') return [];
      return result.value.status === 404 ? [result.value.beatId] : [];
    });

    if (deletedBeatIds.length === 0) {
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((item) => !deletedBeatIds.includes(item.beat.id)),
    );
  }, [items]);

  useEffect(() => {
    void pruneDeletedBeats();
  }, [pruneDeletedBeats]);

  useEffect(() => {
    const handleFocus = () => {
      void pruneDeletedBeats();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pruneDeletedBeats]);

  useEffect(() => {
    const handleBeatDeleted = (event: Event) => {
      const beatId = (event as CustomEvent<{ beatId?: string }>).detail?.beatId;
      if (!beatId) return;

      setItems((currentItems) => currentItems.filter((item) => item.beat.id !== beatId));
    };

    window.addEventListener(BEAT_DELETED_EVENT, handleBeatDeleted);
    return () => window.removeEventListener(BEAT_DELETED_EVENT, handleBeatDeleted);
  }, []);

  const isInCart = useCallback(
    (beatId: string) => items.some((item) => item.beat.id === beatId),
    [items],
  );

  const getItemQuantity = useCallback(
    (beatId: string) => {
      const foundItem = items.find((item) => item.beat.id === beatId);
      return foundItem?.quantity ?? 0;
    },
    [items],
  );

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.beat.price * item.quantity, 0);

    return {
      items,
      itemCount,
      subtotal,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
      getItemQuantity,
    };
  }, [addToCart, clearCart, getItemQuantity, isInCart, items, removeFromCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider.');
  }

  return context;
};
