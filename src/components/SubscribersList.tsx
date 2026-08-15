import React, { useState } from 'react';
import { Subscriber, SubscriptionStatus } from '../types';
import { formatETB, formatPhoneDisplay, normalizeETPhone } from '../utils';
import { BrandLogo } from './BrandLogo';
import { 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Send, 
  Pencil, 
  Trash2, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  AlertCircle,
  Users
} from 'lucide-react';

interface SubscribersListProps {
  subscribers: Subscriber[];
  userId?: string;
  isLoading?: boolean;
  isSyncing?: boolean;
  onStatusChange: (id: string, newStatus: SubscriptionStatus) => void;
  onOpenAddModal: () => void;
  onEditSubscriber: (subscriber: Subscriber) => void;
  onDeleteSubscriber: (id: string) => void;
  onSendTelegram: (subscriber: Subscriber) => void;
  onSimulatePayment: (subscriber: Subscriber) => void;
}

export const SubscribersList: React.FC<SubscribersListProps> = ({
  subscribers,
  userId,
  isLoading = false,
  isSyncing = false,
  onStatusChange,
  onOpenAddModal,
  onEditSubscriber,
  onDeleteSubscriber,
  onSendTelegram,
  onSimulatePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPhone = (id: string, rawPhone: string) => {
    const normalized = normalizeETPhone(rawPhone);
    navigator.clipboard.writeText(normalized);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ONLY show full skeleton rows if subscribers is empty on initial app launch
  if (isLoading && subscribers.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto text-gray-900 dark:text-gray-100 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-gray-200 dark:bg-neutral-800 rounded-lg" />
            <div className="h-4 w-72 bg-gray-100 dark:bg-neutral-800/60 rounded-md" />
          </div>
          <div className="h-9 w-36 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 animate-pulse space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="h-10 w-full sm:w-72 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
            <div className="h-10 w-full sm:w-48 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
          </div>
          <div className="space-y-3 pt-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="h-14 w-full bg-gray-50 dark:bg-neutral-800/40 rounded-xl border border-gray-200 dark:border-neutral-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const userScopedSubscribers = subscribers.filter(
    (sub) => !userId || !sub.userId || sub.userId === userId || sub.organization_id === userId
  );

  const filteredSubscribers = userScopedSubscribers.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm) ||
      normalizeETPhone(sub.phone).includes(searchTerm) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.telegramChatId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-3.5">
          <BrandLogo size="md" withGlow />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Subscribers Directory</h1>
              {isSyncing && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-2.5 py-0.5 rounded-full animate-pulse shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400 animate-ping" />
                  <span>Syncing live data...</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage your B2B subscription clients, inspect Ethiopian phone normalizations, and simulate payment renewals.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#184528] hover:bg-[#12331b] active:bg-[#0c2212] rounded-xl transition-all shadow-xs border border-[#184528] focus:outline-none focus:ring-2 focus:ring-[#184528] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscriber</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-black p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, phone (+251/09/07), plan, or Telegram..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#184528] focus:ring-2 focus:ring-[#184528] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 text-xs font-medium text-gray-600 dark:text-gray-300 overflow-x-auto">
          {['ALL', 'Active', 'Pending', 'Overdue'].map((st) => {
            const count = st === 'ALL' 
              ? subscribers.length 
              : subscribers.filter(s => s.status === st).length;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#184528] text-white shadow-xs font-semibold'
                    : 'hover:text-[#184528] dark:hover:text-white'
                }`}
              >
                <span>{st}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${statusFilter === st ? 'bg-[#e8f0eb] text-[#184528]' : 'bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table & Cards */}
      <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {subscribers.length === 0 ? (
          <div className="py-16 text-center p-6">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
              <BrandLogo size="lg" withGlow />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Subscribers Found</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your business directory is empty. Add your first B2B client to begin tracking subscriptions.
                </p>
              </div>
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#184528] hover:bg-[#12331b] rounded-xl transition-all shadow-xs border border-[#184528] focus:ring-2 focus:ring-[#184528]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Subscriber</span>
              </button>
            </div>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-xs">
            No subscribers found matching criteria.
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-gray-200 dark:divide-neutral-800">
              {filteredSubscribers.map((sub) => {
                const normalizedPhone = normalizeETPhone(sub.phone);
                const displayPhone = formatPhoneDisplay(sub.phone);

                return (
                  <div key={sub.id} className="p-4 space-y-3 bg-white dark:bg-black hover:bg-gray-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{sub.name}</h4>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{sub.planName}</span>
                      </div>
                      <div className="shrink-0">
                        {sub.status === 'Active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f0eb] dark:bg-[#184528]/60 text-[#184528] dark:text-emerald-300 border border-[#184528]/30 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#184528] dark:text-emerald-400" />
                            Active
                          </span>
                        )}
                        {sub.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Pending
                          </span>
                        )}
                        {sub.status === 'Overdue' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100 dark:border-neutral-800">
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Phone</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-medium text-gray-900 dark:text-white text-[11px]">{displayPhone}</span>
                          <button
                            onClick={() => handleCopyPhone(sub.id, sub.phone)}
                            title="Copy phone"
                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                          >
                            {copiedId === sub.id ? (
                              <Check className="w-3 h-3 text-[#184528] dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Amount</span>
                        <span className="font-bold text-gray-900 dark:text-white mt-0.5 block font-mono text-xs">
                          {formatETB(sub.amount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Next Billing</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300 text-[11px] mt-0.5 block">
                          {sub.nextBillingDate}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Telegram</span>
                        {sub.telegramChatId ? (
                          <a
                            href={`https://t.me/${sub.telegramChatId.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[#184528] dark:text-emerald-400 text-[11px] mt-0.5 hover:underline"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[90px]">{sub.telegramChatId}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">None</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
                      <select
                        value={sub.status}
                        onChange={(e) => onStatusChange(sub.id, e.target.value as SubscriptionStatus)}
                        className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-lg py-1.5 px-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#184528]"
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSimulatePayment(sub)}
                          className="p-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg border border-emerald-200 dark:border-emerald-800/60"
                          title="Renew (+30 Days)"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSendTelegram(sub)}
                          className="p-2 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-lg border border-sky-200 dark:border-sky-800/60"
                          title="Telegram Reminder"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditSubscriber(sub)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSubscriber(sub.id)}
                          className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800 bg-gray-100/80 dark:bg-black text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Subscriber</th>
                    <th className="py-3.5 px-6">Phone Number</th>
                    <th className="py-3.5 px-6">Plan & Amount</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Billing Schedule</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {filteredSubscribers.map((sub) => {
                    const normalizedPhone = normalizeETPhone(sub.phone);
                    const displayPhone = formatPhoneDisplay(sub.phone);

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/80 dark:hover:bg-neutral-900/50 transition-colors group">
                        {/* Name & Telegram */}
                        <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{sub.name}</span>
                            {sub.telegramChatId ? (
                              <a
                                href={`https://t.me/${sub.telegramChatId.replace('@', '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#184528] dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1 font-mono"
                              >
                                <Send className="w-3 h-3 text-[#184528] dark:text-emerald-400" />
                                {sub.telegramChatId}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic mt-1">
                                No Telegram Chat ID
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Phone Normalization */}
                        <td className="py-4 px-6 font-mono text-gray-700 dark:text-gray-300">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 dark:text-white">{displayPhone}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="bg-gray-100 dark:bg-black text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[10px] border border-gray-200 dark:border-neutral-800">
                                ET: {normalizedPhone}
                              </span>
                              <button
                                onClick={() => handleCopyPhone(sub.id, sub.phone)}
                                title="Copy normalized phone"
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors"
                              >
                                {copiedId === sub.id ? (
                                  <Check className="w-3.5 h-3.5 text-[#184528] dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Plan & Amount */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900 dark:text-white">{sub.planName}</div>
                          <div className="text-gray-900 dark:text-white font-mono font-bold mt-0.5">{formatETB(sub.amount)}</div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="inline-flex items-center">
                            {sub.status === 'Active' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e8f0eb] dark:bg-[#184528]/60 text-[#184528] dark:text-emerald-300 border border-[#184528]/30 dark:border-emerald-800/60">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#184528] dark:text-emerald-400" />
                                Active
                              </span>
                            )}
                            {sub.status === 'Pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                Pending
                              </span>
                            )}
                            {sub.status === 'Overdue' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="py-4 px-6 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono">
                          <div>Next: <span className="font-semibold text-gray-900 dark:text-white">{sub.nextBillingDate}</span></div>
                          <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">Last paid: {sub.lastPaymentDate}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Status Dropdown */}
                            <select
                              value={sub.status}
                              onChange={(e) => onStatusChange(sub.id, e.target.value as SubscriptionStatus)}
                              className="text-xs bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-lg py-1 px-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#184528] cursor-pointer"
                            >
                              <option value="Active">Mark Active</option>
                              <option value="Pending">Mark Pending</option>
                              <option value="Overdue">Mark Overdue</option>
                            </select>

                            {/* Simulate Payment button */}
                            <button
                              onClick={() => onSimulatePayment(sub)}
                              className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/60"
                              title="Simulate Payment & Renew (+30 Days)"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>

                            {/* Send Reminder button */}
                            <button
                              onClick={() => onSendTelegram(sub)}
                              className="p-1.5 text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-lg transition-colors border border-sky-200 dark:border-sky-800/60"
                              title="Send Telegram Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => onEditSubscriber(sub)}
                              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                              title="Edit subscriber"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => onDeleteSubscriber(sub.id)}
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                              title="Delete subscriber"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
