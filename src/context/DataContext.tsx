import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subscriber, SubscriptionStatus } from '../types';
import { useAuth } from './AuthContext';
import { db, auth } from '../lib/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, onSnapshot, or } from 'firebase/firestore';
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
    if (!activeOrgId) {
      setSubscribers([]);
      setIsDataLoaded(false);
      setIsLoading(false);
      setIsSyncing(false);
      return;
    }

    // Load from user-scoped cache for 0ms frame-1 rendering
    const cachedData = getSecureItem<Subscriber[]>('subscribers', activeOrgId) || [];
    setSubscribers(cachedData);
    setIsDataLoaded(true);
    setIsLoading(false);
    setIsSyncing(true);

    const processSnapshot = (snapshot: any) => {
      const remoteMap = new Map<string, Subscriber>();

      snapshot.forEach((docSnap: any) => {
        const d = docSnap.data();
        const docOwner = d.organization_id || d.organizationId || d.user_id || d.userId || d.businessId || activeOrgId;
        
        if (docOwner === activeOrgId) {
          remoteMap.set(docSnap.id, {
            id: docSnap.id,
            name: d.name || '',
            phone: d.phone || '',
            telegramChatId: d.telegramChatId || d.telegram_chat_id || '',
            planName: d.planName || d.plan_name || '',
            amount: Number(d.amount) || 0,
            status: (d.status as SubscriptionStatus) || 'Pending',
            nextBillingDate: d.nextBillingDate || d.next_billing_date || '',
            lastPaymentDate: d.lastPaymentDate || d.last_payment_date || '',
            organization_id: activeOrgId,
          });
        }
      });

      // Merge remote snapshot with local cached items so nothing created locally is lost
      const currentLocal = getSecureItem<Subscriber[]>('subscribers', activeOrgId) || [];
      const mergedMap = new Map<string, Subscriber>();

      remoteMap.forEach((sub, id) => mergedMap.set(id, sub));
      currentLocal.forEach((sub) => {
        if (!mergedMap.has(sub.id)) {
          mergedMap.set(sub.id, sub);
        }
      });

      const mergedList = Array.from(mergedMap.values());

      setSubscribers(mergedList);
      setSecureItem('subscribers', activeOrgId, mergedList);
      setIsDataLoaded(true);
      setIsLoading(false);
      setIsSyncing(false);
    };

    let primaryQuery;
    try {
      primaryQuery = query(
        collection(db, 'subscribers'),
        or(
          where('organization_id', '==', activeOrgId),
          where('user_id', '==', activeOrgId),
          where('userId', '==', activeOrgId),
          where('businessId', '==', activeOrgId)
        )
      );
    } catch {
      primaryQuery = query(collection(db, 'subscribers'), where('organization_id', '==', activeOrgId));
    }

    let unsubscribe = onSnapshot(
      primaryQuery,
      processSnapshot,
      (err) => {
        console.warn('[DataContext] Firestore onSnapshot fallback:', err?.message || err);
        const fallbackQuery = query(collection(db, 'subscribers'), where('organization_id', '==', activeOrgId));
        unsubscribe = onSnapshot(fallbackQuery, processSnapshot, () => {
          setIsLoading(false);
          setIsSyncing(false);
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeOrgId, user]);

  // Sync to localStorage when subscribers state changes
  useEffect(() => {
    if (activeOrgId) {
      setSecureItem('subscribers', activeOrgId, subscribers);
    }
  }, [subscribers, activeOrgId]);

  // Persist single subscriber to DB & Local Cache
  const persistSubscriber = async (sub: Subscriber) => {
    const targetOrgId = activeOrgId || auth.currentUser?.uid || sub.organization_id || '';
    if (!targetOrgId) {
      console.warn('[DataContext] Blocked persistSubscriber: Missing targetOrgId.');
      return;
    }

    // Update local storage immediately for complete reliability
    const localCached = getSecureItem<Subscriber[]>('subscribers', targetOrgId) || [];
    const updatedLocal = [sub, ...localCached.filter((s) => s.id !== sub.id)];
    setSecureItem('subscribers', targetOrgId, updatedLocal);

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
      user_id: targetOrgId,
      userId: targetOrgId,
      organization_id: targetOrgId,
      organizationId: targetOrgId,
      businessId: targetOrgId,
      created_by: auth.currentUser?.uid || targetOrgId,
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'subscribers', sub.id), payload, { merge: true });
    } catch (err) {
      console.warn('[DataContext] Firestore setDoc notice:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('subscribers').upsert({
          id: sub.id,
          user_id: targetOrgId,
          userId: targetOrgId,
          organization_id: targetOrgId,
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
        console.warn('[DataContext] Supabase upsert notice:', err);
      }
    }
  };

  // Remove subscriber from DB & Local Cache
  const removeSubscriberFromDb = async (id: string) => {
    const targetOrgId = activeOrgId || auth.currentUser?.uid || '';
    if (!targetOrgId) return;

    // Immediately update local cache
    const localCached = getSecureItem<Subscriber[]>('subscribers', targetOrgId) || [];
    const updatedLocal = localCached.filter((s) => s.id !== id);
    setSecureItem('subscribers', targetOrgId, updatedLocal);

    try {
      await deleteDoc(doc(db, 'subscribers', id));
    } catch (err) {
      console.warn('[DataContext] Firestore deleteDoc notice:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('subscribers').delete().eq('id', id).eq('organization_id', targetOrgId);
      } catch (err) {
        console.warn('[DataContext] Supabase delete notice:', err);
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
