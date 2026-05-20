import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Award } from 'lucide-react';

const Topbar = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-white/[0.04] bg-[#090a0f]/80 backdrop-blur-md flex items-center justify-between px-8">
      {/* Search Input */}
      <div className="relative w-64 max-w-xs hidden sm:block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search activities..."
          className="premium-input w-full pl-9 pr-4 py-1.5 rounded-lg text-xs text-white placeholder-slate-600"
        />
      </div>
      <div className="sm:hidden" /> {/* Spacer on mobile */}

      {/* Action Items */}
      <div className="flex items-center gap-4">
        {/* Productivity Score */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-indigo-400">
          <Award className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Score: 84%</span>
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 transition-all duration-300 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
