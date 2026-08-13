import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subscriber, SubscriptionStatus } from '../types';
import { useAuth } from './AuthContext';
import { db, auth } from '../lib/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getSecureItem, setSecureItem } from '../lib/storage';

interface DataContextType {
  subscribers: Subscriber[];
  setSubscribers: React.Dispatch<React.SetStateAction<Subscriber[]>>;
  isDataLoaded: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  persistSubscriber: (sub: Subscriber) => Promise<void>;
  removeSubscriberFromDb: (id: string) => Promise<void>;
  refreshSubscribers: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, organizationId } = useAuth();
  
  const activeOrgId = organizationId || user?.uid || auth.currentUser?.uid || '';

  // 1. STALE-WHILE-REVALIDATE: Initialize immediately from user-scoped cache
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
    if (!activeOrgId) return [];
    try {
      const cached = getSecureItem<Subscriber[]>('subscribers', activeOrgId);
      if (Array.isArray(cached)) {
        return cached;
      }
    } catch (err) {
      console.warn('[DataContext] Cache read error:', err);
    }
    return [];
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. REACTIVE DATA FETCHING & AUTO-CLEANUP
  useEffect(() => {
    // When activeOrgId is empty or changes (logout / user switch), immediately wipe in-memory state
    if (!auth.currentUser?.uid || !activeOrgId) {
      setSubscribers([]);
      setIsDataLoaded(false);
      setIsLoading(false);
      setIsSyncing(false);
      return;
    }

    // Load from cache for frame-1 rendering (0ms delay)
    const cachedData = getSecureItem<Subscriber[]>('subscribers', activeOrgId);
    if (Array.isArray(cachedData) && cachedData.length > 0) {
      setSubscribers(cachedData);
      setIsDataLoaded(true);
      setIsLoading(false);
    } else {
      setSubscribers([]);
      setIsLoading(true);
    }

    setIsSyncing(true);

    // Filter strictly by organization_id
    const qOrg = query(collection(db, 'subscribers'), where('organization_id', '==', activeOrgId));

    // Real-time listener with automatic teardown
    const unsubscribe = onSnapshot(
      qOrg,
      (snapshot) => {
        const recordsMap = new Map<string, Subscriber>();

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          recordsMap.set(docSnap.id, {
            id: docSnap.id,
            name: d.name || '',
            phone: d.phone || '',
            telegramChatId: d.telegramChatId || d.telegram_chat_id || '',
            planName: d.planName || d.plan_name || '',
            amount: Number(d.amount) || 0,
            status: (d.status as SubscriptionStatus) || 'Pending',
            nextBillingDate: d.nextBillingDate || d.next_billing_date || '',
            lastPaymentDate: d.lastPaymentDate || d.last_payment_date || '',
            organization_id: d.organization_id || activeOrgId,
          });
        });

        const fetchedList = Array.from(recordsMap.values());

        setSubscribers(fetchedList);
        setSecureItem('subscribers', activeOrgId, fetchedList);
        setIsDataLoaded(true);
        setIsLoading(false);
        setIsSyncing(false);
      },
      (err) => {
        console.warn('[DataContext] Firestore onSnapshot error:', err);
        setIsLoading(false);
        setIsSyncing(false);
      }
    );

    // PROPER LISTENER TEARDOWN on unmount or user switch
    return () => {
      unsubscribe();
      setSubscribers([]);
      setIsDataLoaded(false);
      setIsLoading(false);
      setIsSyncing(false);
    };
  }, [activeOrgId, user]);

  // Sync to localStorage when subscribers state changes
  useEffect(() => {
    if (isDataLoaded && activeOrgId) {
      setSecureItem('subscribers', activeOrgId, subscribers);
    }
  }, [subscribers, isDataLoaded, activeOrgId]);

  // Persist single subscriber to DB
  const persistSubscriber = async (sub: Subscriber) => {
    if (!auth.currentUser?.uid || !activeOrgId) {
      console.warn('[DataContext] Blocked persistSubscriber: Unauthenticated session.');
      return;
    }

    const payload = {
      id: sub.id,
      name: sub.name,
      phone: sub.phone,
      telegramChatId: sub.telegramChatId,
      telegram_chat_id: sub.telegramChatId,
      planName: sub.planName,
      plan_name: sub.planName,
      amount: sub.amount,
      status: sub.status,
      nextBillingDate: sub.nextBillingDate,
      next_billing_date: sub.nextBillingDate,
      lastPaymentDate: sub.lastPaymentDate,
      last_payment_date: sub.lastPaymentDate,
      user_id: activeOrgId,
      organization_id: activeOrgId,
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'subscribers', sub.id), payload, { merge: true });
    } catch (err) {
      console.warn('[DataContext] Firestore setDoc error:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('subscribers').upsert({
          id: sub.id,
          user_id: activeOrgId,
          organization_id: activeOrgId,
          name: sub.name,
          phone: sub.phone,
          telegram_chat_id: sub.telegramChatId,
          plan_name: sub.planName,
          amount: sub.amount,
          status: sub.status,
          next_billing_date: sub.nextBillingDate,
          last_payment_date: sub.lastPaymentDate,
        });
      } catch (err) {
        console.warn('[DataContext] Supabase upsert error:', err);
      }
    }
  };

  // Remove subscriber from DB
  const removeSubscriberFromDb = async (id: string) => {
    if (!auth.currentUser?.uid || !activeOrgId) {
      console.warn('[DataContext] Blocked removeSubscriberFromDb: Unauthenticated session.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'subscribers', id));
    } catch (err) {
      console.warn('[DataContext] Firestore deleteDoc error:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('subscribers').delete().eq('id', id).eq('organization_id', activeOrgId);
      } catch (err) {
        console.warn('[DataContext] Supabase delete error:', err);
      }
    }
  };

  const refreshSubscribers = async () => {
    if (!activeOrgId) return;
    setIsSyncing(true);
    // Triggers refetch by resetting isDataLoaded
    setIsDataLoaded(false);
  };

  return (
    <DataContext.Provider
      value={{
        subscribers,
        setSubscribers,
        isDataLoaded,
        isLoading,
        isSyncing,
        persistSubscriber,
        removeSubscriberFromDb,
        refreshSubscribers,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
