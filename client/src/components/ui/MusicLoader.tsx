import { useEffect, useState } from 'react';

export default function MusicLoader({ onDone }: { onDone: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1600);
    const doneTimer = setTimeout(() => onDone(), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0B0B]"
      style={{
        transition: 'opacity 0.4s ease',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      <style>{`
        @keyframes eqBar1 {
          0%, 100% { height: 8px; } 25% { height: 28px; } 50% { height: 14px; } 75% { height: 36px; }
        }
        @keyframes eqBar2 {
          0%, 100% { height: 20px; } 25% { height: 8px; } 50% { height: 36px; } 75% { height: 16px; }
        }
        @keyframes eqBar3 {
          0%, 100% { height: 36px; } 25% { height: 18px; } 50% { height: 8px; } 75% { height: 28px; }
        }
        @keyframes eqBar4 {
          0%, 100% { height: 14px; } 25% { height: 32px; } 50% { height: 24px; } 75% { height: 8px; }
        }
        @keyframes eqBar5 {
          0%, 100% { height: 28px; } 25% { height: 10px; } 50% { height: 32px; } 75% { height: 20px; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .eq-bar { width: 5px; border-radius: 3px; background: linear-gradient(to top, #16a34a, #22c55e); animation-duration: 0.9s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .eq-bar-1 { animation-name: eqBar1; }
        .eq-bar-2 { animation-name: eqBar2; animation-delay: 0.15s; }
        .eq-bar-3 { animation-name: eqBar3; animation-delay: 0.3s; }
        .eq-bar-4 { animation-name: eqBar4; animation-delay: 0.1s; }
        .eq-bar-5 { animation-name: eqBar5; animation-delay: 0.25s; }
        .loader-brand { animation: fadeInUp 0.6s ease 0.3s both; }
        .loader-sub { animation: fadeInUp 0.6s ease 0.55s both; }
      `}</style>

      {/* Equalizer bars */}
      <div className="flex items-end gap-[5px]" style={{ height: '44px' }}>
        <div className="eq-bar eq-bar-1" style={{ height: '8px' }} />
        <div className="eq-bar eq-bar-2" style={{ height: '20px' }} />
        <div className="eq-bar eq-bar-3" style={{ height: '36px' }} />
        <div className="eq-bar eq-bar-4" style={{ height: '14px' }} />
        <div className="eq-bar eq-bar-5" style={{ height: '28px' }} />
      </div>

      {/* Branding */}
      <p className="loader-brand mt-5 text-2xl font-bold tracking-widest text-white">
        BEAT<span className="text-green-400">HAVEN</span>
      </p>
    </div>
  );
}
