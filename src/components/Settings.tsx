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
    botToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8910475517:AAE9epqy7MjShdyTquj-_nTp0ROVSB8ArqM'
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
    <div className="space-y-6 max-w-4xl mx-auto text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure multi-tenant organization details, Ethiopian phone normalization rules, and Telegram notification integrations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="p-2 bg-gray-100 text-gray-800 rounded-xl border border-gray-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">B2B Business Information</h2>
              <p className="text-xs text-gray-500">Legal business entity details attached to subscriber receipts and invoice headers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-semibold text-gray-700">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-gray-700">TIN / Tax Identification Number</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-gray-700">Billing Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900"
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ethiopian Phone Normalization Engine */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Phone Normalizer Engine (`normalizeETPhone`)</h2>
              <p className="text-xs text-gray-500">Live test Ethiopian mobile number formatting logic.</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="font-semibold text-gray-700">Test Input Number:</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 0911223344 or +251 91 123 4567"
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 font-mono text-xs min-w-[240px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase font-mono block">Raw Input</span>
                <span className="font-mono text-sm font-semibold text-gray-900">{testPhone || '(Empty)'}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-mono block font-semibold">Normalized Output</span>
                <span className="font-mono text-sm font-bold text-emerald-800">
                  {normalizeETPhone(testPhone) || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Integration Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl border border-sky-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Telegram Bot API Integration</h2>
              <p className="text-xs text-gray-500">Automated payment reminders & invoice notices sent via Telegram Bot API.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-gray-700">Telegram Bot API Token</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sky-800 font-mono text-xs"
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
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
                >
                  Test Bot Token
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 flex items-start gap-3">
              <BellRing className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
              <div className="text-[11px] text-sky-900 leading-relaxed">
                Subscribers receive automated dunning notices sent directly to their numeric Telegram Chat ID (e.g. <span className="font-mono text-sky-950 font-semibold">895535762</span>).
                <br />
                <strong className="text-sky-950 font-semibold">Crucial requirement:</strong> The end user <em>must</em> have tapped <span className="font-mono bg-sky-100 px-1 py-0.5 rounded text-sky-900">/start</span> in the bot first, or Telegram blocks direct messages with a <code className="text-rose-600 font-mono">chat not found</code> error.
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Settings saved successfully!
            </span>
          ) : (
            <span className="text-xs text-gray-500">Changes apply instantly to current active session.</span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs border border-gray-800"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
