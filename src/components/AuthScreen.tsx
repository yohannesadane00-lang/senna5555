import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, mapFirebaseError } from '../context/AuthContext';
import {
  Building2,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  MailCheck,
  Send,
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthScreen: React.FC = () => {
  const { signUpWithEmail, loginWithEmail, resendVerificationEmail, setDemoUserSession } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [screenStep, setScreenStep] = useState<'form' | 'verify-email'>('form');

  // Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field Touched Tracking
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [businessNameTouched, setBusinessNameTouched] = useState(false);

  // Unverified Login State for Resend Link
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Resend Timer & UI State
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend Cooldown Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Email Validation & Sanitization
  const sanitizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const isEmailValid = useMemo(() => EMAIL_REGEX.test(sanitizedEmail), [sanitizedEmail]);

  // Password Rules & Strength Checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isPasswordRulesMet = useMemo(() => {
    return hasMinLength && hasUppercase && hasLowercase && hasNumber;
  }, [hasMinLength, hasUppercase, hasLowercase, hasNumber]);

  const passwordStrength = useMemo(() => {
    if (!password) return { label: '', color: '', width: '0%', textColor: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;

    if (score <= 2) {
      return { label: 'Weak', color: 'bg-rose-500', width: '33%', textColor: 'text-rose-400' };
    } else if (score === 3) {
      return { label: 'Medium', color: 'bg-amber-500', width: '66%', textColor: 'text-amber-400' };
    } else {
      return { label: 'Strong', color: 'bg-emerald-500', width: '100%', textColor: 'text-emerald-400' };
    }
  }, [password, hasUppercase, hasLowercase, hasNumber]);

  const isConfirmPasswordMatching = useMemo(() => {
    return password === confirmPassword;
  }, [password, confirmPassword]);

  // Form Validity
  const isFormValid = useMemo(() => {
    if (activeTab === 'signin') {
      return isEmailValid && password.length > 0;
    } else {
      return (
        businessName.trim().length > 0 &&
        isEmailValid &&
        isPasswordRulesMet &&
        isConfirmPasswordMatching
      );
    }
  }, [
    activeTab,
    isEmailValid,
    password,
    businessName,
    isPasswordRulesMet,
    isConfirmPasswordMatching,
  ]);

  // Handle Tab Switch
  const handleTabChange = (tab: 'signin' | 'register') => {
    setActiveTab(tab);
    setScreenStep('form');
    setGeneralError(null);
    setSuccessMessage(null);
    setUnverifiedEmail(null);
    setEmailTouched(false);
    setPasswordTouched(false);
    setConfirmPasswordTouched(false);
    setBusinessNameTouched(false);
  };

  // Submit Login or Register Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);
    setUnverifiedEmail(null);

    setEmailTouched(true);
    setPasswordTouched(true);
    if (activeTab === 'register') {
      setBusinessNameTouched(true);
      setConfirmPasswordTouched(true);
    }

    if (!isFormValid) return;

    setLoading(true);

    try {
      if (activeTab === 'signin') {
        const res = await loginWithEmail(sanitizedEmail, password);
        if (res.error) {
          setGeneralError(res.error);
          if (res.unverifiedEmail) {
            setUnverifiedEmail(res.unverifiedEmail);
          }
        }
      } else {
        const res = await signUpWithEmail(sanitizedEmail, password, businessName);
        if (res.error) {
          setGeneralError(res.error);
        } else {
          setScreenStep('verify-email');
          setResendTimer(60);
          setSuccessMessage(`Verification email sent to ${sanitizedEmail}`);
        }
      }
    } catch (err: any) {
      setGeneralError(mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend Verification Email
  const handleResendEmail = async () => {
    if (resendTimer > 0 || resendLoading) return;
    setResendLoading(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const targetEmail = unverifiedEmail || sanitizedEmail;
      const res = await resendVerificationEmail(targetEmail, password);

      if (res.error) {
        setGeneralError(res.error);
      } else {
        setResendTimer(60);
        setSuccessMessage(`Verification email resent to ${targetEmail}! Please check your inbox and spam folder.`);
      }
    } catch (err: any) {
      setGeneralError(mapFirebaseError(err));
    } finally {
      setResendLoading(false);
    }
  };

  // Auto-fill Test Demo User
  const handleUseDemo = (demoEmail: string, demoBiz: string) => {
    setEmail(demoEmail);
    setBusinessName(demoBiz);
    setDemoUserSession(demoEmail, demoBiz);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#184528] text-white flex items-center justify-center shadow-md border border-[#12331b]">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Senna Commerce</span>
        </div>
        <h2 className="mt-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          B2B Subscription Management Portal
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-black py-8 px-6 shadow-md rounded-2xl border border-gray-200 dark:border-neutral-800 sm:px-10">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100/80 dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-800 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'signin'
                  ? 'bg-[#184528] text-white shadow-xs font-bold border border-[#12331b]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-[#184528] dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-[#184528] text-white shadow-xs font-bold border border-[#12331b]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-[#184528] dark:hover:text-white'
              }`}
            >
              Register Business
            </button>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-rose-700 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{generalError}</div>
              </div>

              {/* Resend Verification Button directly in Error Banner if user is unverified */}
              {unverifiedEmail && (
                <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-[11px] text-rose-600">Need a new link?</span>
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resendTimer > 0 || resendLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 font-semibold text-[11px] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>
                      {resendTimer > 0 ? `Resend Email (${resendTimer}s)` : 'Resend Verification Email'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* General Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{successMessage}</div>
            </div>
          )}

          {/* SCREEN STEP: VERIFY EMAIL POST-REGISTRATION */}
          {screenStep === 'verify-email' ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 mx-auto flex items-center justify-center text-sky-700 shadow-xs">
                <MailCheck className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-gray-900">Verify Your Email Address</h3>
                <p className="text-xs text-gray-600 leading-relaxed px-2">
                  We sent a verification link to{' '}
                  <span className="font-bold text-gray-900">{sanitizedEmail}</span>. Please check your inbox and click the link to activate your business account.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 text-left space-y-2">
                <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Next Steps:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>Open your email client and find the verification message.</li>
                  <li>Click the verification link in the email.</li>
                  <li>Return here and click <strong>Sign In</strong> to access your dashboard.</li>
                </ol>
              </div>

              <div className="space-y-3 pt-2">
                {/* Resend Verification Button */}
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendTimer > 0 || resendLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Resending Verification Email...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        {resendTimer > 0
                          ? `Resend Verification Email (${resendTimer}s)`
                          : 'Resend Verification Email'}
                      </span>
                    </>
                  )}
                </button>

                {/* Back to Sign In button */}
                <button
                  type="button"
                  onClick={() => handleTabChange('signin')}
                  className="w-full inline-flex justify-center items-center gap-1.5 py-2.5 text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            /* STANDARD FORM: SIGN IN OR REGISTER */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Business Name Field (Register Only) */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onBlur={() => setBusinessNameTouched(true)}
                      placeholder="e.g. Abebe Logistics PLC"
                      className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:outline-none transition-all ${
                        businessNameTouched && !businessName.trim()
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                          : 'border-gray-300 dark:border-neutral-800 focus:ring-2 focus:ring-[#184528] focus:border-[#184528]'
                      }`}
                    />
                  </div>
                  {businessNameTouched && !businessName.trim() && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Business name is required to register an account.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Email Address Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="admin@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:outline-none transition-all ${
                      emailTouched && !isEmailValid
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-gray-300 dark:border-neutral-800 focus:ring-2 focus:ring-[#184528] focus:border-[#184528]'
                    }`}
                  />
                </div>
                {emailTouched && email.trim().length > 0 && !isEmailValid && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Please enter a valid email address (e.g. name@domain.com).</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {activeTab === 'register' && password.length > 0 && (
                    <span className={`text-[10px] font-bold uppercase ${passwordStrength.textColor}`}>
                      Strength: {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-black border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:outline-none transition-all ${
                      activeTab === 'register' && passwordTouched && !isPasswordRulesMet
                        ? 'border-amber-400 focus:ring-2 focus:ring-amber-200'
                        : 'border-gray-300 dark:border-neutral-800 focus:ring-2 focus:ring-[#184528] focus:border-[#184528]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Checklist (Register Tab) */}
                {activeTab === 'register' && password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px] text-gray-500">
                      <div className="flex items-center gap-1">
                        {hasMinLength ? (
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3 h-3 rounded-full border border-gray-300 inline-block shrink-0" />
                        )}
                        <span className={hasMinLength ? 'text-gray-900 font-medium' : ''}>Min 8 chars</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {hasUppercase ? (
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3 h-3 rounded-full border border-gray-300 inline-block shrink-0" />
                        )}
                        <span className={hasUppercase ? 'text-gray-900 font-medium' : ''}>1 Uppercase (A-Z)</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {hasLowercase ? (
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3 h-3 rounded-full border border-gray-300 inline-block shrink-0" />
                        )}
                        <span className={hasLowercase ? 'text-gray-900 font-medium' : ''}>1 Lowercase (a-z)</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {hasNumber ? (
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <span className="w-3 h-3 rounded-full border border-gray-300 inline-block shrink-0" />
                        )}
                        <span className={hasNumber ? 'text-gray-900 font-medium' : ''}>1 Number (0-9)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field (Register Only) */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setConfirmPasswordTouched(true)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-gray-900 placeholder-gray-400 text-xs focus:outline-none transition-all ${
                        confirmPasswordTouched && !isConfirmPasswordMatching
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                          : confirmPassword.length > 0 && isConfirmPasswordMatching
                          ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-200'
                          : 'border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-gray-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {confirmPasswordTouched && confirmPassword.length > 0 && !isConfirmPasswordMatching && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-rose-600 text-[11px] font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords do not match. Please re-enter.</span>
                    </div>
                  )}

                  {confirmPassword.length > 0 && isConfirmPasswordMatching && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-emerald-600 text-[11px] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Passwords match perfectly.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-[#184528] hover:bg-[#12331b] active:bg-[#0c2212] text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-[#184528] focus:ring-2 focus:ring-[#184528]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : activeTab === 'signin' ? (
                    <span>Sign In to Dashboard</span>
                  ) : (
                    <span>Register & Send Verification Link</span>
                  )}
                </button>

                {/* Quick Demo Test Mode Shortcuts */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Test Mode (Instant Session)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUseDemo('demo.admin@senna.et', 'Senna Logistics PLC')}
                      className="py-2 px-2 text-[11px] text-[#184528] dark:text-emerald-300 hover:bg-[#e8f0eb] dark:hover:bg-[#184528]/30 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all font-semibold truncate text-center"
                    >
                      ⚡ Demo Admin Login
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseDemo('kebede@senna.et', 'Kebede Trading PLC')}
                      className="py-2 px-2 text-[11px] text-[#184528] dark:text-emerald-300 hover:bg-[#e8f0eb] dark:hover:bg-[#184528]/30 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all font-semibold truncate text-center"
                    >
                      ⚡ Demo Merchant Login
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Footer Badge */}
          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Firebase Auth Engine & Email Link Guard</span>
          </div>
        </div>
      </div>
    </div>
  );
};
