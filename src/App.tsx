import React, { useState } from 'react';
import { Subscriber, SubscriptionStatus, NavTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SubscribersList } from './components/SubscribersList';
import { Settings } from './components/Settings';
import { DunningView } from './components/DunningView';
import { SubscriberModal } from './components/SubscriberModal';
import { SignOutModal } from './components/SignOutModal';
import { AuthScreen } from './components/AuthScreen';
import { useAuth } from './context/AuthContext';
import { useDataContext } from './context/DataContext';
import { useTheme } from './context/ThemeContext';
import { auth, db } from './lib/firebase';
import { collection, doc } from 'firebase/firestore';
import { normalizeETPhone } from './utils';
import { Menu, Plus, CheckCircle2, AlertCircle, LogOut, Loader2, Building2, Sun, Moon } from 'lucide-react';
import logoImage from './assets/logo.jpg';

import { getSecureItem, setSecureItem } from './lib/storage';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const { user, loading, logout, organizationId, organizationName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    subscribers,
    setSubscribers,
    isLoading,
    isSyncing,
    persistSubscriber,
    removeSubscriberFromDb,
  } = useDataContext();

  const currentUserId = user?.uid || user?.id || organizationId || auth.currentUser?.uid || '';

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const DEFAULT_BOT_TOKEN = '8910475517:AAE9epqy7MjShdyTquj-_nTp0ROVSB8ArqM';

  // Bot token management with fallback and user-scoped secure storage persistence
  const [botToken, setBotToken] = useState<string>(DEFAULT_BOT_TOKEN);

  // 1. INSTANT LOCAL STATE CLEANUP & RESET ON USER CHANGE / LOGOUT
  React.useEffect(() => {
    setIsModalOpen(false);
    setIsSignOutModalOpen(false);
    setEditingSubscriber(null);
    setIsMobileSidebarOpen(false);
    setToast(null);

    if (currentUserId) {
      const stored = getSecureItem<string>('telegram_bot_token', currentUserId);
      if (stored && !stored.includes('8072136331')) {
        setBotToken(stored.trim());
      } else {
        setBotToken(DEFAULT_BOT_TOKEN);
      }
    } else {
      setBotToken(DEFAULT_BOT_TOKEN);
    }

    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [currentUserId]);

  const handleConfirmLogout = async () => {
    setIsSignOutModalOpen(false);
    setIsModalOpen(false);
    setEditingSubscriber(null);
    await logout();
  };

  const handleUpdateBotToken = (newToken: string) => {
    const cleanToken = newToken.trim().replace(/^bot/i, '');
    setBotToken(cleanToken);
    const activeUid = auth.currentUser?.uid || currentUserId;
    if (activeUid) {
      setSecureItem('telegram_bot_token', activeUid, cleanToken);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  };


  // Dispatch Handler: Send Telegram Invoice Reminder
  const handleSendTelegram = async (subscriber: Subscriber) => {
    let chatId = subscriber.telegramChatId ? subscriber.telegramChatId.trim().replace(/[@\s]/g, '') : '';

    const isNumeric = /^\d+$/.test(chatId);

    if (!chatId || !isNumeric) {
      const promptText = !chatId
        ? `No Telegram Chat ID found for ${subscriber.name}.\n\nNote: Telegram Bot API requires a numeric User ID (e.g. 123456789), not an @username.\nPlease enter their numeric Telegram Chat ID:`
        : `'${subscriber.telegramChatId}' is a username handle. Telegram Bot API requires a numeric User ID (e.g. 123456789) to send direct messages.\n\nPlease enter the numeric Telegram Chat ID for ${subscriber.name}:`;

      const userInput = window.prompt(promptText);

      if (userInput && userInput.trim()) {
        const cleanId = userInput.trim().replace(/[@\s]/g, '');
        chatId = cleanId;
        const updated = { ...subscriber, telegramChatId: cleanId };
        setSubscribers((prev) =>
          prev.map((s) => (s.id === subscriber.id ? updated : s))
        );
        persistSubscriber(updated);
      } else {
        showToast("❌ Reminder canceled: Missing or invalid numeric Telegram Chat ID.", 'error');
        return;
      }
    }

    const activeBotToken = (botToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8910475517:AAE9epqy7MjShdyTquj-_nTp0ROVSB8ArqM').trim().replace(/^bot/i, '');

    const invoiceMessageText = `🧾 SENNA OFFICIAL INVOICE
━━━━━━━━━━━━━━━━━━━━
Customer: ${subscriber.name}
Subscription: ${subscriber.planName}
Amount Due: ${subscriber.amount} ETB
Status: Pending Payment

Complete Payment Link:
https://checkout.chapa.co/mock/${subscriber.id}

Thank you for your business!`;

    try {
      let botUsername = '';
      try {
        const meRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/getMe`);
        const meData = await meRes.json();
        if (meData.ok && meData.result?.username) {
          botUsername = meData.result.username;
        }
      } catch {
        // Fallback
      }

      const response = await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: String(chatId).trim(),
          text: invoiceMessageText,
        }),
      });

      const data = await response.json();

      if (data.ok === true) {
        showToast(`✅ Reminder sent to ${subscriber.name}!`, 'success');
      } else {
        const description = data.description || 'Unknown error occurred';
        if (description.includes('chat not found')) {
          const botHandle = botUsername ? `@${botUsername}` : 'your bot';
          showToast(
            `❌ Telegram Error: Chat ID ${chatId} not found by ${botHandle}. Make sure you clicked /start on ${botHandle} in Telegram!`,
            'error'
          );
          alert(
            `⚠️ Telegram Chat Not Found!\n\n` +
            `The Bot (${botHandle}) could not find Chat ID: ${chatId}.\n\n` +
            `How to fix this:\n` +
            `1. Open Telegram and search for ${botHandle}\n` +
            `2. Tap/Click "START" in the bot conversation.\n` +
            `3. Make sure ${chatId} is your exact Telegram User ID.\n\n` +
            (botUsername ? `Click OK to open t.me/${botUsername} directly.` : '')
          );
          if (botUsername) {
            window.open(`https://t.me/${botUsername}`, '_blank');
          }
        } else {
          showToast(`❌ Telegram API Error: ${description}`, 'error');
        }
      }
    } catch (err: any) {
      showToast(`❌ Telegram API Error: ${err?.message || 'Network error'}`, 'error');
    }
  };

  // Payment Simulation & Subscription Renewal Engine
  const handleSimulatePayment = (subscriber: Subscriber) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const nextBillingStr = thirtyDaysFromNow.toISOString().split('T')[0];

    const updatedSub: Subscriber = {
      ...subscriber,
      status: 'Active',
      lastPaymentDate: todayStr,
      nextBillingDate: nextBillingStr,
      organization_id: currentUserId,
    };

    setSubscribers((prev) =>
      prev.map((s) => (s.id === subscriber.id ? updatedSub : s))
    );

    persistSubscriber(updatedSub);

    showToast(
      `💰 Payment of ${subscriber.amount} ETB verified for ${subscriber.name}! Subscription extended by 30 days.`,
      'success'
    );
  };

  // Status Change Handler
  const handleStatusChange = (id: string, newStatus: SubscriptionStatus) => {
    let targetSub: Subscriber | undefined;

    setSubscribers((prev) =>
      prev.map((sub) => {
        if (sub.id === id) {
          targetSub = { ...sub, status: newStatus, organization_id: currentUserId };
          return targetSub;
        }
        return sub;
      })
    );

    if (targetSub) {
      persistSubscriber(targetSub);
    }

    showToast(`Updated status for ${targetSub?.name || 'subscriber'} to ${newStatus}`);
  };

  // CRUD Handler: Add Subscriber
  const handleAdd = async (newSubData: Omit<Subscriber, 'id'> & { id?: string; userId?: string; organization_id?: string }) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const nextBillingDate = thirtyDaysFromNow.toISOString().split('T')[0];

    const activeUid = currentUserId || newSubData.userId || newSubData.organization_id || auth.currentUser?.uid || '';

    // Generate real auto-generated Firestore document ID or use existing
    const newDocRef = newSubData.id && !newSubData.id.startsWith('sub_')
      ? doc(db, 'subscribers', newSubData.id)
      : doc(collection(db, 'subscribers'));
    
    const realDocId = newDocRef.id;

    const newSubscriber: Subscriber = {
      id: realDocId,
      name: newSubData.name.trim(),
      phone: normalizeETPhone(newSubData.phone),
      telegramChatId: (newSubData.telegramChatId || '').replace(/[@\s]/g, ''),
      planName: newSubData.planName,
      amount: Number(newSubData.amount) || 0,
      status: 'Pending',
      nextBillingDate: nextBillingDate,
      lastPaymentDate: new Date().toISOString().split('T')[0],
      organization_id: activeUid,
      userId: activeUid,
    };

    setSubscribers((prev) => [newSubscriber, ...prev.filter((s) => s.id !== realDocId)]);

    await persistSubscriber(newSubscriber);

    showToast(`Added subscriber: ${newSubscriber.name}`);
  };

  // CRUD Handler: Edit Subscriber
  const handleEdit = async (updatedData: Omit<Subscriber, 'id'> & { id?: string; userId?: string; organization_id?: string }) => {
    if (!updatedData.id) return;

    const activeUid = currentUserId || updatedData.userId || updatedData.organization_id || auth.currentUser?.uid || '';
    const normalizedPhone = normalizeETPhone(updatedData.phone);
    const cleanTelegram = (updatedData.telegramChatId || '').replace(/[@\s]/g, '');

    const updatedSubscriber: Subscriber = {
      ...updatedData,
      id: updatedData.id!,
      name: updatedData.name.trim(),
      phone: normalizedPhone,
      telegramChatId: cleanTelegram,
      planName: updatedData.planName,
      amount: Number(updatedData.amount) || 0,
      status: updatedData.status,
      nextBillingDate: updatedData.nextBillingDate,
      lastPaymentDate: updatedData.lastPaymentDate,
      organization_id: activeUid,
      userId: activeUid,
    };

    setSubscribers((prev) =>
      prev.map((s) => (s.id === updatedData.id ? updatedSubscriber : s))
    );

    await persistSubscriber(updatedSubscriber);

    showToast(`Saved changes for ${updatedSubscriber.name}`);
  };

  // Save Dispatcher for Modal
  const handleSaveSubscriber = async (
    subData: Omit<Subscriber, 'id'> & { id?: string; userId?: string; organization_id?: string }
  ) => {
    if (subData.id && subscribers.some((s) => s.id === subData.id)) {
      await handleEdit(subData);
    } else {
      await handleAdd(subData);
    }
  };

  // CRUD Handler: Delete Subscriber
  const handleDelete = (id: string) => {
    const target = subscribers.find((s) => s.id === id);
    const name = target?.name || 'this subscriber';
    
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id));

      removeSubscriberFromDb(id);

      showToast(`Deleted subscriber: ${name}`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSubscriber(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
          <p className="text-sm font-medium">Restoring session...</p>
        </div>
      </div>
    );
  }

  const overdueCount = subscribers.filter(
    (s) => s.status === 'Overdue' || (s.status === 'Pending' && new Date(s.nextBillingDate) < new Date())
  ).length;

  if (!user) {
    return <AuthScreen key="auth-screen" />;
  }

  return (
    <div key={currentUserId || 'guest'} className="min-h-screen bg-[#f3f4f6] dark:bg-black text-slate-900 dark:text-gray-100 flex font-sans antialiased selection:bg-gray-900 selection:text-white dark:selection:bg-white dark:selection:text-gray-900">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 border ${
            toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/80 shadow-rose-100 dark:shadow-none'
              : 'bg-white dark:bg-black text-gray-900 dark:text-gray-100 border-gray-200 dark:border-neutral-800 shadow-gray-200/80 dark:shadow-none'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* App Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        subscriberCount={subscribers.length}
        overdueCount={overdueCount}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onSignOut={() => setIsSignOutModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#f3f4f6] dark:bg-black">
        {/* Top Navbar Header */}
        <header className="bg-[#f8f9fa]/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img
              src={logoImage}
              alt="Senna Logo"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-lg object-cover md:hidden ring-1 ring-emerald-500/20 shadow-xs shrink-0"
            />
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-200 tracking-tight truncate font-mono">
                <span className="sm:hidden">
                  {currentTab === 'dashboard' && 'Dashboard'}
                  {currentTab === 'subscribers' && 'Subscribers'}
                  {currentTab === 'dunning' && 'Dunning'}
                  {currentTab === 'settings' && 'Settings'}
                </span>
                <span className="hidden sm:inline uppercase text-gray-500 dark:text-gray-400">
                  {currentTab === 'dashboard' && 'Executive Metrics Overview'}
                  {currentTab === 'subscribers' && 'Subscribers Directory Management'}
                  {currentTab === 'dunning' && 'Dunning & Arrears Engine'}
                  {currentTab === 'settings' && 'Platform & Bot Settings'}
                </span>
              </div>
              {isSyncing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1.5 sm:px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60 animate-pulse shrink-0">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-sky-600 dark:text-sky-400" />
                  <span className="hidden xs:inline">Syncing...</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-[#184528] hover:bg-[#12331b] active:bg-[#0c2212] rounded-xl transition-all shadow-xs border border-[#184528] focus:outline-none focus:ring-2 focus:ring-[#184528]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Add Subscriber</span>
              <span className="xs:hidden">Add</span>
            </button>

            {/* Active Organization Business Name Badge (Desktop / Tablet) */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f0eb] dark:bg-[#184528]/30 border border-[#184528]/20 dark:border-emerald-800/40 text-[#184528] dark:text-emerald-300 rounded-xl text-xs font-semibold shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-[#184528] dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[140px] xl:max-w-[200px]">{organizationName}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-[#184528] dark:hover:text-emerald-400 bg-gray-100 dark:bg-black hover:bg-[#e8f0eb] dark:hover:bg-neutral-900 rounded-xl transition-all border border-gray-200 dark:border-neutral-800 shadow-xs active:scale-95"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-gray-700 transition-transform duration-200 rotate-0 hover:-rotate-12" />
              )}
            </button>

            <div className="flex items-center gap-1 sm:gap-2">
              <div 
                title={user?.email || organizationName}
                className="w-7 h-7 rounded-full bg-[#184528] text-white text-xs font-bold flex items-center justify-center shrink-0 border border-[#12331b]"
              >
                {user?.email ? user.email.charAt(0).toUpperCase() : 'S'}
              </div>
              {user && (
                <button
                  onClick={() => setIsSignOutModalOpen(true)}
                  title="Sign Out"
                  className="inline-flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 bg-gray-100 dark:bg-black hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-gray-200 dark:border-neutral-800"
                >
                  <LogOut className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* View Container */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              subscribers={subscribers}
              isLoading={isLoading}
              isSyncing={isSyncing}
              onStatusChange={handleStatusChange}
              onOpenAddModal={handleOpenAddModal}
              onNavigateToSubscribers={() => setCurrentTab('subscribers')}
              onEditSubscriber={handleOpenEditModal}
              onDeleteSubscriber={handleDelete}
              onSendTelegram={handleSendTelegram}
              onSimulatePayment={handleSimulatePayment}
            />
          )}

          {currentTab === 'subscribers' && (
            <SubscribersList
              subscribers={subscribers}
              isLoading={isLoading}
              isSyncing={isSyncing}
              onStatusChange={handleStatusChange}
              onOpenAddModal={handleOpenAddModal}
              onEditSubscriber={handleOpenEditModal}
              onDeleteSubscriber={handleDelete}
              onSendTelegram={handleSendTelegram}
              onSimulatePayment={handleSimulatePayment}
            />
          )}

          {currentTab === 'dunning' && (
            <DunningView
              subscribers={subscribers}
              onStatusChange={handleStatusChange}
              onSendTelegram={handleSendTelegram}
              onSimulatePayment={handleSimulatePayment}
              botToken={botToken}
              showToast={showToast}
            />
          )}

          {currentTab === 'settings' && (
            <Settings botToken={botToken} onUpdateBotToken={handleUpdateBotToken} />
          )}
        </main>
      </div>

      {/* Add / Edit Subscriber Modal */}
      <SubscriberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubscriber}
        initialData={editingSubscriber}
        userId={currentUserId}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}



