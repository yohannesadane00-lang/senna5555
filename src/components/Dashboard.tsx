import React, { useState } from 'react';
import { Subscriber, SubscriptionStatus } from '../types';
import { formatETB, formatPhoneDisplay, normalizeETPhone } from '../utils';
import { BrandLogo } from './BrandLogo';
import { CompanyTransactionsModal } from './CompanyTransactionsModal';
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
  AlertCircle,
  Receipt
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
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);

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
      <div className="space-y-8 max-w-7xl mx-auto text-gray-900 dark:text-gray-100 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-52 bg-gray-200 dark:bg-neutral-900 rounded-lg" />
            <div className="h-4 w-80 bg-gray-100 dark:bg-neutral-900/60 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-36 bg-gray-200 dark:bg-neutral-900 rounded-xl" />
            <div className="h-9 w-36 bg-gray-200 dark:bg-neutral-900 rounded-xl" />
          </div>
        </div>

        {/* Executive KPI Stat Cards Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="p-5 bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-neutral-800 animate-pulse space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 bg-gray-200 dark:bg-neutral-900 rounded" />
                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-neutral-900" />
              </div>
              <div className="h-8 w-36 bg-gray-200 dark:bg-neutral-900 rounded-lg" />
              <div className="h-3.5 w-44 bg-gray-100 dark:bg-neutral-900/60 rounded" />
            </div>
          ))}
        </div>

        {/* Directory Table Skeleton */}
        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 animate-pulse space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 bg-gray-200 dark:bg-neutral-900 rounded-md" />
            <div className="h-9 w-64 bg-gray-100 dark:bg-neutral-900 rounded-xl" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-14 w-full bg-gray-50 dark:bg-neutral-900/40 rounded-xl border border-gray-200 dark:border-neutral-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-gray-900 dark:text-gray-100">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5 sm:pb-6">
        <div className="flex items-center gap-3.5">
          <BrandLogo size="lg" withGlow />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Executive Dashboard</h1>
              {isSyncing && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 px-2.5 py-0.5 rounded-full animate-pulse shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-sky-400 animate-ping" />
                  <span className="hidden xs:inline">Syncing live data...</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Real-time subscriber metrics, ETB billing management, and automated collection status.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsTransactionsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-[#184528]/40 border border-emerald-300/60 dark:border-emerald-700/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-[#184528]/70 transition-all shadow-xs"
            title="View Company Transactions Ledger"
          >
            <Receipt className="w-4 h-4" />
            <span>Company Transactions</span>
          </button>
          <button
            onClick={onNavigateToSubscribers}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#184528] dark:text-emerald-300 bg-transparent border border-[#184528] dark:border-emerald-500/50 rounded-xl hover:bg-[#e8f0eb] dark:hover:bg-[#184528]/30 transition-colors shadow-xs"
          >
            <span>Directory</span>
            <ArrowUpRight className="w-4 h-4 text-[#184528] dark:text-emerald-400" />
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#184528] hover:bg-[#12331b] active:bg-[#0c2212] rounded-xl transition-all shadow-xs border border-[#184528] focus:outline-none focus:ring-2 focus:ring-[#184528]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subscriber</span>
          </button>
        </div>
      </div>

      {/* 4 KPI METRICS DECK CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Subscribers */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-[#184528]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Active Subscribers
            </span>
            <div className="p-2 bg-[#e8f0eb] dark:bg-[#184528]/40 border border-[#184528]/30 text-[#184528] dark:text-emerald-300 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{activeSubscribers}</span>
            <span className="text-[11px] font-semibold text-[#184528] dark:text-emerald-300 bg-[#e8f0eb] dark:bg-[#184528]/60 border border-[#184528]/30 px-2 py-0.5 rounded-full">
              {activePercentage}% Active
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {activeSubscribers} of {totalSubscribers} total accounts in good standing
          </p>
        </div>

        {/* KPI 2: Monthly Recurring Revenue (MRR) */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-gray-300 dark:hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Monthly Recurring Revenue
            </span>
            <div className="p-2 bg-gray-100 dark:bg-black border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-gray-100 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatETB(monthlyRecurringRevenue)}</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Sum of active recurring plans in Ethiopian Birr
          </p>
        </div>

        {/* KPI 3: Pending Receivables */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-gray-300 dark:hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Pending Receivables
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{formatETB(pendingReceivables)}</span>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
              {pendingCount} Unpaid
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Sum of pending and overdue subscriber invoices
          </p>
        </div>

        {/* KPI 4: Collection Rate */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-gray-300 dark:hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Collection Rate
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 tracking-tight">{collectionRate}%</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Ratio</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 dark:bg-black rounded-full h-1.5 overflow-hidden border border-gray-200 dark:border-neutral-800">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, Number(collectionRate)))}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Collected vs total contract value
          </p>
        </div>
      </div>

      {/* MAIN SUBSCRIBER TABLE CONTAINER */}
      <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-gray-50/50 dark:bg-black">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Subscribers Directory</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Showing {filteredSubscribers.length} of {subscribers.length} records</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto min-w-0 sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search name, phone, plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#184528] focus:ring-2 focus:ring-[#184528] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 text-xs font-medium text-gray-600 dark:text-gray-300 overflow-x-auto">
              {['ALL', 'Active', 'Pending', 'Overdue'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded-lg transition-all text-xs whitespace-nowrap text-center ${
                    statusFilter === st
                      ? 'bg-[#184528] text-white shadow-xs font-semibold'
                      : 'hover:text-[#184528] dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {subscribers.length === 0 ? (
          <div className="py-16 text-center p-6">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
              <BrandLogo size="lg" withGlow />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">No Subscribers Yet</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Welcome to Senna! You haven't added any subscribers for this organization yet.
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
            No subscribers found matching your criteria.
          </div>
        ) : (
          <>
            {/* Mobile Cards View (Visible on < md screens) */}
            <div className="block md:hidden divide-y divide-gray-200 dark:divide-neutral-800">
              {filteredSubscribers.map((sub) => {
                const normalizedPhone = normalizeETPhone(sub.phone);
                const displayPhone = formatPhoneDisplay(sub.phone);

                return (
                  <div key={sub.id} className="p-4 space-y-3 bg-white dark:bg-black hover:bg-gray-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                    {/* Header: Name, Plan & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{sub.name}</h4>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{sub.planName}</span>
                      </div>
                      <div className="shrink-0">
                        {sub.status === 'Active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f0eb] dark:bg-[#184528]/60 text-[#184528] dark:text-emerald-300 border border-[#184528]/30 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#184528] dark:bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        )}
                        {sub.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        )}
                        {sub.status === 'Overdue' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100 dark:border-neutral-800">
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Phone</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-medium text-gray-900 dark:text-white text-[11px]">{displayPhone}</span>
                          <button
                            onClick={() => handleCopyPhone(sub.id, sub.phone)}
                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                            title="Copy phone"
                          >
                            {copiedPhoneId === sub.id ? (
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
                            className="inline-flex items-center gap-1 font-mono text-[#184528] dark:text-emerald-300 text-[11px] mt-0.5 hover:underline"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[90px]">{sub.telegramChatId}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">None</span>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
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

            {/* Desktop Table (Visible on md+ screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800 bg-gray-100/80 dark:bg-black text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Customer Name</th>
                    <th className="py-3.5 px-6">Phone (Normalized)</th>
                    <th className="py-3.5 px-6">Telegram Chat ID</th>
                    <th className="py-3.5 px-6">Plan Amount (ETB)</th>
                    <th className="py-3.5 px-6">Status Badge</th>
                    <th className="py-3.5 px-6">Next Billing Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {filteredSubscribers.map((sub) => {
                    const normalizedPhone = normalizeETPhone(sub.phone);
                    const displayPhone = formatPhoneDisplay(sub.phone);

                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/80 dark:hover:bg-neutral-800/50 transition-colors group">
                        {/* Name & Plan */}
                        <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{sub.name}</span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">{sub.planName}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-6 font-mono text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{displayPhone}</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">ET: {normalizedPhone}</div>
                            </div>
                            <button
                              onClick={() => handleCopyPhone(sub.id, sub.phone)}
                              title="Copy normalized phone number"
                              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              {copiedPhoneId === sub.id ? (
                                <Check className="w-3.5 h-3.5 text-[#184528] dark:text-emerald-400" />
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
                              className="inline-flex items-center gap-1 font-mono text-[#184528] dark:text-emerald-300 bg-[#e8f0eb] dark:bg-[#184528]/40 hover:bg-[#d1e1d7] dark:hover:bg-[#184528]/60 px-2 py-0.5 rounded border border-[#184528]/20 dark:border-emerald-800/80 text-[11px] transition-colors"
                            >
                              <Send className="w-3 h-3 text-[#184528] dark:text-emerald-400" />
                              <span>{sub.telegramChatId}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">No Chat ID</span>
                          )}
                        </td>

                        {/* Plan Amount */}
                        <td className="py-4 px-6 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatETB(sub.amount)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="inline-flex items-center">
                            {sub.status === 'Active' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e8f0eb] dark:bg-[#184528]/60 text-[#184528] dark:text-emerald-300 border border-[#184528]/30 dark:border-emerald-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#184528] dark:bg-emerald-400 animate-pulse"></span>
                                Active
                              </span>
                            )}
                            {sub.status === 'Pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Pending
                              </span>
                            )}
                            {sub.status === 'Overdue' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                                <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Next Billing */}
                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono">
                          {sub.nextBillingDate}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Status Selector */}
                            <select
                              value={sub.status}
                              onChange={(e) => onStatusChange(sub.id, e.target.value as SubscriptionStatus)}
                              className="text-xs bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-lg py-1 px-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#184528] cursor-pointer"
                            >
                              <option value="Active">Mark Active</option>
                              <option value="Pending">Mark Pending</option>
                              <option value="Overdue">Mark Overdue</option>
                            </select>

                            {/* Simulate Payment Button */}
                            <button
                              onClick={() => onSimulatePayment(sub)}
                              className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/60"
                              title="Simulate Payment & Renew (+30 Days)"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>

                            {/* Send Reminder Button */}
                            <button
                              onClick={() => onSendTelegram(sub)}
                              className="p-1.5 text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-lg transition-colors border border-sky-200 dark:border-sky-800/60"
                              title="Send Telegram Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => onEditSubscriber(sub)}
                              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Edit subscriber"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
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

      {/* Company Transactions Ledger Modal */}
      {isTransactionsModalOpen && (
        <CompanyTransactionsModal
          isOpen={isTransactionsModalOpen}
          onClose={() => setIsTransactionsModalOpen(false)}
          subscribers={subscribers}
        />
      )}
    </div>
  );
};
