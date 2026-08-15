import React, { useState, useMemo, useEffect } from 'react';
import { Subscriber, CompanyTransaction, TransactionStatus, PaymentChannel } from '../types';
import { formatETB, formatPhoneDisplay } from '../utils';
import { BrandLogo } from './BrandLogo';
import {
  Receipt,
  X,
  Search,
  Filter,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  User,
  Phone,
  FileText,
  Copy,
  Check
} from 'lucide-react';

interface CompanyTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribers?: Subscriber[];
  organizationName?: string;
}

// Generate realistic deterministic company transactions across all subscribers
const generateMockCompanyTransactions = (subs: Subscriber[]): CompanyTransaction[] => {
  const channels: PaymentChannel[] = ['Telebirr', 'Chapa Pay', 'CBE Birr', 'Bank Transfer', 'Cash / Direct'];
  
  if (!subs || subs.length === 0) {
    // Default fallback corporate transactions
    return [
      {
        id: 'txn-default-1',
        referenceNumber: 'TXN-2026-90412',
        subscriberId: 'sub-sample-1',
        subscriberName: 'Awash Enterprise Group',
        subscriberPhone: '+251911223344',
        planName: 'Enterprise SLA Tier',
        amount: 8500,
        currency: 'ETB',
        status: 'Completed',
        paymentChannel: 'Telebirr',
        paymentDate: '2026-08-14T11:20:00Z',
        billingCycleStart: '2026-08-14',
        billingCycleEnd: '2026-09-14',
        recordedBy: 'Finance Operations',
        channel: 'Automated Engine',
        notes: 'Monthly enterprise subscription renewal via Telebirr corporate gateway.',
      },
      {
        id: 'txn-default-2',
        referenceNumber: 'TXN-2026-88192',
        subscriberId: 'sub-sample-2',
        subscriberName: 'Addis Logistics PLC',
        subscriberPhone: '+251912445566',
        planName: 'Pro Business Plan',
        amount: 4200,
        currency: 'ETB',
        status: 'Completed',
        paymentChannel: 'Chapa Pay',
        paymentDate: '2026-08-12T14:45:00Z',
        billingCycleStart: '2026-08-12',
        billingCycleEnd: '2026-09-12',
        recordedBy: 'Admin Console',
        channel: 'Admin Console',
        notes: 'Chapa checkout payment verified.',
      },
    ];
  }

  const generatedList: CompanyTransaction[] = [];

  subs.forEach((sub, index) => {
    // 1. Primary payment / renewal transaction for this subscriber
    const primaryStatus: TransactionStatus = 
      sub.status === 'Active' ? 'Completed' : sub.status === 'Overdue' ? 'Failed' : 'Pending';

    const refNum1 = `TXN-2026-${(78000 + index * 137).toString()}`;
    const channel1 = channels[index % channels.length];

    generatedList.push({
      id: `txn-sub-${sub.id}-1`,
      referenceNumber: refNum1,
      subscriberId: sub.id,
      subscriberName: sub.name,
      subscriberPhone: sub.phone,
      planName: sub.planName,
      amount: sub.amount,
      currency: 'ETB',
      status: primaryStatus,
      paymentChannel: channel1,
      paymentDate: sub.lastPaymentDate ? `${sub.lastPaymentDate}T10:00:00Z` : '2026-08-10T09:00:00Z',
      billingCycleStart: sub.lastPaymentDate || '2026-08-10',
      billingCycleEnd: sub.nextBillingDate || '2026-09-10',
      recordedBy: index % 2 === 0 ? 'Automated Billing Service' : 'Admin Console (Operations)',
      channel: index % 2 === 0 ? 'Automated Engine' : 'Admin Console',
      notes: `Subscription cycle fee for ${sub.planName}.`,
    });

    // 2. Add an earlier historical transaction for realism
    if (index % 2 === 0) {
      const refNum2 = `TXN-2026-${(64000 + index * 111).toString()}`;
      generatedList.push({
        id: `txn-sub-${sub.id}-2`,
        referenceNumber: refNum2,
        subscriberId: sub.id,
        subscriberName: sub.name,
        subscriberPhone: sub.phone,
        planName: sub.planName,
        amount: sub.amount,
        currency: 'ETB',
        status: 'Completed',
        paymentChannel: channels[(index + 2) % channels.length],
        paymentDate: '2026-07-10T08:30:00Z',
        billingCycleStart: '2026-07-10',
        billingCycleEnd: '2026-08-10',
        recordedBy: 'CBE Direct Gateway',
        channel: 'Automated Engine',
        notes: 'Prior monthly cycle settlement.',
      });
    }
  });

  return generatedList;
};

