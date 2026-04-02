import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Music2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { getAuthSession, hydrateAuthSession, subscribeToAuthChanges } from '../../utils/auth';
import UserQuickActions from './UserQuickActions';

const navLinks = [
  { label: 'Beats', href: '#trending' },
  { label: 'Producers', href: '#producers' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Licensing', href: '#licensing' },
];

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(Boolean(getAuthSession()));
  const mobileContainerRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const hideAuthCta = location.pathname === '/sign-in' || location.pathname === '/sign-up';
  const visibleNavLinks = isSignedIn
    ? navLinks.filter((link) => link.label !== 'How It Works')
    : navLinks;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => subscribeToAuthChanges(() => {
    setIsSignedIn(Boolean(getAuthSession()));
  }), []);

  useEffect(() => {
    if (isSignedIn) {
      return;
    }

    let isMounted = true;

    void hydrateAuthSession().then((session) => {
      if (isMounted && session) {
        setIsSignedIn(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (mobileContainerRef.current && !mobileContainerRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-[#262626] shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
        : 'bg-transparent'
        }`}
    >
      <div ref={mobileContainerRef}>
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] flex items-center justify-center shadow-[0_0_20px_rgba(30,215,96,0.3)] group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)] transition-all duration-300">
              <Music2 size={18} className="text-[#0B0B0B]" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Beat<span className="text-[#1ED760]">Haven</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {isSignedIn ? (
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm text-[#B3B3B3] hover:text-white transition-colors duration-200"
                >
                  Dashboard
                </button>
                <div className="pointer-events-none absolute left-0 top-full z-[120] pt-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                  <div className="w-56 rounded-2xl border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <Link
                      to="/dashboard/seller"
                      className="block rounded-xl px-3 py-2.5 text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                    >
                      Seller Dashboard
                    </Link>
                    <Link
                      to="/dashboard/buyer"
                      className="mt-1 block rounded-xl px-3 py-2.5 text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                    >
                      Buyer Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
            {visibleNavLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-[#B3B3B3] hover:text-white transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#1ED760] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          {!hideAuthCta && isSignedIn ? (
            <div className="hidden md:flex items-center gap-3">
              <UserQuickActions />
            </div>
          ) : !hideAuthCta ? (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/sign-in">
                <Button variant="primary" size="sm">
                  <Music2 size={14} />
                  Sign In
                </Button>
              </Link>
            </div>
          ) : null}

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-[#B3B3B3] hover:text-white transition-colors p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen ? (
          <div className="md:hidden px-3 pb-2">
            <div className="max-h-[78vh] overflow-y-auto rounded-2xl border border-[#262626] bg-[#0B0B0B]/95 px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-1">
              {visibleNavLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block py-3 text-[#B3B3B3] hover:text-[#1ED760] transition-colors duration-200 border-b border-[#1A1A1A] last:border-0"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              {isSignedIn ? (
                <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-2">
                  <p className="px-2 pb-2 text-xs uppercase tracking-[0.2em] text-[#6B7280]">Dashboard</p>
                  <Link
                    to="/dashboard/seller"
                    className="block rounded-lg px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Seller Dashboard
                  </Link>
                  <Link
                    to="/dashboard/buyer"
                    className="mt-1 block rounded-lg px-2 py-2 text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Buyer Dashboard
                  </Link>
                </div>
              ) : null}
              {!hideAuthCta && isSignedIn ? (
                <UserQuickActions mobile />
              ) : !hideAuthCta ? (
                <div className="flex gap-3 pt-3">
                  <Link to="/sign-in" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/sign-up" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">Start Selling</Button>
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Navbar;
