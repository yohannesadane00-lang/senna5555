import React, { useState, useEffect } from 'react';
import { Subscriber, SubscriptionStatus } from '../types';
import { normalizeETPhone } from '../utils';
import { X, Phone, Send, User, Info } from 'lucide-react';

interface SubscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscriber: Omit<Subscriber, 'id'> & { id?: string }) => void;
  initialData?: Subscriber | null;
}

export const SubscriberModal: React.FC<SubscriberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [planName, setPlanName] = useState('Pro Monthly');
  const [amount, setAmount] = useState<number>(3500);
  const [status, setStatus] = useState<SubscriptionStatus>('Active');
  const [nextBillingDate, setNextBillingDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone);
      setTelegramChatId((initialData.telegramChatId || '').replace(/[@\s]/g, ''));
      setPlanName(initialData.planName);
      setAmount(initialData.amount);
      setStatus(initialData.status);
      setNextBillingDate(initialData.nextBillingDate);
    } else {
      setName('');
      setPhone('');
      setTelegramChatId('');
      setPlanName('Pro Monthly');
      setAmount(3500);
      setStatus('Pending');
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      setNextBillingDate(nextMonth.toISOString().split('T')[0]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const normalizedPreview = normalizeETPhone(phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const normalizedPhone = normalizeETPhone(phone.trim());
    const cleanTelegram = telegramChatId.replace(/[@\s]/g, '');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const defaultBillingDate = thirtyDaysFromNow.toISOString().split('T')[0];

    if (initialData?.id) {
      onSave({
        id: initialData.id,
        name: name.trim(),
        phone: normalizedPhone,
        telegramChatId: cleanTelegram,
        planName,
        amount: Number(amount) || 0,
        status,
        nextBillingDate: nextBillingDate || initialData.nextBillingDate || defaultBillingDate,
        lastPaymentDate: initialData.lastPaymentDate || new Date().toISOString().split('T')[0],
      });
    } else {
      const randomStringId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
      onSave({
        id: randomStringId,
        name: name.trim(),
        phone: normalizedPhone,
        telegramChatId: cleanTelegram,
        planName,
        amount: Number(amount) || 0,
        status: 'Pending',
        nextBillingDate: defaultBillingDate,
        lastPaymentDate: new Date().toISOString().split('T')[0],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden text-gray-900">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {initialData ? 'Edit Subscriber Account' : 'Add New B2B Subscriber'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ethiopian phone normalization and Telegram Chat ID setup.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Subscriber Name */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-700">
              Company / Client Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                placeholder="e.g. Abebe Bikila Logistics PLC"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-700">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                placeholder="e.g. 0911223344 or +251 92 345 6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder:text-gray-400 font-mono"
              />
            </div>

            {/* Normalization Preview Badge */}
            {phone.trim() && (
              <div className="mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Info className="w-3.5 h-3.5 text-sky-600" />
                  <span>Normalized Format:</span>
                </div>
                <div className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {normalizedPreview || 'Invalid'}
                </div>
              </div>
            )}
          </div>

          {/* Telegram Chat ID */}
          <div className="space-y-1">
            <label className="block font-semibold text-gray-700">
              Telegram Chat ID / Username <span className="text-gray-400 font-normal">(For Bot Notices)</span>
            </label>
            <div className="relative">
              <Send className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. 895535762 or username"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value.replace(/[@\s]/g, ''))}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sky-800 font-mono placeholder:text-gray-400"
              />
            </div>
            <p className="text-[10px] text-gray-500">Auto-strips @ and whitespace for API compatibility.</p>
          </div>

          {/* Plan & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-semibold text-gray-700">Plan Tier</label>
              <select
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900"
              >
                <option value="Starter Business">Starter Business</option>
                <option value="Pro Monthly">Pro Monthly</option>
                <option value="Enterprise Annual">Enterprise Annual</option>
                <option value="Custom Plan">Custom Plan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-gray-700">Plan Amount (ETB)</label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 font-mono font-bold"
              />
            </div>
          </div>

          {/* Status & Next Billing Date */}
          {initialData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                  className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-gray-700">Next Billing Date</label>
                <input
                  type="date"
                  required
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 font-mono"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-xs border border-gray-800"
            >
              {initialData ? 'Save Changes' : 'Create Subscriber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
