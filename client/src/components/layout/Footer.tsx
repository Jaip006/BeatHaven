import React from 'react';
import { Music2, Twitter, Instagram, Youtube, Disc3 } from 'lucide-react';

const footerLinks = {
  Platform: ['Browse Beats', 'Featured Producers', 'New Releases', 'Top Charts'],
  Producers: ['Start Selling', 'Producer Dashboard', 'Pricing Plans', 'Upload Beats'],
  Resources: ['Help Center', 'Blog', 'Terms of Service', 'Privacy Policy'],
  Company: ['About Us', 'Careers', 'Contact', 'Press Kit'],
};

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
  { icon: Disc3, label: 'SoundCloud', href: '#' },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080808] border-t border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] flex items-center justify-center">
                <Music2 size={18} className="text-[#0B0B0B]" />
              </div>
              <span className="text-xl font-bold text-white">
                Beat<span className="text-[#1ED760]">Haven</span>
              </span>
            </a>
            <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs mb-6">
              The premier marketplace for premium beats. Discover unique sounds from world-class producers and take your music to the next level.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-[#121212] border border-[#262626] flex items-center justify-center text-[#6B7280] hover:text-[#1ED760] hover:border-[#1ED760]/40 hover:bg-[#1A1A1A] transition-all duration-200 hover:scale-110"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-[#B3B3B3] uppercase tracking-widest mb-4">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[#6B7280] hover:text-[#1ED760] transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#6B7280]">
            © 2025 BeatHaven. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <span>Made with</span>
            <span className="text-red-500">♥</span>
            <span>for music creators worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
