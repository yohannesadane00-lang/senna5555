import React, { useState } from 'react';
import { Subscriber, SubscriptionStatus } from '../types';
import { formatETB, formatPhoneDisplay, normalizeETPhone } from '../utils';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Search, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Send,
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  subscribers: Subscriber[];
  isLoading?: boolean;
  isSyncing?: boolean;
  onStatusChange: (id: string, newStatus: SubscriptionStatus) => void;
  onOpenAddModal: () => void;
  onNavigateToSubscribers: () => void;
  onEditSubscriber: (subscriber: Subscriber) => void;
  onDeleteSubscriber: (id: string) => void;
  onSendTelegram: (subscriber: Subscriber) => void;
  onSimulatePayment: (subscriber: Subscriber) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  subscribers,
  isLoading = false,
  isSyncing = false,
  onStatusChange,
  onOpenAddModal,
  onNavigateToSubscribers,
  onEditSubscriber,
  onDeleteSubscriber,
  onSendTelegram,
  onSimulatePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // 1. EXECUTIVE OVERVIEW KPI METRICS (Dynamically recalculated on subscriber state change)
  const activeSubscribers = subscribers.filter((s) => s.status === 'Active').length;
  const totalSubscribers = subscribers.length;
  const activePercentage = totalSubscribers > 0 ? ((activeSubscribers / totalSubscribers) * 100).toFixed(0) : '0';

  // Monthly Recurring Revenue (MRR) - sum of active subscription plan values
  const monthlyRecurringRevenue = subscribers
    .filter((s) => s.status === 'Active')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Pending Receivables - sum of unpaid ('Pending') or 'Overdue' invoices
  const pendingReceivables = subscribers
    .filter((s) => s.status === 'Pending' || s.status === 'Overdue')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingCount = subscribers.filter((s) => s.status === 'Pending' || s.status === 'Overdue').length;

  // Total Contract Value (Active + Pending Receivables)
  const totalContractValue = subscribers.reduce((acc, curr) => acc + curr.amount, 0);

  // Collection Rate (% of total invoices collected vs pending/overdue)
  const collectionRate = totalContractValue > 0 
    ? ((monthlyRecurringRevenue / totalContractValue) * 100).toFixed(1) 
    : '100.0';

  // Filter subscribers for directory table
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

  const handleCopyPhone = (id: string, rawPhone: string) => {
    const normalized = normalizeETPhone(rawPhone);
    navigator.clipboard.writeText(normalized);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // UI LOADING SKELETONS: Render subtle skeleton placeholders during initial load
  if (isLoading && subscribers.length === 0) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-52 bg-slate-800 rounded-lg" />
            <div className="h-4 w-80 bg-slate-800/60 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-36 bg-slate-800/80 rounded-xl" />
            <div className="h-9 w-36 bg-slate-800/80 rounded-xl" />
          </div>
        </div>

        {/* Executive KPI Stat Cards Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 animate-pulse space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 bg-slate-800 rounded" />
                <div className="w-8 h-8 rounded-xl bg-slate-800/80" />
              </div>
              <div className="h-8 w-36 bg-slate-800 rounded-lg" />
              <div className="h-3.5 w-44 bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>

        {/* Directory Table Skeleton */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 animate-pulse space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-slate-800 rounded-md" />
            <div className="h-9 w-64 bg-slate-800/70 rounded-xl" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-14 w-full bg-slate-800/40 rounded-xl border border-slate-800/60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-100">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
            {isSyncing && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                <span>Syncing live data...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time subscriber metrics, ETB billing management, and automated collection status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToSubscribers}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700/80 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            Manage Directory
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-lg shadow-sky-900/30 border border-sky-500/30"
          >
            <Plus className="w-4 h-4" />
            Add Subscriber
          </button>
        </div>
      </div>

      {/* 4 KPI METRICS DECK CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Subscribers */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Subscribers
            </span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{activeSubscribers}</span>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              {activePercentage}% Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {activeSubscribers} of {totalSubscribers} total accounts in good standing
          </p>
        </div>

        {/* KPI 2: Monthly Recurring Revenue (MRR) */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Monthly Recurring Revenue
            </span>
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-sky-400 tracking-tight">{formatETB(monthlyRecurringRevenue)}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Sum of active recurring plans in Ethiopian Birr
          </p>
        </div>

        {/* KPI 3: Pending Receivables */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Pending Receivables
            </span>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">{formatETB(pendingReceivables)}</span>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
              {pendingCount} Unpaid
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Sum of pending and overdue subscriber invoices
          </p>
        </div>

        {/* KPI 4: Collection Rate */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Collection Rate
            </span>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-300 tracking-tight">{collectionRate}%</span>
            <span className="text-[10px] text-slate-400">Ratio</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, Number(collectionRate)))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Collected vs total contract value
          </p>
        </div>
      </div>

      {/* MAIN SUBSCRIBER TABLE CONTAINER */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/50">
          <div>
            <h2 className="text-sm font-semibold text-white">Subscribers Directory</h2>
            <p className="text-xs text-slate-400 mt-0.5">Showing {filteredSubscribers.length} of {subscribers.length} records</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, phone, plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-sky-500 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium text-slate-400">
              {['ALL', 'Active', 'Pending', 'Overdue'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg transition-all text-xs ${
                    statusFilter === st
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Customer Name</th>
                <th className="py-3.5 px-6">Phone (Normalized)</th>
                <th className="py-3.5 px-6">Telegram Chat ID</th>
                <th className="py-3.5 px-6">Plan Amount (ETB)</th>
                <th className="py-3.5 px-6">Status Badge</th>
                <th className="py-3.5 px-6">Next Billing Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/10">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">No Subscribers Yet</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Welcome to Senna! You haven't added any subscribers for this organization yet.
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
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No subscribers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const normalizedPhone = normalizeETPhone(sub.phone);
                  const displayPhone = formatPhoneDisplay(sub.phone);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Name & Plan */}
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{sub.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal mt-0.5">{sub.planName}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 font-mono text-slate-300">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium text-slate-200">{displayPhone}</div>
                            <div className="text-[10px] text-slate-500">ET: {normalizedPhone}</div>
                          </div>
                          <button
                            onClick={() => handleCopyPhone(sub.id, sub.phone)}
                            title="Copy normalized phone number"
                            className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {copiedPhoneId === sub.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Telegram Chat ID */}
                      <td className="py-4 px-6">
                        {sub.telegramChatId ? (
                          <a
                            href={`https://t.me/${sub.telegramChatId.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-sky-400 bg-sky-950/60 hover:bg-sky-900/60 px-2 py-0.5 rounded border border-sky-800/60 text-[11px] transition-colors"
                          >
                            <Send className="w-3 h-3 text-sky-400" />
                            <span>{sub.telegramChatId}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No Chat ID</span>
                        )}
                      </td>

                      {/* Plan Amount */}
                      <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                        {formatETB(sub.amount)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="inline-flex items-center">
                          {sub.status === 'Active' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active
                            </span>
                          )}
                          {sub.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Pending
                            </span>
                          )}
                          {sub.status === 'Overdue' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Next Billing */}
                      <td className="py-4 px-6 text-slate-300 whitespace-nowrap font-mono">
                        {sub.nextBillingDate}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Status Selector */}
                          <select
                            value={sub.status}
                            onChange={(e) => onStatusChange(sub.id, e.target.value as SubscriptionStatus)}
                            className="text-xs bg-slate-950 border border-slate-700/80 rounded-lg py-1 px-2 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                          >
                            <option value="Active">Mark Active</option>
                            <option value="Pending">Mark Pending</option>
                            <option value="Overdue">Mark Overdue</option>
                          </select>

                          {/* Simulate Payment Button */}
                          <button
                            onClick={() => onSimulatePayment(sub)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded-lg transition-colors border border-emerald-500/20"
                            title="Simulate Payment & Renew (+30 Days)"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Send Reminder Button */}
                          <button
                            onClick={() => onSendTelegram(sub)}
                            className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-sky-950/60 rounded-lg transition-colors border border-sky-500/20"
                            title="Send Telegram Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditSubscriber(sub)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit subscriber"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
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
