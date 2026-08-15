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
  
  const currentUserId = user?.uid || user?.id || organizationId || auth.currentUser?.uid || '';

  // 1. STALE-WHILE-REVALIDATE: Initialize immediately from user-scoped storage (subscribers_${userId})
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
    if (!currentUserId) return [];
    try {
      const cached = getSecureItem<Subscriber[]>('subscribers', currentUserId);
      if (Array.isArray(cached)) {
        return cached.filter(
          (sub) => !sub.userId || sub.userId === currentUserId || sub.organization_id === currentUserId
        );
      }
    } catch (err) {
      console.warn('[DataContext] Cache read error:', err);
    }
    return [];
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. REACTIVE DATA FETCHING & FILTERED SUBSCRIPTIONS
  useEffect(() => {
    if (!currentUserId) {
      setSubscribers([]);
      setIsDataLoaded(false);
      setIsLoading(false);
      setIsSyncing(false);
      return;
    }

    // Load from user-scoped cache for instant zero-latency rendering
    const cachedData = (getSecureItem<Subscriber[]>('subscribers', currentUserId) || []).filter(
      (sub) => !sub.userId || sub.userId === currentUserId || sub.organization_id === currentUserId
    );
    setSubscribers(cachedData);
    setIsDataLoaded(true);
    setIsLoading(false);
    setIsSyncing(true);

    const processSnapshot = (snapshot: any) => {
      const remoteMap = new Map<string, Subscriber>();

      snapshot.forEach((docSnap: any) => {
        const d = docSnap.data();
        const docOwner = d.userId || d.user_id || d.organization_id || d.organizationId || d.businessId;
        
        // Strict user-ownership isolation
        if (!docOwner || docOwner === currentUserId) {
          remoteMap.set(docSnap.id, {
            id: docSnap.id,
            userId: currentUserId,
            organization_id: currentUserId,
            name: d.name || '',
            phone: d.phone || '',
            telegramChatId: d.telegramChatId || d.telegram_chat_id || '',
            planName: d.planName || d.plan_name || '',
            amount: Number(d.amount) || 0,
            status: (d.status as SubscriptionStatus) || 'Pending',
            nextBillingDate: d.nextBillingDate || d.next_billing_date || '',
            lastPaymentDate: d.lastPaymentDate || d.last_payment_date || '',
            created_at: d.created_at || d.createdAt,
            updated_at: d.updated_at || d.updatedAt,
          });
        }
      });

      // Merge remote snapshot with local cached items for this user
      const currentLocal = (getSecureItem<Subscriber[]>('subscribers', currentUserId) || []).filter(
        (sub) => !sub.userId || sub.userId === currentUserId || sub.organization_id === currentUserId
      );
      const mergedMap = new Map<string, Subscriber>();

      remoteMap.forEach((sub, id) => mergedMap.set(id, sub));
      currentLocal.forEach((sub) => {
        if (!mergedMap.has(sub.id)) {
          mergedMap.set(sub.id, { ...sub, userId: currentUserId, organization_id: currentUserId });
        }
      });

      const mergedList = Array.from(mergedMap.values());

      setSubscribers(mergedList);
      setSecureItem('subscribers', currentUserId, mergedList);
      setIsDataLoaded(true);
      setIsLoading(false);
      setIsSyncing(false);
    };

    let primaryQuery;
    try {
      primaryQuery = query(
        collection(db, 'subscribers'),
        or(
          where('userId', '==', currentUserId),
          where('user_id', '==', currentUserId),
          where('organization_id', '==', currentUserId),
          where('organizationId', '==', currentUserId),
          where('businessId', '==', currentUserId)
        )
      );
    } catch {
      primaryQuery = query(collection(db, 'subscribers'), where('userId', '==', currentUserId));
    }

    let unsubscribe = onSnapshot(
      primaryQuery,
      processSnapshot,
      (err) => {
        console.warn('[DataContext] Firestore onSnapshot fallback:', err?.message || err);
        const fallbackQuery = query(collection(db, 'subscribers'), where('userId', '==', currentUserId));
        unsubscribe = onSnapshot(fallbackQuery, processSnapshot, () => {
          setIsLoading(false);
          setIsSyncing(false);
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserId, user]);

  // Sync to localStorage under subscribers_${userId} when subscribers state changes
  useEffect(() => {
    if (currentUserId && subscribers.length >= 0) {
      const userOwned = subscribers.filter(
        (s) => !s.userId || s.userId === currentUserId || s.organization_id === currentUserId
      );
      setSecureItem('subscribers', currentUserId, userOwned);
    }
  }, [subscribers, currentUserId]);

  // Persist single subscriber to DB & Local Cache
  const persistSubscriber = async (sub: Subscriber) => {
    const targetUserId = sub.userId || currentUserId || auth.currentUser?.uid || '';
    if (!targetUserId) {
      console.warn('[DataContext] Blocked persistSubscriber: Missing userId.');
      return;
    }

    const normalizedSub: Subscriber = {
      ...sub,
      userId: targetUserId,
      organization_id: targetUserId,
    };

    // 1. Update local storage under subscribers_${userId} immediately
    const localCached = getSecureItem<Subscriber[]>('subscribers', targetUserId) || [];
    const updatedLocal = [normalizedSub, ...localCached.filter((s) => s.id !== normalizedSub.id)];
    setSecureItem('subscribers', targetUserId, updatedLocal);

    // 2. Explicit async database write to Firestore
    const payload = {
      id: normalizedSub.id,
      name: normalizedSub.name,
      phone: normalizedSub.phone,
      telegramChatId: normalizedSub.telegramChatId,
      telegram_chat_id: normalizedSub.telegramChatId,
      planName: normalizedSub.planName,
      plan_name: normalizedSub.planName,
      amount: normalizedSub.amount,
      status: normalizedSub.status,
      nextBillingDate: normalizedSub.nextBillingDate,
      next_billing_date: normalizedSub.nextBillingDate,
      lastPaymentDate: normalizedSub.lastPaymentDate,
      last_payment_date: normalizedSub.lastPaymentDate,
      userId: targetUserId,
      user_id: targetUserId,
      organization_id: targetUserId,
      organizationId: targetUserId,
      businessId: targetUserId,
      created_by: auth.currentUser?.uid || targetUserId,
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'subscribers', normalizedSub.id), payload, { merge: true });
    } catch (err) {
      console.warn('[DataContext] Firestore setDoc notice:', err);
    }

    // 3. Supabase upsert if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('subscribers').upsert({
          id: normalizedSub.id,
          user_id: targetUserId,
          userId: targetUserId,
          organization_id: targetUserId,
          name: normalizedSub.name,
          phone: normalizedSub.phone,
          telegram_chat_id: normalizedSub.telegramChatId,
          plan_name: normalizedSub.planName,
          amount: normalizedSub.amount,
          status: normalizedSub.status,
          next_billing_date: normalizedSub.nextBillingDate,
          last_payment_date: normalizedSub.lastPaymentDate,
        });
      } catch (err) {
        console.warn('[DataContext] Supabase upsert notice:', err);
      }
    }
  };

  // Remove subscriber from DB & Local Cache
  const removeSubscriberFromDb = async (id: string) => {
    const targetUserId = currentUserId || auth.currentUser?.uid || '';
    if (!targetUserId) return;

    // Immediately update local cache under subscribers_${userId}
    const localCached = getSecureItem<Subscriber[]>('subscribers', targetUserId) || [];
    const updatedLocal = localCached.filter((s) => s.id !== id);
    setSecureItem('subscribers', targetUserId, updatedLocal);

    try {
      await deleteDoc(doc(db, 'subscribers', id));
    } catch (err) {
      console.warn('[DataContext] Firestore deleteDoc notice:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('subscribers')
          .delete()
          .eq('id', id)
          .or(`user_id.eq.${targetUserId},organization_id.eq.${targetUserId}`);
      } catch (err) {
        console.warn('[DataContext] Supabase delete notice:', err);
      }
    }
  };

  const refreshSubscribers = async () => {
    if (!currentUserId) return;
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
