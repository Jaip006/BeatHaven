import React from 'react';
import { Star, Quote } from 'lucide-react';
import type { Testimonial } from '../../types';

const mockTestimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Marcus Williams',
    role: 'Independent Artist',
    avatar: 'https://picsum.photos/seed/user1/100/100',
    rating: 5,
    quote:
      "BeatHaven changed my career. I found the perfect beat for my debut single in minutes and the waveform preview made it so easy to choose. The quality is unmatched!",
  },
  {
    id: 't2',
    name: 'TrapKing808',
    role: 'Beat Producer',
    avatar: 'https://picsum.photos/seed/user2/100/100',
    rating: 5,
    quote:
      "As a producer, BeatHaven has been a game-changer. I've sold over 300 beats in just 6 months. The platform handles everything from licensing to payments seamlessly.",
  },
  {
    id: 't3',
    name: 'Serena Okafor',
    role: 'Songwriter & Artist',
    avatar: 'https://picsum.photos/seed/user3/100/100',
    rating: 5,
    quote:
      "I love the waveform player — you can really hear every detail before buying. The catalog is massive and the producers are incredibly talented. 10/10 would recommend.",
  },
];

const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-24 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-[#7C5CFF] uppercase tracking-widest mb-3 block">
            What They Say
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Loved by Artists & Producers
          </h2>
          <p className="text-[#6B7280] max-w-lg mx-auto">
            Thousands of artists and producers trust BeatHaven to power their music.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockTestimonials.map((t, idx) => (
            <div
              key={t.id}
              className="group relative bg-[#121212] border border-[#262626] rounded-2xl p-6 hover:border-[#7C5CFF]/40 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(124,92,255,0.1)] transition-all duration-300"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Quote icon */}
              <Quote size={28} className="text-[#7C5CFF]/30 mb-4" />

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="text-[#FFD700] fill-[#FFD700]" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-[#B3B3B3] text-sm leading-relaxed mb-6 line-clamp-4">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#262626]"
                />
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-[#6B7280] text-xs">{t.role}</p>
                </div>
                <div className="ml-auto w-8 h-8 rounded-full bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 flex items-center justify-center">
                  <span className="text-[#7C5CFF] text-xs font-bold">✓</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: '4.9/5', label: 'Average Rating', sub: 'From 12,000+ reviews' },
            { value: '99%', label: 'Satisfaction Rate', sub: 'Money-back guarantee' },
            { value: '200K+', label: 'Happy Customers', sub: 'And counting' },
            { value: '24/7', label: 'Support', sub: 'Always here for you' },
          ].map(({ value, label, sub }) => (
            <div
              key={label}
              className="bg-[#121212] border border-[#262626] rounded-xl p-5 text-center"
            >
              <p className="text-2xl font-black text-[#1ED760] mb-1">{value}</p>
              <p className="text-sm font-semibold text-white mb-1">{label}</p>
              <p className="text-xs text-[#6B7280]">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
