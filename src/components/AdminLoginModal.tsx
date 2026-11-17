import { FormEvent, useState } from 'react';
import {
  User,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react';
import { auth, googleProvider, isVerifiedOwnerAdmin } from '../firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  cafeName: string;
  onAuthenticated: () => void;
}

export function AdminLoginModal({
  isOpen,
  onClose,
  currentUser,
  cafeName,
  onAuthenticated,
}: AdminLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [unauthorizedHost, setUnauthorizedHost] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = isVerifiedOwnerAdmin(currentUser);
  const isUnverifiedSignedIn = Boolean(currentUser && !currentUser.emailVerified);
  const isUnauthorizedSignedIn = Boolean(
    currentUser && currentUser.emailVerified && !isOwner
  );

  const handleEmailPasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setUnauthorizedHost(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const signedInEmail = result.user.email;
      if (!result.user.emailVerified) {
        setInfoMessage(
          'Your email is not verified yet. Send a verification email below and confirm the link in your inbox.'
        );
      } else if (isVerifiedOwnerAdmin(result.user)) {
        setPassword('');
        onAuthenticated();
      } else {
        setErrorMessage(
          `Access denied for ${signedInEmail || 'this account'}. Only the verified website owner may access admin controls.`
        );
      }
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMessage('Incorrect email or password.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Email/Password login is not enabled in Firebase Authentication yet. Enable it in Firebase Console → Authentication → Sign-in method.'
        );
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage(
          'Too many failed attempts. Please wait a few minutes or reset your password.'
        );
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to complete sign-in. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Enter your owner email address first to receive a password link.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setInfoMessage(
        'If an account exists for that email, a password setup/reset link has been sent to your inbox.'
      );
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Please wait a moment before requesting another email.');
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to send password email.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setUnauthorizedHost(null);
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInEmail = result.user.email;
      if (isVerifiedOwnerAdmin(result.user)) {
        onAuthenticated();
      } else {
        setErrorMessage(
          `Access denied for ${signedInEmail || 'this account'}. Only the verified owner account may access admin controls.`
        );
      }
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in was cancelled before completion.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage(
          'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        const host =
          typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setUnauthorizedHost(host);
        setErrorMessage(
          `Domain "${host}" is not yet in your Firebase Authorized Domains list.`
        );
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to complete sign-in. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendVerification = async () => {
    if (!currentUser) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await sendEmailVerification(currentUser);
      setInfoMessage('Verification email sent. Check your inbox and spam folder.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not send verification email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!currentUser) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await currentUser.reload();
      await currentUser.getIdToken(true);
      const refreshedUser = auth.currentUser;
      const isRefreshedVerified = Boolean(refreshedUser?.emailVerified);
      if (isVerifiedOwnerAdmin(refreshedUser)) {
        onAuthenticated();
      } else if (isRefreshedVerified) {
        setErrorMessage(
          'Access denied. Only the verified website owner may manage website content.'
        );
      } else {
        setInfoMessage('Email is still unverified. Click the link in your inbox first.');
      }
    } catch {
      setErrorMessage('Unable to refresh account status. Please try signing in again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await signOut(auth);
    } catch {
      setErrorMessage('Failed to sign out. Please refresh and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Owner Admin Login"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--canvas)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--surface-muted)' }}
            >
              <Lock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="font-display text-lg font-medium leading-tight">
                Owner Admin Login
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {cafeName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close login modal"
            className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg hover:opacity-80 cursor-pointer"
            style={{ backgroundColor: 'var(--surface-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isUnverifiedSignedIn ? (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                  <span>Verify Your Email Address</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Signed in as <strong>{currentUser?.email}</strong>. To protect database
                  writes, please verify your email address before opening the Admin
                  Dashboard.
                </p>
              </div>

              {infoMessage && (
                <p
                  className="text-xs font-medium rounded-xl px-3.5 py-2.5 border"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--accent)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {infoMessage}
                </p>
              )}

              {errorMessage && (
                <p
                  role="alert"
                  className="text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3.5 py-2.5"
                >
                  {errorMessage}
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSendVerification}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white rounded-xl cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Verification Email</span>
                </button>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleRefreshVerification}
                    className="flex-1 px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-xl border cursor-pointer disabled:opacity-60"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    I&apos;ve Verified — Continue
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSignOut}
                    className="px-4 py-2.5 min-h-[44px] text-xs font-medium rounded-xl border cursor-pointer"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : isUnauthorizedSignedIn ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#9B2C2C] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Access Denied — Unauthorized Account</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Signed in as <strong>{currentUser?.email || 'Guest'}</strong>. This
                  account does not have permission to edit photos, menu items, prices, or
                  website content.
                </p>
                <p className="text-xs leading-relaxed">
                  Only the verified website owner may sign in to manage website content.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSignOut}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-white rounded-xl cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out &amp; Switch Account</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-xl border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  Return to Site
                </button>
              </div>
            </div>
          ) : isOwner ? (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl border space-y-1.5"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Verified Owner Authenticated</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Signed in as <strong>{currentUser?.email}</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={onAuthenticated}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white rounded-xl cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <span>Open Admin Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-xl border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sign in with your verified owner account to manage photos, menu items,
                prices, and website details.
              </p>

              <form onSubmit={handleEmailPasswordLogin} className="space-y-3">
                <div>
                  <label
                    htmlFor="admin-email-input"
                    className="block text-xs font-semibold mb-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Email Address
                  </label>
                  <input
                    id="admin-email-input"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter owner email"
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border-color)',
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="admin-password-input"
                      className="block text-xs font-semibold"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handlePasswordReset}
                      className="text-xs font-medium hover:underline cursor-pointer disabled:opacity-60"
                      style={{ color: 'var(--accent)' }}
                    >
                      Set / Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="admin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-3.5 pr-11 py-2.5 min-h-[44px] text-sm rounded-xl border"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderColor: 'var(--border-color)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-75 hover:opacity-100 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {infoMessage && (
                  <p
                    className="text-xs font-medium rounded-xl px-3.5 py-2.5 border"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--accent)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {infoMessage}
                  </p>
                )}

                {errorMessage && (
                  <div
                    role="alert"
                    className="text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3.5 py-2.5 space-y-1.5 break-words"
                  >
                    <p>{errorMessage}</p>
                    {unauthorizedHost && (
                      <p className="font-normal leading-relaxed">
                        Add{' '}
                        <strong className="font-mono-tabular">{unauthorizedHost}</strong>{' '}
                        under{' '}
                        <a
                          href="https://console.firebase.google.com/project/lively-hall-484615-k4/authentication/settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-semibold"
                        >
                          Firebase Console → Authentication → Settings → Authorized domains
                        </a>
                        , then try again.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-95 cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Signing in...' : 'Sign In with Password'}</span>
                </button>
              </form>

              <div className="flex items-center gap-3" aria-hidden="true">
                <span
                  className="h-px flex-1"
                  style={{ backgroundColor: 'var(--border-color)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  or
                </span>
                <span
                  className="h-px flex-1"
                  style={{ backgroundColor: 'var(--border-color)' }}
                />
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleLogin}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium rounded-xl border transition-colors cursor-pointer disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <LogIn className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
