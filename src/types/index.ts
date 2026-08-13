export type SubscriptionStatus = 'Active' | 'Pending' | 'Overdue';

export interface Organization {
  id: string;
  name: string;
  tax_id?: string;
  default_currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  user_id?: string;
  full_name?: string;
  email?: string;
  role?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  telegramChatId: string;
  planName: string;
  amount: number;
  status: SubscriptionStatus;
  nextBillingDate: string;
  lastPaymentDate: string;
  organization_id?: string;
  userId?: string;
  created_at?: string;
  updated_at?: string;
}

export type NavTab = 'dashboard' | 'subscribers' | 'dunning' | 'settings';
