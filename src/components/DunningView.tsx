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
    <div className="space-y-8 max-w-7xl mx-auto text-gray-900">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dunning & Arrears Engine</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Automated collections pipeline with Telegram dunning notices and aging analysis.
          </p>
        </div>

        <button
          onClick={handleBulkDunning}
          disabled={isBulkSending || overdueSubscribers.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all border border-rose-700"
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
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
            <span>Total Overdue Receivables</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
            {formatETB(totalOverdueAmount)}
          </div>
          <p className="text-[11px] text-gray-500">
            Across {overdueSubscribers.length} accounts needing collection
          </p>
        </div>

        {/* Bucket 1: 1-15 Days Overdue */}
        <div 
          onClick={() => setAgingTab(agingTab === '1-15' ? 'ALL' : '1-15')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            agingTab === '1-15' 
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-200' 
              : 'bg-white border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider">
            <span>1–15 Days Overdue</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {bucket1_15.length} <span className="text-xs font-normal text-gray-500">Accounts</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Total: {formatETB(bucket1_15.reduce((sum, s) => sum + s.amount, 0))}
          </p>
        </div>

        {/* Bucket 2: 16-30 Days Overdue */}
        <div 
          onClick={() => setAgingTab(agingTab === '16-30' ? 'ALL' : '16-30')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            agingTab === '16-30' 
              ? 'bg-orange-50/60 border-orange-300 ring-2 ring-orange-200' 
              : 'bg-white border-gray-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between text-orange-700 text-xs font-semibold uppercase tracking-wider">
            <span>16–30 Days Overdue</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {bucket16_30.length} <span className="text-xs font-normal text-gray-500">Accounts</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Total: {formatETB(bucket16_30.reduce((sum, s) => sum + s.amount, 0))}
          </p>
        </div>

        {/* Bucket 3: 30+ Days Overdue */}
        <div 
          onClick={() => setAgingTab(agingTab === '30+' ? 'ALL' : '30+')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            agingTab === '30+' 
              ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-200' 
              : 'bg-white border-gray-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold uppercase tracking-wider">
            <span>30+ Days Overdue</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {bucket30Plus.length} <span className="text-xs font-normal text-gray-500">Accounts</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Total: {formatETB(bucket30Plus.reduce((sum, s) => sum + s.amount, 0))}
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Overdue Subscribers Directory</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
              {displayedSubscribers.length} Overdue
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by name, phone, or Telegram..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Aging Filter Pills */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs font-medium">
              {[
                { id: 'ALL', label: 'All Overdue' },
                { id: '1-15', label: '1–15 Days' },
                { id: '16-30', label: '16–30 Days' },
                { id: '30+', label: '30+ Days' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAgingTab(tab.id as any)}
                  className={`px-3 py-1 rounded-lg transition-all text-xs ${
                    agingTab === tab.id
                      ? 'bg-white text-gray-900 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100/80 text-gray-700 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-gray-500 hover:text-gray-900">
                    {selectedIds.length > 0 && selectedIds.length === displayedSubscribers.length ? (
                      <CheckSquare className="w-4 h-4 text-gray-900" />
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
            <tbody className="divide-y divide-gray-200">
              {displayedSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      <p className="text-sm font-medium text-gray-900">No overdue accounts in this view!</p>
                      <p className="text-xs text-gray-500">All subscriber accounts are current and up to date.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedSubscribers.map((sub) => {
                  const daysOverdue = calculateDaysOverdue(sub.nextBillingDate);
                  const isSelected = selectedIds.includes(sub.id);
                  const normalizedPhone = normalizeETPhone(sub.phone);
                  const displayPhone = formatPhoneDisplay(sub.phone);

                  let agingBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (daysOverdue > 15 && daysOverdue <= 30) {
                    agingBadgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
                  } else if (daysOverdue > 30) {
                    agingBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  }

                  return (
                    <tr 
                      key={sub.id} 
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSelected ? 'bg-sky-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => handleToggleSelect(sub.id)}
                          className="text-gray-400 hover:text-gray-900"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-gray-900" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Plan */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 text-sm">{sub.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{sub.planName}</div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 font-mono text-gray-700">
                        <div>{displayPhone}</div>
                        <div className="text-[10px] text-gray-500">ET: {normalizedPhone}</div>
                      </td>

                      {/* Telegram ID */}
                      <td className="py-4 px-4">
                        {sub.telegramChatId ? (
                          <span className="font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                            {sub.telegramChatId}
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-600 italic">No Chat ID</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-bold text-rose-600 whitespace-nowrap">
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
                      <td className="py-4 px-4 text-gray-500 whitespace-nowrap">
                        {sub.nextBillingDate}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Send Telegram Reminder */}
                          <button
                            onClick={() => onSendTelegram(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg transition-colors text-xs font-medium"
                            title="Send Telegram Dunning Alert"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Alert</span>
                          </button>

                          {/* Settle / Simulate Payment */}
                          <button
                            onClick={() => onSimulatePayment(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors text-xs font-medium"
                            title="Verify payment and settle arrears"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Settle</span>
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
