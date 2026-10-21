import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useCookieConsent } from '../hooks/useCookieConsent';

const PrivacyPolicyPage: React.FC = () => {
  const { openPreferences } = useCookieConsent();

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1ED760]">BeatHaven</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-[#B3B3B3]">Last updated: October 1, 2026</p>
        <div className="mt-10 space-y-8 rounded-3xl border border-[#262626] bg-[#121212] p-6 text-sm leading-7 text-[#B3B3B3] sm:p-10">
          <section><h2 className="text-xl font-bold text-white">How we use cookies and storage</h2><p className="mt-2">BeatHaven uses essential browser storage and authentication cookies to operate securely, remember cart and account state, and process purchases. Optional analytics, advertising, and preference technologies are used only after you choose to enable the relevant category.</p></section>
          <section><h2 className="text-xl font-bold text-white">Your choices</h2><p className="mt-2">You may accept all optional technologies, reject them, or select categories individually. Your selection is stored locally with the policy version and expires after 12 months; we will ask again if this policy version changes.</p><button type="button" onClick={openPreferences} className="mt-4 rounded-xl border border-[#1ED760]/60 px-4 py-2.5 font-bold text-[#1ED760] transition hover:bg-[#1ED760]/10 focus:outline-none focus:ring-2 focus:ring-[#1ED760] focus:ring-offset-2 focus:ring-offset-[#121212]">Manage cookie preferences</button></section>
          <section><h2 className="text-xl font-bold text-white">Third parties and payments</h2><p className="mt-2">Checkout is provided by Razorpay, which is necessary to complete a purchase and may process information under its own privacy terms. Review the final privacy notice, data-retention practices, and applicable regional requirements with qualified legal counsel before publishing.</p></section>
          <section><h2 className="text-xl font-bold text-white">Contact</h2><p className="mt-2">For privacy questions or requests, contact BeatHaven through the support channel listed on the website.</p></section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
