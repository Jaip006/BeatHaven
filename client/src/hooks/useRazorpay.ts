import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: 'upi';
  };
  theme?: { color?: string };
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
  };
  handler?: (response: { razorpay_payment_id: string; razorpay_order_id: string }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: () => void): void;
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const SCRIPT_ID = 'razorpay-checkout-script';

export function useRazorpay() {
  const [ready, setReady] = useState(() => typeof window !== 'undefined' && Boolean(window.Razorpay));
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<RazorpayInstance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.Razorpay) return;

    if (document.getElementById(SCRIPT_ID)) {
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError('Failed to load Razorpay. Check your internet connection.');
    document.body.appendChild(script);
  }, []);

  const openPayment = useCallback((options: Omit<RazorpayOptions, 'key'>) => {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
    if (!key || key === 'rzp_test_XXXXXXXXXXXXXXXX') {
      throw new Error('Razorpay test key is not configured. Set VITE_RAZORPAY_KEY_ID in your .env file.');
    }
    if (!ready || !window.Razorpay) {
      throw new Error('Razorpay script is not loaded yet.');
    }

    instanceRef.current = new window.Razorpay({ ...options, key });
    instanceRef.current.open();
  }, [ready]);

  return { ready, error, openPayment };
}
