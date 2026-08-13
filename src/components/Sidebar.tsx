import React from 'react';
import { NavTab } from '../types';
import { LayoutDashboard, Users, ShieldAlert, Settings, ShieldCheck, X, LogOut } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64 p-5 select-none text-gray-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 mb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            S
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900 tracking-tight block leading-none">
              Senna
            </span>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mt-1">
              B2B Subscriptions
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onToggleMobile}
          className="md:hidden p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-1.5 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm font-bold border border-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-gray-800 text-gray-100'
                      : item.badgeColor || 'bg-gray-100 text-gray-700'
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
      <div className="pt-4 border-t border-gray-200 space-y-3">
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ethiopian Birr (ETB)</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </button>
        )}

        <div className="text-[10px] text-gray-400 text-center font-mono">
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
