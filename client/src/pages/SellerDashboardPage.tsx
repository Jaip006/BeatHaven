import React from 'react';

const SellerDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-[#262626] bg-[#121212]/80 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <p className="text-sm uppercase tracking-[0.3em] text-[#1ED760]">Seller Dashboard</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Welcome to your seller workspace</h1>
          <p className="mt-4 max-w-2xl text-[#B3B3B3]">
            This is the seller side dashboard. From here you can manage your beat catalog,
            uploads, licensing activity, and sales performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
