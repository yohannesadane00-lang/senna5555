import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { setSecureItem } from '../lib/storage';
import { normalizeETPhone } from '../utils';
import { 
  Building2, 
  Send, 
  Phone, 
  Check, 
  Save, 
  BellRing, 
  ShieldCheck,
  CreditCard,
  Bot
} from 'lucide-react';

interface SettingsProps {
  botToken?: string;
  onUpdateBotToken?: (token: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ botToken, onUpdateBotToken }) => {
  const [businessName, setBusinessName] = useState('Senna Commerce PLC');
  const [taxId, setTaxId] = useState('0019283746');
  const [defaultCurrency, setDefaultCurrency] = useState('ETB');
  const [telegramBotToken, setTelegramBotToken] = useState(
    botToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
  );
  const [testPhone, setTestPhone] = useState('0911223344');
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (botToken) {
      setTelegramBotToken(botToken);
    }
  }, [botToken]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = telegramBotToken.trim().replace(/^bot/i, '');
    const activeUid = auth.currentUser?.uid;
    if (activeUid) {
      setSecureItem('telegram_bot_token', activeUid, cleanToken);
    }
    if (onUpdateBotToken) {
      onUpdateBotToken(cleanToken);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Configure multi-tenant organization details, Ethiopian phone normalization rules, and Telegram notification integrations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-neutral-800 pb-4">
            <div className="p-2 bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-neutral-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">B2B Business Information</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Legal business entity details attached to subscriber receipts and invoice headers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#184528] focus:ring-2 focus:ring-[#184528] text-gray-900 dark:text-gray-100 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">TIN / Tax Identification Number</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#184528] focus:ring-2 focus:ring-[#184528] text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">Billing Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#184528] focus:ring-2 focus:ring-[#184528] text-gray-900 dark:text-gray-100"
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ethiopian Phone Normalization Engine */}
        <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-neutral-800 pb-4">
            <div className="p-2 bg-[#e8f0eb] dark:bg-[#184528]/40 text-[#184528] dark:text-emerald-400 rounded-xl border border-[#184528]/30 dark:border-emerald-800/60">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Phone Normalizer Engine (`normalizeETPhone`)</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Live test Ethiopian mobile number formatting logic.</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-black p-4 rounded-xl border border-gray-200 dark:border-neutral-800 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Test Input Number:</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 0911223344 or +251 91 123 4567"
                className="px-3 py-1.5 bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#184528] focus:ring-2 focus:ring-[#184528] text-gray-900 dark:text-gray-100 font-mono text-xs min-w-[240px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-neutral-800">
              <div className="p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-mono block">Raw Input</span>
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{testPhone || '(Empty)'}</span>
              </div>
              <div className="p-3 bg-[#e8f0eb] dark:bg-[#184528]/40 rounded-xl border border-[#184528]/30 dark:border-emerald-800/60">
                <span className="text-[10px] text-[#184528] dark:text-emerald-300 uppercase font-mono block font-semibold">Normalized Output</span>
                <span className="font-mono text-sm font-bold text-[#184528] dark:text-emerald-300">
                  {normalizeETPhone(testPhone) || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Integration Settings */}
        <div className="bg-white dark:bg-black p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-neutral-800 pb-4">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 rounded-xl border border-sky-200 dark:border-sky-800/60">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Telegram Bot API Integration</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Automated payment reminders & invoice notices sent via Telegram Bot API.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-700 dark:text-gray-300">Telegram Bot API Token</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-black border border-gray-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-[#184528] focus:ring-2 focus:ring-[#184528] text-sky-800 dark:text-sky-300 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const token = telegramBotToken.trim().replace(/^bot/i, '');
                    try {
                      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
                      const data = await res.json();
                      if (data.ok) {
                        alert(
                          `✅ Bot Connected Successfully!\n\n` +
                          `Bot Name: ${data.result.first_name}\n` +
                          `Username: @${data.result.username}\n\n` +
                          `IMPORTANT: Before sending reminders to any subscriber, they must open Telegram, search for @${data.result.username}, and tap START!`
                        );
                        window.open(`https://t.me/${data.result.username}`, '_blank');
                      } else {
                        alert(`❌ Telegram API Error: ${data.description}`);
                      }
                    } catch (err: any) {
                      alert(`❌ Connection Failed: ${err?.message || 'Network error'}`);
                    }
                  }}
                  className="px-4 py-2 bg-[#184528] hover:bg-[#12331b] text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-xs border border-[#184528]"
                >
                  Test Bot Token
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/50 rounded-xl border border-sky-200 dark:border-sky-800/60 flex items-start gap-3">
              <BellRing className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-sky-900 dark:text-sky-200 leading-relaxed">
                Subscribers receive automated dunning notices sent directly to their numeric Telegram Chat ID (e.g. <span className="font-mono text-sky-950 dark:text-sky-100 font-semibold">123456789</span>).
                <br />
                <strong className="text-sky-950 dark:text-sky-100 font-semibold">Crucial requirement:</strong> The end user <em>must</em> have tapped <span className="font-mono bg-sky-100 dark:bg-sky-900 px-1 py-0.5 rounded text-sky-900 dark:text-sky-100">/start</span> in the bot first, or Telegram blocks direct messages with a <code className="text-rose-600 dark:text-rose-400 font-mono">chat not found</code> error.
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-[#184528] dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Settings saved successfully!
            </span>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">Changes apply instantly to current active session.</span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#184528] hover:bg-[#12331b] text-white font-semibold text-xs rounded-xl transition-all shadow-xs border border-[#184528] focus:ring-2 focus:ring-[#184528]"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
