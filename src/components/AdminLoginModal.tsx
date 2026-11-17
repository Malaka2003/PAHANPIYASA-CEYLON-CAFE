import { useState } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { AlertTriangle, Lock, LogIn, LogOut, ShieldCheck, X } from 'lucide-react';
import {
  auth,
  googleProvider,
  isVerifiedOwnerAdmin,
} from '../firebase';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorizedHost, setUnauthorizedHost] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = isVerifiedOwnerAdmin(currentUser);
  const isUnauthorizedSignedIn = Boolean(currentUser && !isOwner);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
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

  const handleSignOut = async () => {
    setErrorMessage(null);
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
          {isUnauthorizedSignedIn ? (
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
                Sign in with your verified owner Google account to manage photos, menu
                items, prices, and website details.
              </p>

              {errorMessage && (
                <div
                  role="alert"
                  className="text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3.5 py-2.5 space-y-1.5 break-words"
                >
                  <p>{errorMessage}</p>
                  {unauthorizedHost && (
                    <p className="font-normal leading-relaxed">
                      Add <strong className="font-mono-tabular">{unauthorizedHost}</strong>{' '}
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
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleLogin}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 min-h-[46px] text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-95 cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Verifying with Google...' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
