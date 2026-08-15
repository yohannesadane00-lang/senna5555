import React, { useState, useMemo, useEffect } from 'react';
import { Subscriber, SubscriberHistoryLog, HistoryActionType } from '../types';
import { formatETB, formatPhoneDisplay } from '../utils';
import { BrandLogo } from './BrandLogo';
import {
  History,
  X,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  CreditCard,
  Pencil,
  PlusCircle,
  User,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface SubscriberHistoryModalProps {
  isOpen: boolean;
  subscriber: Subscriber | null;
  onClose: () => void;
}

// Deterministic mock history records for UI-first testing without touching production DB
const generateInitialMockHistory = (sub: Subscriber): SubscriberHistoryLog[] => {
  return [
    {
      id: `log-mock-1-${sub.id}`,
      subscriberId: sub.id,
      actionType: 'STATUS_CHANGE',
      title: `Status set to ${sub.status}`,
      description: `Subscription lifecycle status transitioned to "${sub.status}" via executive management action.`,
      actor: 'Admin Console (Operations)',
      channel: 'Admin Dashboard',
      timestamp: '2026-08-14T09:30:00Z',
      diffs: [
        {
          fieldName: 'Status',
          previousValue: sub.status === 'Active' ? 'Pending' : 'Active',
          newValue: sub.status,
        },
      ],
    },
    {
      id: `log-mock-2-${sub.id}`,
      subscriberId: sub.id,
      actionType: 'PAYMENT_RENEWAL',
      title: 'Subscription Payment Cycle Synchronized',
      description: `Verified ETB ${sub.amount.toLocaleString()} billing cycle and advanced billing horizon.`,
      actor: 'Automated Billing Service',
      channel: 'Automated Engine',
      timestamp: '2026-08-10T14:15:00Z',
      diffs: [
        {
          fieldName: 'Last Payment Date',
          previousValue: '2026-07-10',
          newValue: sub.lastPaymentDate || '2026-08-10',
        },
        {
          fieldName: 'Next Billing Date',
          previousValue: '2026-08-10',
          newValue: sub.nextBillingDate || '2026-09-10',
        },
      ],
    },
    {
      id: `log-mock-3-${sub.id}`,
      subscriberId: sub.id,
      actionType: 'TELEGRAM_NOTICE',
      title: 'Telegram Dunning Reminder Dispatched',
      description: `Dispatched automated cycle invoice alert to chat ID @${sub.telegramChatId ? sub.telegramChatId.replace('@', '') : 'finance_dept'}.`,
      actor: 'Senna Telegram Dunning Bot',
      channel: 'Telegram Bot',
      timestamp: '2026-08-08T11:00:00Z',
      diffs: [
        {
          fieldName: 'Telegram Notice Status',
          previousValue: 'Queued',
          newValue: 'Delivered (HTTP 200)',
        },
      ],
    },
    {
      id: `log-mock-4-${sub.id}`,
      subscriberId: sub.id,
      actionType: 'PLAN_UPDATE',
      title: `Assigned Plan: ${sub.planName}`,
      description: `B2B plan configured with recurring rate of ${formatETB(sub.amount)} per cycle.`,
      actor: 'Account Manager',
      channel: 'Admin Dashboard',
      timestamp: '2026-08-01T08:45:00Z',
      diffs: [
        {
          fieldName: 'Plan Name',
          previousValue: 'Starter Tier',
          newValue: sub.planName,
        },
        {
          fieldName: 'Cycle Fee',
          previousValue: '1,000 ETB',
          newValue: formatETB(sub.amount),
        },
      ],
    },
    {
      id: `log-mock-5-${sub.id}`,
      subscriberId: sub.id,
      actionType: 'PHONE_NORMALIZED',
      title: 'Ethiopian MSISDN Normalization',
      description: `Standardized local subscriber telephone number to Ethiopian telecommunications registry format (+251).`,
      actor: 'Senna Number Parser',
      channel: 'Automated Engine',
      timestamp: '2026-07-25T16:20:00Z',
      diffs: [
        {
          fieldName: 'Normalized MSISDN',
          previousValue: sub.phone.replace('+251', '0'),
          newValue: sub.phone,
        },
      ],
    },
    {
      id: `log-mock-6-${sub.id}`,
      subscriberId: sub.id,
      actionType: 'CREATED',
      title: 'Subscriber Account Provisioned',
      description: `Account initialized and linked to active B2B business enterprise roster.`,
      actor: 'Admin Console (Registration)',
      channel: 'Admin Dashboard',
      timestamp: sub.created_at || '2026-07-25T16:15:00Z',
      diffs: [
        {
          fieldName: 'Client Name',
          previousValue: null,
          newValue: sub.name,
        },
        {
          fieldName: 'Account State',
          previousValue: null,
          newValue: 'Provisioned',
        },
      ],
    },
  ];
};

export const SubscriberHistoryModal: React.FC<SubscriberHistoryModalProps> = ({
  isOpen,
  subscriber,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | HistoryActionType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyLogs, setHistoryLogs] = useState<SubscriberHistoryLog[]>([]);
  const [isClientMounted, setIsClientMounted] = useState(false);

  // Hydration safety: ensure state sync occurs strictly in useEffect
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (subscriber) {
      setHistoryLogs(generateInitialMockHistory(subscriber));
      setActiveFilter('ALL');
      setSearchQuery('');
    }
  }, [subscriber]);

  const filteredLogs = useMemo(() => {
    return historyLogs.filter((log) => {
      const matchesFilter = activeFilter === 'ALL' || log.actionType === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.title.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.channel.toLowerCase().includes(q) ||
        log.diffs?.some(
          (d) =>
            d.fieldName.toLowerCase().includes(q) ||
            String(d.previousValue).toLowerCase().includes(q) ||
            String(d.newValue).toLowerCase().includes(q)
        );

      return matchesFilter && matchesSearch;
    });
  }, [historyLogs, activeFilter, searchQuery]);

  if (!isOpen || !subscriber || !isClientMounted) return null;

  const getActionBadge = (type: HistoryActionType) => {
    switch (type) {
      case 'CREATED':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5" />,
          color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          label: 'Created',
        };
      case 'STATUS_CHANGE':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          label: 'Status Change',
        };
      case 'PAYMENT_RENEWAL':
        return {
          icon: <CreditCard className="w-3.5 h-3.5" />,
          color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          label: 'Payment / Renewal',
        };
      case 'TELEGRAM_NOTICE':
        return {
          icon: <Send className="w-3.5 h-3.5" />,
          color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
          label: 'Telegram Notice',
        };
      case 'PLAN_UPDATE':
        return {
          icon: <Layers className="w-3.5 h-3.5" />,
          color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          label: 'Plan Modification',
        };
      case 'PHONE_NORMALIZED':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          color: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
          label: 'Phone Normalization',
        };
      default:
        return {
          icon: <Pencil className="w-3.5 h-3.5" />,
          color: 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-700',
          label: 'Manual Edit',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative z-10 bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-gray-900 dark:text-gray-100">
        
        {/* Header Banner */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-black shrink-0 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <BrandLogo size="md" withGlow />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Subscriber Audit Trail
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                  UI Preview Mode
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Complete historical record of plan alternations, status transitions, and automated notices.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subscriber Identity Card */}
        <div className="px-4 sm:px-6 py-3 bg-emerald-50/40 dark:bg-[#184528]/15 border-b border-emerald-100 dark:border-emerald-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#184528] dark:text-emerald-400" />
            <span className="font-bold text-gray-900 dark:text-white">{subscriber.name}</span>
            <span className="text-gray-400">|</span>
            <span className="font-mono text-gray-600 dark:text-gray-300">{formatPhoneDisplay(subscriber.phone)}</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span className="text-gray-500 dark:text-gray-400">Plan: <strong className="text-gray-800 dark:text-gray-200">{subscriber.planName}</strong></span>
            <span className="text-[#184528] dark:text-emerald-400 font-bold">{formatETB(subscriber.amount)}</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#0d0d0d] space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search historical alterations by field, change value, or actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#184528]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-[#184528] text-white'
                  : 'bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
            >
              All Events ({historyLogs.length})
            </button>
            <button
              onClick={() => setActiveFilter('STATUS_CHANGE')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'STATUS_CHANGE'
                  ? 'bg-[#184528] text-white'
                  : 'bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
            >
              Status Changes
            </button>
            <button
              onClick={() => setActiveFilter('PAYMENT_RENEWAL')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'PAYMENT_RENEWAL'
                  ? 'bg-[#184528] text-white'
                  : 'bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
            >
              Payments & Renewals
            </button>
            <button
              onClick={() => setActiveFilter('PLAN_UPDATE')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'PLAN_UPDATE'
                  ? 'bg-[#184528] text-white'
                  : 'bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
            >
              Plan Updates
            </button>
            <button
              onClick={() => setActiveFilter('TELEGRAM_NOTICE')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'TELEGRAM_NOTICE'
                  ? 'bg-[#184528] text-white'
                  : 'bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
            >
              Telegram Notices
            </button>
          </div>
        </div>

        {/* Timeline Event Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50 dark:bg-[#070707]">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
              <History className="w-8 h-8 text-gray-400 mx-auto stroke-1" />
              <p>No historical alterations match the specified criteria.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200 dark:before:bg-neutral-800">
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.actionType);

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Bullet */}
                    <div className="absolute -left-[29px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-[#0d0d0d] border-2 border-[#184528] dark:border-emerald-400 flex items-center justify-center shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#184528] dark:bg-emerald-400" />
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 p-4 shadow-xs space-y-3 hover:border-emerald-600/40 transition-all">
                      
                      {/* Top Meta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {log.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {log.description}
                      </p>

                      {/* Before / After Diff Table */}
                      {log.diffs && log.diffs.length > 0 && (
                        <div className="bg-gray-50 dark:bg-neutral-900/60 rounded-lg p-2.5 border border-gray-100 dark:border-neutral-800 space-y-1.5">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Field Modification Details
                          </div>
                          <div className="divide-y divide-gray-200/60 dark:divide-neutral-800 text-xs">
                            {log.diffs.map((diff, i) => (
                              <div key={i} className="py-1 flex flex-wrap items-center justify-between gap-2 font-mono">
                                <span className="text-gray-600 dark:text-gray-400 font-sans font-medium">
                                  {diff.fieldName}
                                </span>
                                <div className="flex items-center gap-2 text-[11px]">
                                  {diff.previousValue !== null && (
                                    <span className="line-through text-rose-500/80 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200/50 dark:border-rose-900/40">
                                      {String(diff.previousValue)}
                                    </span>
                                  )}
                                  <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-900/40">
                                    {String(diff.newValue)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="pt-2 border-t border-gray-100 dark:border-neutral-900 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <span>Actor:</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{log.actor}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Channel:</span>
                          <span className="px-1.5 py-0.2 bg-gray-100 dark:bg-neutral-800 rounded text-gray-600 dark:text-gray-400">
                            {log.channel}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-black shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Showing {filteredLogs.length} logged record{filteredLogs.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#184528] hover:bg-[#12331b] rounded-xl transition-all shadow-xs"
          >
            Close Audit Trail
          </button>
        </div>

      </div>
    </div>
  );
};
