import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShoppingCart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatters';
import { useRazorpay } from '../hooks/useRazorpay';
import { getAuthSession } from '../utils/auth';
import { authFetch } from '../utils/authFetch';

const CartPage: React.FC = () => {
  const { items, itemCount, subtotal, removeFromCart, clearCart } = useCart();
  const { ready, error: razorpayError, openPayment } = useRazorpay();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setPayError(null);
    setPaying(true);

    try {
      const session = getAuthSession();
      const amountInPaise = Math.round(subtotal * 100);

      const res = await authFetch('/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInPaise }),
      });

      const body = await res.json() as { data: { orderId: string; amount: number; currency: string }; error?: { message?: string } };

      if (!res.ok) {
        throw new Error(body?.error?.message ?? 'Failed to create payment order.');
      }

      const { data } = body;

      openPayment({
        order_id: data.orderId,
        amount: data.amount as number,
        currency: data.currency,
        name: 'BeatHaven',
        description: `${itemCount} Beat License${itemCount !== 1 ? 's' : ''}`,
        image: '/beathaven.png',
        prefill: {
          name: session?.user.displayName,
          email: session?.user.email,
          contact: session?.user.mobileNumber,
          method: 'upi',
        },
        theme: { color: '#1ED760' },
        method: { upi: true, card: true, netbanking: true, wallet: true },
        handler: (response) => {
          console.log('[Razorpay] Payment ID:', response.razorpay_payment_id);
          setPaid(true);
          clearCart();
          setPaying(false);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Something went wrong.');
      setPaying(false);
    }
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center px-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1ED760]/15 text-[#1ED760]">
            <CheckCircle2 size={44} />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Payment Successful!</h2>
          <p className="text-[#B3B3B3] max-w-sm text-sm leading-relaxed">
            Your beat licenses have been purchased. Check your Downloads for the files.
          </p>
          <div className="flex gap-3 mt-2">
            <Link to="/downloads">
              <Button variant="primary">Go to Downloads</Button>
            </Link>
            <Link to="/dashboard/buyer">
              <Button variant="secondary">Browse More</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-black tracking-tight text-white sm:text-3xl">
                  Your Cart
                </h1>
                <p className="hidden text-xs text-[#B3B3B3] sm:block sm:text-sm">
                  {itemCount} item{itemCount === 1 ? '' : 's'} ready for checkout
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <UserQuickActions />
            </div>
          </div>
        </header>

        <section className="relative z-0 mx-auto grid max-w-7xl gap-6 px-4 pb-8 pt-7 sm:px-5 lg:grid-cols-[1.1fr_0.9fr] lg:px-7">
          <div className="glass rounded-[1.8rem] border border-[#262626] p-5 sm:p-6">
            {items.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] text-[#1ED760]">
                  <ShoppingCart size={22} />
                </div>
                <h2 className="mt-4 text-2xl font-bold">Cart is empty</h2>
                <p className="mt-2 max-w-sm text-sm text-[#B3B3B3]">
                  Add beats from the marketplace and they will appear here.
                </p>
                <Link to="/dashboard/buyer" className="mt-6">
                  <Button variant="primary">Browse Beats</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.beat.id}
                    className="flex flex-col gap-4 rounded-[1.3rem] border border-[#262626] bg-[#121212]/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <img
                        src={item.beat.coverImage}
                        alt={item.beat.title}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-white">{item.beat.title}</h3>
                        <p className="truncate text-sm text-[#B3B3B3]">{item.beat.producerName}</p>
                        <p className="mt-1 text-xs text-[#6B7280]">
                          {item.beat.genre} - {item.beat.bpm} BPM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <p className="text-lg font-bold text-[#1ED760]">
                        {formatPrice(item.beat.price)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#FFB4C0] hover:bg-[#2A1015]"
                        onClick={() => removeFromCart(item.beat.id)}
                      >
                        <Trash2 size={14} />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="glass h-fit rounded-[1.8rem] border border-[#262626] p-5 sm:p-6">
            <h2 className="text-xl font-bold text-white">Order Summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between text-[#B3B3B3]">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex items-center justify-between text-white">
                <span>Subtotal</span>
                <span className="text-lg font-bold text-[#1ED760]">{formatPrice(subtotal)}</span>
              </div>
            </div>

            {(razorpayError ?? payError) ? (
              <p className="mt-4 rounded-xl border border-[#FF4D4F]/30 bg-[#FF4D4F]/10 px-3 py-2 text-xs text-[#FF4D4F]">
                {razorpayError ?? payError}
              </p>
            ) : null}

            <Button
              variant="primary"
              size="md"
              className="mt-6 w-full"
              disabled={items.length === 0 || !ready || paying}
              onClick={handleCheckout}
            >
              {paying ? 'Processing…' : 'Proceed To Checkout'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="mt-3 w-full"
              onClick={clearCart}
              disabled={items.length === 0}
            >
              Clear Cart
            </Button>

            <p className="mt-4 text-center text-[10px] text-[#6B7280]">
              Secured by Razorpay · Test Mode
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default CartPage;
