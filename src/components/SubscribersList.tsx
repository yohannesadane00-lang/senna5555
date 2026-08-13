import React, { useState } from 'react';
import { Subscriber, SubscriptionStatus } from '../types';
import { formatETB, formatPhoneDisplay, normalizeETPhone } from '../utils';
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
      <div className="space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-slate-800 rounded-lg" />
            <div className="h-4 w-72 bg-slate-800/60 rounded-md" />
          </div>
          <div className="h-9 w-36 bg-slate-800 rounded-xl" />
        </div>

        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 animate-pulse space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="h-10 w-full sm:w-72 bg-slate-800 rounded-xl" />
            <div className="h-10 w-full sm:w-48 bg-slate-800/80 rounded-xl" />
          </div>
          <div className="space-y-3 pt-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="h-14 w-full bg-slate-800/40 rounded-xl border border-slate-800/60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredSubscribers = subscribers.filter((sub) => {
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
    <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Subscribers Directory</h1>
            {isSyncing && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                <span>Syncing live data...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your B2B subscription clients, inspect Ethiopian phone normalizations, and simulate payment renewals.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-lg shadow-sky-900/30 border border-sky-500/30 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscriber</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone (+251/09/07), plan, or Telegram..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-sky-500 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 self-start md:self-auto">
          {['ALL', 'Active', 'Pending', 'Overdue'].map((st) => {
            const count = st === 'ALL' 
              ? subscribers.length 
              : subscribers.filter(s => s.status === st).length;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'hover:text-white'
                }`}
              >
                <span>{st}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700/80 font-mono text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Subscriber</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6">Plan & Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Billing Schedule</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">No Subscribers Found</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Your business directory is empty. Add your first B2B client to begin tracking subscriptions.
                        </p>
                      </div>
                      <button
                        onClick={onOpenAddModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-md shadow-sky-900/30 border border-sky-500/30"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Subscriber</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No subscribers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const normalizedPhone = normalizeETPhone(sub.phone);
                  const displayPhone = formatPhoneDisplay(sub.phone);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Name & Telegram */}
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{sub.name}</span>
                          {sub.telegramChatId ? (
                            <a
                              href={`https://t.me/${sub.telegramChatId.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-sky-400 hover:underline flex items-center gap-1 mt-1 font-mono"
                            >
                              <Send className="w-3 h-3 text-sky-400" />
                              {sub.telegramChatId}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500 italic mt-1">
                              No Telegram Chat ID
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone Normalization */}
                      <td className="py-4 px-6 font-mono text-slate-300">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-200">{displayPhone}</div>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded text-[10px] border border-slate-800">
                              ET: {normalizedPhone}
                            </span>
                            <button
                              onClick={() => handleCopyPhone(sub.id, sub.phone)}
                              title="Copy normalized phone"
                              className="p-1 text-slate-500 hover:text-white rounded transition-colors"
                            >
                              {copiedId === sub.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Plan & Amount */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{sub.planName}</div>
                        <div className="text-sky-400 font-mono font-bold mt-0.5">{formatETB(sub.amount)}</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center">
                          {sub.status === 'Active' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Active
                            </span>
                          )}
                          {sub.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              Pending
                            </span>
                          )}
                          {sub.status === 'Overdue' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-6 text-xs text-slate-300 whitespace-nowrap font-mono">
                        <div>Next: <span className="font-semibold text-white">{sub.nextBillingDate}</span></div>
                        <div className="text-slate-500 text-[10px] mt-0.5">Last paid: {sub.lastPaymentDate}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Status Dropdown */}
                          <select
                            value={sub.status}
                            onChange={(e) => onStatusChange(sub.id, e.target.value as SubscriptionStatus)}
                            className="text-xs bg-slate-950 border border-slate-700/80 rounded-lg py-1 px-2 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                          >
                            <option value="Active">Mark Active</option>
                            <option value="Pending">Mark Pending</option>
                            <option value="Overdue">Mark Overdue</option>
                          </select>

                          {/* Simulate Payment button */}
                          <button
                            onClick={() => onSimulatePayment(sub)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded-lg transition-colors border border-emerald-500/20"
                            title="Simulate Payment & Renew (+30 Days)"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Send Reminder button */}
                          <button
                            onClick={() => onSendTelegram(sub)}
                            className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-sky-950/60 rounded-lg transition-colors border border-sky-500/20"
                            title="Send Telegram Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => onEditSubscriber(sub)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit subscriber"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => onDeleteSubscriber(sub.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="Delete subscriber"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
