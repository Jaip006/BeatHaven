import React, { useState, useEffect } from 'react';
import { Menu, X, Music2, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';

const navLinks = [
  { label: 'Beats', href: '#trending' },
  { label: 'Producers', href: '#producers' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Licensing', href: '#licensing' },
];

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-[#262626] shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] flex items-center justify-center shadow-[0_0_20px_rgba(30,215,96,0.3)] group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)] transition-all duration-300">
              <Music2 size={18} className="text-[#0B0B0B]" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Beat<span className="text-[#1ED760]">Haven</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
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
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button variant="primary" size="sm">
              <ShoppingBag size={14} />
              Start Selling
            </Button>
          </div>

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
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="bg-[#0B0B0B]/95 backdrop-blur-xl border-t border-[#262626] px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block py-3 text-[#B3B3B3] hover:text-[#1ED760] transition-colors duration-200 border-b border-[#1A1A1A] last:border-0"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            <Button variant="secondary" size="sm" className="flex-1">Sign In</Button>
            <Button variant="primary" size="sm" className="flex-1">Start Selling</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
