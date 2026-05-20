import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, BarChart2, ListChecks, Settings as SettingsIcon, LogOut, Clock } from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Logs', path: '/logs', icon: ListChecks },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside className={`w-64 bg-[#0c0d13] border-r border-white/[0.04] flex flex-col justify-between shrink-0 h-screen sticky top-0 ${className}`}>
      <div className="flex flex-col gap-8 p-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform duration-300">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <span className="text-md font-bold tracking-tight text-white">
            WorkTrack <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                  isActive 
                    ? 'bg-indigo-600/10 border border-indigo-500/20 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Profile Block */}
      <div className="p-6 border-t border-white/[0.03] space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/10">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-200 truncate">{user.name}</span>
            <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all duration-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
