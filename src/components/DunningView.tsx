import React, { useState } from 'react';
import { Subscriber, SubscriptionStatus } from '../types';
import { formatETB, formatPhoneDisplay, normalizeETPhone, calculateDaysOverdue } from '../utils';
import { 
  AlertTriangle, 
  Send, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Search,
  Filter,
  CheckSquare,
  Square,
  Loader2,
  Bell,
  X
} from 'lucide-react';

interface DunningViewProps {
  subscribers: Subscriber[];
  onStatusChange: (id: string, newStatus: SubscriptionStatus) => void;
  onSendTelegram: (subscriber: Subscriber) => void;
  onSimulatePayment: (subscriber: Subscriber) => void;
  botToken?: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const DunningView: React.FC<DunningViewProps> = ({
  subscribers,
  onStatusChange,
  onSendTelegram,
  onSimulatePayment,
  botToken,
  showToast,
}) => {
  const [agingTab, setAgingTab] = useState<'ALL' | '1-15' | '16-30' | '30+'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  // Filter subscribers that are Overdue OR Pending with past billing dates
  const overdueSubscribers = subscribers.filter((sub) => {
    const days = calculateDaysOverdue(sub.nextBillingDate);
    return sub.status === 'Overdue' || (sub.status === 'Pending' && days > 0);
  });

  // Calculate stats for aging buckets
  const bucket1_15 = overdueSubscribers.filter((s) => {
    const days = calculateDaysOverdue(s.nextBillingDate);
    return days >= 1 && days <= 15;
  });

  const bucket16_30 = overdueSubscribers.filter((s) => {
    const days = calculateDaysOverdue(s.nextBillingDate);
    return days >= 16 && days <= 30;
  });

  const bucket30Plus = overdueSubscribers.filter((s) => {
    const days = calculateDaysOverdue(s.nextBillingDate);
    return days > 30;
  });

  // Total overdue sum
  const totalOverdueAmount = overdueSubscribers.reduce((sum, s) => sum + s.amount, 0);

  // Filter list by selected aging tab & search term
  const displayedSubscribers = overdueSubscribers.filter((sub) => {
    const days = calculateDaysOverdue(sub.nextBillingDate);
    let matchesBucket = true;
    if (agingTab === '1-15') matchesBucket = days >= 1 && days <= 15;
    if (agingTab === '16-30') matchesBucket = days >= 16 && days <= 30;
    if (agingTab === '30+') matchesBucket = days > 30;

    const matchesSearch =
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm) ||
      normalizeETPhone(sub.phone).includes(searchTerm) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.telegramChatId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesBucket && matchesSearch;
  });

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === displayedSubscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedSubscribers.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Dunning Dispatch Handler
  const handleBulkDunning = async () => {
    const targets = selectedIds.length > 0
      ? subscribers.filter((s) => selectedIds.includes(s.id))
      : displayedSubscribers;

    if (targets.length === 0) {
      showToast('⚠️ No overdue accounts selected for bulk dunning.', 'error');
      return;
    }

    const activeToken = (botToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8910475517:AAE9epqy7MjShdyTquj-_nTp0ROVSB8ArqM').trim().replace(/^bot/i, '');

    setIsBulkSending(true);
    setBulkProgress({ current: 0, total: targets.length });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const subscriber = targets[i];
      setBulkProgress({ current: i + 1, total: targets.length });

      const chatId = subscriber.telegramChatId ? subscriber.telegramChatId.trim().replace(/[@\s]/g, '') : '';
      const isNumeric = /^\d+$/.test(chatId);

      if (!chatId || !isNumeric) {
        failedCount++;
        continue;
      }

      const daysOverdue = calculateDaysOverdue(subscriber.nextBillingDate);
      const messageText = `🚨 URGENT DUNNING NOTICE
━━━━━━━━━━━━━━━━━━━━
Dear ${subscriber.name},

Your subscription plan (${subscriber.planName}) is OVERDUE by ${daysOverdue} days.

Amount Outstanding: ${subscriber.amount} ETB
Status: Payment Past Due

To avoid service suspension, please complete your payment immediately:
https://checkout.chapa.co/pay/${subscriber.id}

Thank you,
Senna Commerce Billing Dept.`;

      try {
        const response = await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: String(chatId).trim(),
            text: messageText,
          }),
        });

        const data = await response.json();
        if (data.ok) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }

      // Small throttle to avoid Telegram API rate limits
      await new Promise((res) => setTimeout(res, 300));
    }

    setIsBulkSending(false);
    setBulkProgress(null);

    if (successCount > 0) {
      showToast(`⚡ Bulk Dunning Complete: ${successCount} sent successfully (${failedCount} skipped/failed).`, 'success');
    } else {
      showToast(`❌ Bulk Dunning Failed: Ensure subscribers have valid numeric Telegram Chat IDs.`, 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-gray-900 dark:text-gray-100">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dunning & Arrears Engine</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Automated collections pipeline with Telegram dunning notices and aging analysis.
          </p>
        </div>

        <button
          onClick={handleBulkDunning}
          disabled={isBulkSending || overdueSubscribers.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all border border-rose-700 dark:border-rose-500"
        >
          {isBulkSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Alerts ({bulkProgress?.current}/{bulkProgress?.total})...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Bulk Dunning Alerts ({selectedIds.length > 0 ? selectedIds.length : displayedSubscribers.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Overdue Total & Aging Buckets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overdue Receivables */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Total Overdue Receivables</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {formatETB(totalOverdueAmount)}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Across {overdueSubscribers.length} accounts needing collection
          </p>
        </div>

        {/* Bucket 1: 1-15 Days Overdue */}
        <div 
          onClick={() => setAgingTab(agingTab === '1-15' ? 'ALL' : '1-15')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            agingTab === '1-15' 
              ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-200 dark:ring-amber-900' 
              : 'bg-white dark:bg-black border-gray-200 dark:border-neutral-800 hover:border-amber-300 dark:hover:border-amber-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <span>1–15 Days Overdue</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {bucket1_15.length} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Accounts</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Total: {formatETB(bucket1_15.reduce((sum, s) => sum + s.amount, 0))}
          </p>
        </div>

        {/* Bucket 2: 16-30 Days Overdue */}
        <div 
          onClick={() => setAgingTab(agingTab === '16-30' ? 'ALL' : '16-30')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            agingTab === '16-30' 
              ? 'bg-orange-50/60 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 ring-2 ring-orange-200 dark:ring-orange-900' 
              : 'bg-white dark:bg-black border-gray-200 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-700'
          }`}
        >
          <div className="flex items-center justify-between text-orange-700 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider">
            <span>16–30 Days Overdue</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {bucket16_30.length} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Accounts</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Total: {formatETB(bucket16_30.reduce((sum, s) => sum + s.amount, 0))}
          </p>
        </div>

        {/* Bucket 3: 30+ Days Overdue */}
        <div 
          onClick={() => setAgingTab(agingTab === '30+' ? 'ALL' : '30+')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            agingTab === '30+' 
              ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 ring-2 ring-rose-200 dark:ring-rose-900' 
              : 'bg-white dark:bg-black border-gray-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <span>30+ Days Overdue</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {bucket30Plus.length} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Accounts</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Total: {formatETB(bucket30Plus.reduce((sum, s) => sum + s.amount, 0))}
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-gray-50/50 dark:bg-black">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Overdue Subscribers Directory</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-mono">
              {displayedSubscribers.length} Overdue
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto min-w-0 sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Filter by name, phone, or Telegram..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#184528] focus:ring-2 focus:ring-[#184528] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Aging Filter Pills */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 text-xs font-medium overflow-x-auto">
              {[
                { id: 'ALL', label: 'All Overdue' },
                { id: '1-15', label: '1–15 Days' },
                { id: '16-30', label: '16–30 Days' },
                { id: '30+', label: '30+ Days' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAgingTab(tab.id as any)}
                  className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 rounded-lg transition-all text-xs whitespace-nowrap text-center ${
                    agingTab === tab.id
                      ? 'bg-[#184528] text-white shadow-xs font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:text-[#184528] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {displayedSubscribers.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 p-6">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">No overdue accounts in this view!</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">All subscriber accounts are current and up to date.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-gray-200 dark:divide-neutral-800">
              {displayedSubscribers.map((sub) => {
                const daysOverdue = calculateDaysOverdue(sub.nextBillingDate);
                const isSelected = selectedIds.includes(sub.id);
                const normalizedPhone = normalizeETPhone(sub.phone);
                const displayPhone = formatPhoneDisplay(sub.phone);

                let agingBadgeClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
                if (daysOverdue > 15 && daysOverdue <= 30) {
                  agingBadgeClass = 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60';
                } else if (daysOverdue > 30) {
                  agingBadgeClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
                }

                return (
                  <div 
                    key={sub.id} 
                    className={`p-4 space-y-3 bg-white dark:bg-black transition-colors ${
                      isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button 
                          onClick={() => handleToggleSelect(sub.id)}
                          className="text-gray-400 dark:text-gray-500 hover:text-[#184528] dark:hover:text-white shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#184528] dark:text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{sub.name}</h4>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">{sub.planName}</span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${agingBadgeClass}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {daysOverdue}d Overdue
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100 dark:border-neutral-800">
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Phone</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white text-[11px] mt-0.5 block">{displayPhone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Amount Due</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-xs mt-0.5 block">
                          {formatETB(sub.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Due Date</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300 text-[11px] mt-0.5 block">{sub.nextBillingDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-medium">Telegram</span>
                        {sub.telegramChatId ? (
                          <span className="font-mono text-sky-700 dark:text-sky-300 text-[11px] mt-0.5 block truncate">
                            {sub.telegramChatId}
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-500 italic mt-0.5 block">No Chat ID</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
                      <button
                        onClick={() => onSendTelegram(sub)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 rounded-xl text-xs font-semibold"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Alert</span>
                      </button>
                      <button
                        onClick={() => onSimulatePayment(sub)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-semibold"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Settle</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800 bg-gray-100/80 dark:bg-black text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <button onClick={handleSelectAll} className="text-gray-500 dark:text-gray-400 hover:text-[#184528] dark:hover:text-white">
                        {selectedIds.length > 0 && selectedIds.length === displayedSubscribers.length ? (
                          <CheckSquare className="w-4 h-4 text-[#184528] dark:text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Subscriber</th>
                    <th className="py-3.5 px-4">Phone / Normalized</th>
                    <th className="py-3.5 px-4">Telegram Chat ID</th>
                    <th className="py-3.5 px-4">Amount Due</th>
                    <th className="py-3.5 px-4">Aging Window</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4 text-right">Dunning Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {displayedSubscribers.map((sub) => {
                    const daysOverdue = calculateDaysOverdue(sub.nextBillingDate);
                    const isSelected = selectedIds.includes(sub.id);
                    const normalizedPhone = normalizeETPhone(sub.phone);
                    const displayPhone = formatPhoneDisplay(sub.phone);

                    let agingBadgeClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
                    if (daysOverdue > 15 && daysOverdue <= 30) {
                      agingBadgeClass = 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60';
                    } else if (daysOverdue > 30) {
                      agingBadgeClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
                    }

                    return (
                      <tr 
                        key={sub.id} 
                        className={`hover:bg-gray-50/80 dark:hover:bg-neutral-800/50 transition-colors ${
                          isSelected ? 'bg-sky-50/50 dark:bg-sky-950/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4 text-center">
                          <button 
                            onClick={() => handleToggleSelect(sub.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-[#184528] dark:hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#184528] dark:text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Name & Plan */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">{sub.name}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{sub.planName}</div>
                        </td>

                        {/* Phone */}
                        <td className="py-4 px-4 font-mono text-gray-700 dark:text-gray-300">
                          <div>{displayPhone}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">ET: {normalizedPhone}</div>
                        </td>

                        {/* Telegram ID */}
                        <td className="py-4 px-4">
                          {sub.telegramChatId ? (
                            <span className="font-mono text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/60 text-[11px]">
                              {sub.telegramChatId}
                            </span>
                          ) : (
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 italic">No Chat ID</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatETB(sub.amount)}
                        </td>

                        {/* Aging Window Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${agingBadgeClass}`}>
                            <AlertTriangle className="w-3 h-3" />
                            {daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Overdue
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="py-4 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {sub.nextBillingDate}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Send Telegram Reminder */}
                            <button
                              onClick={() => onSendTelegram(sub)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 rounded-lg transition-colors text-xs font-medium"
                              title="Send Telegram Dunning Alert"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Alert</span>
                            </button>

                            {/* Settle / Simulate Payment */}
                            <button
                              onClick={() => onSimulatePayment(sub)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-lg transition-colors text-xs font-medium"
                              title="Verify payment and settle arrears"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Settle</span>
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
