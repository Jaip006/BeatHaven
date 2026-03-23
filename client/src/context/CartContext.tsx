import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Beat } from '../types';

const CART_STORAGE_KEY = 'beathaven_cart_v1';

export interface CartItem {
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

  const addToCart = (beat: Beat) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.beat.id === beat.id);
      if (existingItem) {
        return currentItems;
      }

      return [...currentItems, { beat, quantity: 1 as const }];
    });
  };

  const removeFromCart = (beatId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.beat.id !== beatId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (beatId: string) => items.some((item) => item.beat.id === beatId);

  const getItemQuantity = (beatId: string) => {
    const foundItem = items.find((item) => item.beat.id === beatId);
    return foundItem?.quantity ?? 0;
  };

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
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider.');
  }

  return context;
};
