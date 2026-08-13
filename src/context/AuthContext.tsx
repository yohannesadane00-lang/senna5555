import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { clearAllLocalStorage } from '../lib/storage';

export interface AuthUser {
  id: string;
  uid: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  user_metadata?: {
    business_name?: string;
    organization_name?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  organizationId: string;
  organizationName: string;
  signUpWithEmail: (
    email: string,
    password: string,
    businessName: string
  ) => Promise<{ user?: FirebaseUser; error?: string }>;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ user?: AuthUser; error?: string; unverifiedEmail?: string }>;
  resendVerificationEmail: (
    email?: string,
    password?: string
  ) => Promise<{ error?: string }>;
  login: (identifier: string, password?: string) => Promise<{ error?: string }>;
  signUpWithOtp: (
    identifier: string,
    metadata?: { business_name?: string }
  ) => Promise<{ error?: string }>;
  verifySignupOtp: (
    identifier: string,
    otpToken: string,
    password?: string,
    metadata?: { business_name?: string }
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  setDemoUserSession: (email: string, businessName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const mapFirebaseError = (error: any): string => {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  if (code === 'auth/email-already-in-use') {
    return 'This email address is already registered. Please sign in instead.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. It should be at least 6 characters long.';
  }
  if (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential'
  ) {
    return 'Invalid email address or password. Please check your credentials and try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed login attempts. Please wait a few minutes before trying again.';
  }
  if (code === 'auth/user-disabled') {
    return 'This user account has been disabled. Please contact support.';
  }
  return message || 'Authentication failed. Please check your details and try again.';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Start with clean empty strings to prevent reading stale previous sessions
  const [organizationId, setOrganizationId] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');

  // Central Helper to reset all state cleanly
  const resetAuthState = () => {
    try {
      localStorage.removeItem('senna_org_id');
      localStorage.removeItem('senna_org_name');
      localStorage.removeItem('senna_demo_user');
    } catch (e) {
      console.warn('Error clearing session storage:', e);
    }
    setUser(null);
    setOrganizationId('');
    setOrganizationName('');
  };

  // Sync Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        if (fbUser.emailVerified) {
          const uid = fbUser.uid;
          const storedOrgName =
            fbUser.displayName ||
            localStorage.getItem(`senna_org_name_${uid}`) ||
            'My Organization';

          const mappedUser: AuthUser = {
            id: uid,
            uid,
            email: fbUser.email || '',
            emailVerified: true,
            user_metadata: {
              business_name: storedOrgName,
              organization_name: storedOrgName,
            },
          };

          setUser(mappedUser);
          setOrganizationId(uid);
          setOrganizationName(storedOrgName);

          // Scope storage keys specifically to this user UID
          localStorage.setItem('senna_org_id', uid);
          localStorage.setItem('senna_org_name', storedOrgName);
          localStorage.setItem(`senna_org_name_${uid}`, storedOrgName);

          setLoading(false);

          // Non-blocking background sync for profile updates
          fbUser.reload().catch((e) => console.warn('Background reload warning:', e));
        } else {
          // Unverified user — purge session state completely
          resetAuthState();
          setLoading(false);
        }
      } else {
        // Check for stored demo session
        const storedDemo = localStorage.getItem('senna_demo_user');
        if (storedDemo) {
          try {
            const parsed = JSON.parse(storedDemo);
            const orgId = parsed.id || parsed.uid || 'demo-org-id';
            const orgName =
              parsed.user_metadata?.business_name ||
              'My Organization';

            setUser(parsed);
            setOrganizationId(orgId);
            setOrganizationName(orgName);
            localStorage.setItem('senna_org_id', orgId);
            localStorage.setItem('senna_org_name', orgName);
          } catch {
            resetAuthState();
          }
        } else {
          resetAuthState();
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sign Up with Email/Password and send verification email
  const signUpWithEmail = async (
    email: string,
    password: string,
    businessName: string
  ): Promise<{ user?: FirebaseUser; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = businessName.trim() || 'My Organization';

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const newFbUser = userCredential.user;

      // Update Firebase profile displayName first so it persists in Google Cloud
      try {
        await updateProfile(newFbUser, { displayName: cleanName });
      } catch (profileErr) {
        console.warn('Firebase updateProfile error on signup:', profileErr);
      }

      // Send verification link email
      await sendEmailVerification(newFbUser);

      // Sign out unverified session
      await signOut(auth);
      resetAuthState();

      return { user: newFbUser };
    } catch (err: any) {
      console.error('Firebase signUpWithEmail error:', err);
      return { error: mapFirebaseError(err) };
    }
  };

  // Log in with Email/Password & check emailVerified guard
  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ user?: AuthUser; error?: string; unverifiedEmail?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      await fbUser.reload();

      if (!fbUser.emailVerified) {
        await signOut(auth);
        resetAuthState();
        return {
          error: 'Please verify your email address before logging in.',
          unverifiedEmail: cleanEmail,
        };
      }

      const uid = fbUser.uid;
      const resolvedOrgName = fbUser.displayName || 'My Organization';

      const authenticatedUser: AuthUser = {
        id: uid,
        uid,
        email: fbUser.email || cleanEmail,
        emailVerified: true,
        user_metadata: {
          business_name: resolvedOrgName,
          organization_name: resolvedOrgName,
        },
      };

      // Set state directly
      setUser(authenticatedUser);
      setOrganizationId(uid);
      setOrganizationName(resolvedOrgName);

      localStorage.setItem('senna_org_id', uid);
      localStorage.setItem('senna_org_name', resolvedOrgName);
      localStorage.setItem(`senna_org_name_${uid}`, resolvedOrgName);

      return { user: authenticatedUser };
    } catch (err: any) {
      console.error('Firebase loginWithEmail error:', err);
      return { error: mapFirebaseError(err) };
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (
    email?: string,
    password?: string
  ): Promise<{ error?: string }> => {
    try {
      let activeUser = auth.currentUser;

      if (!activeUser && email && password) {
        const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        activeUser = cred.user;
      }

      if (activeUser) {
        await sendEmailVerification(activeUser);
        if (!activeUser.emailVerified) {
          await signOut(auth);
          resetAuthState();
        }
        return {};
      } else {
        return {
          error: 'Unable to resend verification email. Please re-enter your credentials and try again.',
        };
      }
    } catch (err: any) {
      console.error('Firebase resendVerificationEmail error:', err);
      return { error: mapFirebaseError(err) };
    }
  };

  // Demo User Session Setter
  const setDemoUserSession = (email: string, businessName?: string) => {
    resetAuthState();
    const cleanEmail = email.trim().toLowerCase();
    const resolvedName = businessName?.trim() || 'Abebe Logistics PLC';
    const demoUid = 'org_' + Math.random().toString(36).substring(2, 9);

    const demoUser: AuthUser = {
      id: demoUid,
      uid: demoUid,
      email: cleanEmail,
      emailVerified: true,
      user_metadata: {
        business_name: resolvedName,
        organization_name: resolvedName,
      },
    };

    localStorage.setItem('senna_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('senna_org_id', demoUid);
    localStorage.setItem('senna_org_name', resolvedName);

    setUser(demoUser);
    setOrganizationId(demoUid);
    setOrganizationName(resolvedName);
  };

  // Legacy/Fallback wrappers
  const login = async (identifier: string, password?: string): Promise<{ error?: string }> => {
    if (password) {
      const res = await loginWithEmail(identifier, password);
      return { error: res.error };
    }
    setDemoUserSession(identifier);
    return {};
  };

  const signUpWithOtp = async (
    _identifier: string,
    metadata?: { business_name?: string }
  ): Promise<{ error?: string }> => {
    if (metadata?.business_name) {
      localStorage.setItem('senna_pending_org_name', metadata.business_name);
    }
    return {};
  };

  const verifySignupOtp = async (
    identifier: string,
    _otpToken: string,
    _password?: string,
    metadata?: { business_name?: string }
  ): Promise<{ error?: string }> => {
    setDemoUserSession(identifier, metadata?.business_name);
    return {};
  };

  // Logout
  const logout = async () => {
    try {
      resetAuthState();
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut error:', err);
    } finally {
      resetAuthState();
      window.location.href = window.location.origin;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        organizationId,
        organizationName,
        signUpWithEmail,
        loginWithEmail,
        resendVerificationEmail,
        login,
        signUpWithOtp,
        verifySignupOtp,
        logout,
        setDemoUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
