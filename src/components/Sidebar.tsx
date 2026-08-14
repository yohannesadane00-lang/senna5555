import React from 'react';
import { NavTab } from '../types';
import { LayoutDashboard, Users, ShieldAlert, Settings, ShieldCheck, X, LogOut } from 'lucide-react';
import logoImage from '../assets/logo.jpg';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  subscriberCount: number;
  overdueCount?: number;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  subscriberCount,
  overdueCount = 0,
  isOpenMobile,
  onToggleMobile,
  onSignOut,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Executive Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'subscribers' as NavTab,
      label: 'Subscribers Directory',
      icon: Users,
      badge: subscriberCount,
      badgeColor: 'bg-gray-100 text-gray-700 border border-gray-200',
    },
    {
      id: 'dunning' as NavTab,
      label: 'Dunning & Arrears',
      icon: ShieldAlert,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200',
    },
    {
      id: 'settings' as NavTab,
      label: 'System Settings',
      icon: Settings,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-black border-r border-gray-200/80 dark:border-neutral-800 w-72 sm:w-64 p-4 sm:p-5 select-none text-slate-900 dark:text-gray-200 overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-5 sm:pb-6 mb-2 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="Senna Logo"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-emerald-500/20"
          />
          <div>
            <span className="text-lg font-extrabold text-black dark:text-white tracking-tight block leading-none">
              Senna
            </span>
            <span className="text-[10px] text-[#184528] dark:text-emerald-400 uppercase font-bold tracking-wider block mt-1">
              B2B Subscriptions
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-900 rounded-xl"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-1.5 py-2">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 mb-2">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (isOpenMobile) onToggleMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                isActive
                  ? 'bg-[#184528] text-white shadow-xs font-bold border border-[#12331b]'
                  : 'text-slate-800 dark:text-gray-300 font-semibold hover:bg-[#e8f0eb] dark:hover:bg-neutral-900 hover:text-[#184528] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600 dark:text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-[#e8f0eb] text-[#184528]'
                      : item.badgeColor || 'bg-gray-200 dark:bg-black text-slate-900 dark:text-gray-300 border border-gray-300 dark:border-neutral-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="pt-4 border-t border-gray-200 dark:border-neutral-800 space-y-3">
        <div className="bg-[#e8f0eb] dark:bg-black p-3 rounded-xl border border-[#184528]/20 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#184528] dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-[#184528] dark:text-emerald-400" />
            <span>Ethiopian Birr (ETB)</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
            Automatic 09..., 07..., +251 normalization engine.
          </p>
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={() => {
              onSignOut();
              if (isOpenMobile) onToggleMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Sign Out</span>
          </button>
        )}

        <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-mono">
          Senna B2B Engine v2.0
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs"
            onClick={onToggleMobile}
          />
          <div className="relative z-10 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