export const CompanyTransactionsModal: React.FC<CompanyTransactionsModalProps> = ({
  isOpen,
  onClose,
  subscribers = [],
  organizationName = 'Senna Commerce PLC',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [selectedTxn, setSelectedTxn] = useState<CompanyTransaction | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CompanyTransaction[]>([]);
  const [isClientMounted, setIsClientMounted] = useState(false);

  // Hydration safety: ensure state population is handled inside useEffect
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const data = generateMockCompanyTransactions(subscribers);
      setTransactions(data);
      setSearchTerm('');
      setStatusFilter('ALL');
      setChannelFilter('ALL');
      setSelectedTxn(null);
    }
  }, [isOpen, subscribers]);

  // Aggregate Metrics
  const totalVolume = useMemo(() => {
    return transactions.reduce((sum, txn) => sum + txn.amount, 0);
  }, [transactions]);

  const completedVolume = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'Completed')
      .reduce((sum, txn) => sum + txn.amount, 0);
  }, [transactions]);

  const completedCount = useMemo(() => {
    return transactions.filter((t) => t.status === 'Completed').length;
  }, [transactions]);

  const pendingCount = useMemo(() => {
    return transactions.filter((t) => t.status === 'Pending').length;
  }, [transactions]);

  const averageTxn = useMemo(() => {
    return completedCount > 0 ? completedVolume / completedCount : 0;
  }, [completedVolume, completedCount]);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesStatus = statusFilter === 'ALL' || txn.status === statusFilter;
      const matchesChannel = channelFilter === 'ALL' || txn.paymentChannel === channelFilter;
      
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        txn.referenceNumber.toLowerCase().includes(q) ||
        txn.subscriberName.toLowerCase().includes(q) ||
        txn.subscriberPhone.toLowerCase().includes(q) ||
        txn.planName.toLowerCase().includes(q) ||
        txn.paymentChannel.toLowerCase().includes(q);

      return matchesStatus && matchesChannel && matchesSearch;
    });
  }, [transactions, statusFilter, channelFilter, searchTerm]);

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = ['Reference Number', 'Subscriber Name', 'Phone', 'Plan', 'Amount (ETB)', 'Status', 'Payment Channel', 'Payment Date', 'Billing Start', 'Billing End'];
    const rows = filteredTransactions.map((t) => [
      t.referenceNumber,
      `"${t.subscriberName.replace(/"/g, '""')}"`,
      t.subscriberPhone,
      `"${t.planName}"`,
      t.amount,
      t.status,
      t.paymentChannel,
      t.paymentDate,
      t.billingCycleStart,
      t.billingCycleEnd,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `company_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !isClientMounted) return null;

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f0eb] dark:bg-[#184528]/60 text-[#184528] dark:text-emerald-300 border border-[#184528]/30 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#184528] dark:bg-emerald-400 animate-pulse" />
            Completed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Pending
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Failed
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            <RotateCcw className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            Refunded
          </span>
        );
    }
  };

  const getChannelBadge = (channel: PaymentChannel) => {
    switch (channel) {
      case 'Telebirr':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono">
            Telebirr
          </span>
        );
      case 'Chapa Pay':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
            Chapa Pay
          </span>
        );
      case 'CBE Birr':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-mono">
            CBE Birr
          </span>
        );
      case 'Bank Transfer':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 font-mono">
            Bank Wire
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 font-mono">
            Direct / Cash
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Main Modal Card */}
      <div className="relative z-10 bg-white dark:bg-[#0c0c0c] rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-gray-900 dark:text-gray-100">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-black shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BrandLogo size="lg" withGlow />
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Company Transactions Ledger
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-[#184528]/80 text-[#184528] dark:text-emerald-300 border border-emerald-300/40">
                  Audit History
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                <span>{organizationName}</span>
                <span>•</span>
                <span>Complete financial record of all subscriber billing cycles and payment settlements</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 rounded-xl transition-all shadow-xs"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50/50 dark:bg-[#070707] border-b border-gray-200 dark:border-neutral-800 shrink-0 text-xs">
          
          {/* KPI 1 */}
          <div className="p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              Total Volume Processed
            </span>
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-mono">
              {formatETB(totalVolume)}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {transactions.length} total company records
            </span>
          </div>

          {/* KPI 2 */}
          <div className="p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Settled Collections
            </span>
            <div className="text-base sm:text-lg font-bold text-[#184528] dark:text-emerald-400 font-mono">
              {formatETB(completedVolume)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {completedCount} cleared invoices
            </span>
          </div>

          {/* KPI 3 */}
          <div className="p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Pending / In Review
            </span>
            <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
              {pendingCount} Transactions
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">
              Awaiting payment confirmation
            </span>
          </div>

          {/* KPI 4 */}
          <div className="p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Average Ticket Value
            </span>
            <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {formatETB(averageTxn)}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Per completed transaction
            </span>
          </div>

        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reference # (TXN-XXXX), subscriber, phone, plan name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#184528]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Payment Channel Dropdown */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#184528]"
            >
              <option value="ALL">All Payment Channels</option>
              <option value="Telebirr">Telebirr</option>
              <option value="Chapa Pay">Chapa Pay</option>
              <option value="CBE Birr">CBE Birr</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash / Direct">Direct / Cash</option>
            </select>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {['ALL', 'Completed', 'Pending', 'Failed', 'Refunded'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-[#184528] text-white'
                    : 'bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800'
                }`}
              >
                {st === 'ALL' ? `All Statuses (${transactions.length})` : st}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table & List Container */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0c0c0c]">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
              <Receipt className="w-10 h-10 text-gray-400 mx-auto stroke-1" />
              <p className="font-semibold text-gray-700 dark:text-gray-300">No company transactions found</p>
              <p>Try adjusting your search query or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3.5 px-4">Transaction Ref</th>
                    <th className="py-3.5 px-4">Subscriber</th>
                    <th className="py-3.5 px-4">Plan / Service</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Channel</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-900">
                  {filteredTransactions.map((txn) => (
                    <tr 
                      key={txn.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-neutral-950/60 transition-colors group"
                    >
                      {/* Reference # */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {txn.referenceNumber}
                          </span>
                          <button
                            onClick={() => handleCopyRef(txn.referenceNumber)}
                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy reference number"
                          >
                            {copiedRef === txn.referenceNumber ? (
                              <Check className="w-3 h-3 text-[#184528] dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Subscriber */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {txn.subscriberName}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                            {formatPhoneDisplay(txn.subscriberPhone)}
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {txn.planName}
                      </td>

                      {/* Amount in ETB */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white font-mono whitespace-nowrap">
                        {formatETB(txn.amount)}
                      </td>

                      {/* Payment Channel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getChannelBadge(txn.paymentChannel)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(txn.status)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(txn.paymentDate).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTxn(txn)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-neutral-900 hover:bg-emerald-50 dark:hover:bg-[#184528]/40 hover:text-[#184528] dark:hover:text-emerald-300 rounded-lg transition-colors border border-gray-200 dark:border-neutral-800"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50/70 dark:bg-black shrink-0 flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> company transactions
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#184528] hover:bg-[#12331b] rounded-xl transition-all shadow-xs"
          >
            Close Transactions Ledger
          </button>
        </div>

      </div>

      {/* Single Transaction Receipt Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-6 text-gray-900 dark:text-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <BrandLogo size="xs" withGlow />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Transaction Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-black p-4 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt Ref:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedTxn.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedTxn.subscriberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span>{selectedTxn.subscriberPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan:</span>
                <span>{selectedTxn.planName}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-neutral-800 pt-2 text-sm font-bold">
                <span className="text-gray-700 dark:text-gray-300">Amount:</span>
                <span className="text-[#184528] dark:text-emerald-400">{formatETB(selectedTxn.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Channel:</span>
                <span>{selectedTxn.paymentChannel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Billing Cycle:</span>
                <span>{selectedTxn.billingCycleStart} → {selectedTxn.billingCycleEnd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span>{selectedTxn.status}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
              {selectedTxn.notes || 'Official electronic subscription invoice.'}
            </p>

            <button
              onClick={() => setSelectedTxn(null)}
              className="w-full py-2 bg-[#184528] text-white text-xs font-semibold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
