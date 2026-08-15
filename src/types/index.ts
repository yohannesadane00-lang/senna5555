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

export type TransactionStatus = 'Completed' | 'Pending' | 'Failed' | 'Refunded';

export type PaymentChannel = 
  | 'Chapa Pay' 
  | 'Telebirr' 
  | 'CBE Birr' 
  | 'Bank Transfer' 
  | 'Cash / Direct';

export interface CompanyTransaction {
  id: string;
  referenceNumber: string;
  subscriberId: string;
  subscriberName: string;
  subscriberPhone: string;
  planName: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentChannel: PaymentChannel;
  paymentDate: string;
  billingCycleStart: string;
  billingCycleEnd: string;
  recordedBy: string;
  channel: 'Admin Console' | 'Automated Engine' | 'Telegram Bot' | 'API Webhook';
  notes?: string;
}

export type HistoryActionType = 
  | 'CREATED' 
  | 'STATUS_CHANGE' 
  | 'PLAN_UPDATE' 
  | 'PAYMENT_RENEWAL' 
  | 'TELEGRAM_NOTICE' 
  | 'PHONE_NORMALIZED' 
  | 'MANUAL_EDIT';

export interface HistoryDiffField {
  fieldName: string;
  previousValue: string | number | null;
  newValue: string | number | null;
}

export interface SubscriberHistoryLog {
  id: string;
  subscriberId: string;
  actionType: HistoryActionType;
  title: string;
  description: string;
  actor: string;
  channel: 'Admin Dashboard' | 'Automated Engine' | 'Telegram Bot' | 'API Webhook';
  diffs?: HistoryDiffField[];
  timestamp: string;
  metadata?: Record<string, any>;
}
