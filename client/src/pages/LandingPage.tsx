import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/sections/Hero';
import TrendingBeats from '../components/sections/TrendingBeats';
import FeaturedProducers from '../components/sections/FeaturedProducers';
import Categories from '../components/sections/Categories';
import HowItWorks from '../components/sections/HowItWorks';
import Licensing from '../components/sections/Licensing';
import Testimonials from '../components/sections/Testimonials';
import CallToAction from '../components/sections/CallToAction';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Navbar />
      <main>
        <Hero />
        <TrendingBeats />
        <Categories />
        <FeaturedProducers />
        <HowItWorks />
        <Licensing />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
