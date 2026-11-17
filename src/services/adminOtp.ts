import { User } from 'firebase/auth';

const OTP_SESSION_STORAGE_KEY = 'pahanpiyasa_admin_otp_session_v1';

const RAW_OTP_API_BASE = (
  (import.meta.env.VITE_OTP_API_URL as string | undefined) || ''
)
  .trim()
  .replace(/\/$/, '');

const IS_APPS_SCRIPT_BACKEND = RAW_OTP_API_BASE.includes('script.google.com');

function buildOtpEndpoint(path: string): string {
  return `${RAW_OTP_API_BASE}${path}`;
}

export class OtpServiceError extends Error {
  readonly code: string;
  readonly waitSeconds?: number;

  constructor(message: string, code: string, waitSeconds?: number) {
    super(message);
    this.name = 'OtpServiceError';
    this.code = code;
    this.waitSeconds = waitSeconds;
  }
}

export function getStoredOtpSessionToken(): string | null {
  try {
    return sessionStorage.getItem(OTP_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveOtpSessionToken(token: string): void {
  try {
    sessionStorage.setItem(OTP_SESSION_STORAGE_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

export function clearOtpSessionToken(): void {
  try {
    sessionStorage.removeItem(OTP_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

async function parseJsonSafe(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function callAppsScript(
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(RAW_OTP_API_BASE, {
      method: 'POST',
      headers: {
        // text/plain avoids CORS preflight OPTIONS requests on Google Apps Script
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OtpServiceError(
      'Unable to reach the Google Apps Script OTP endpoint. Check your internet connection and Web App permissions ("Anyone").',
      'NETWORK_ERROR'
    );
  }

  const data = await parseJsonSafe(res);
  if (!data) {
    throw new OtpServiceError(
      'Invalid response from Google Apps Script. Make sure it is deployed as a Web App with "Who has access: Anyone".',
      'NO_BACKEND'
    );
  }

  if (!res.ok || data.ok === false) {
    throw new OtpServiceError(
      typeof data.error === 'string'
        ? data.error
        : 'Verification service request failed.',
      typeof data.errorCode === 'string' ? data.errorCode : 'REQUEST_FAILED',
      typeof data.waitSeconds === 'number' ? data.waitSeconds : undefined
    );
  }

  return data;
}

export async function requestAdminEmailOtp(user: User): Promise<{
  expiresInSeconds: number;
  cooldownSeconds: number;
}> {
  const idToken = await user.getIdToken();

  if (IS_APPS_SCRIPT_BACKEND) {
    const data = await callAppsScript({ action: 'request', idToken });
    return {
      expiresInSeconds:
        typeof data.expiresInSeconds === 'number' ? data.expiresInSeconds : 300,
      cooldownSeconds:
        typeof data.cooldownSeconds === 'number' ? data.cooldownSeconds : 30,
    };
  }

  let res: Response;
  try {
    res = await fetch(buildOtpEndpoint('/api/admin-otp/request'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({}),
    });
  } catch {
    throw new OtpServiceError(
      'Unable to reach the OTP verification server. Check your internet connection or VITE_OTP_API_URL configuration.',
      'NETWORK_ERROR'
    );
  }

  const data = await parseJsonSafe(res);
  if (!data) {
    throw new OtpServiceError(
      'No OTP verification backend is connected to this host yet. Configure VITE_OTP_API_URL with your Google Apps Script Web App URL.',
      'NO_BACKEND'
    );
  }

  if (!res.ok || data.ok === false) {
    throw new OtpServiceError(
      typeof data.error === 'string'
        ? data.error
        : 'Could not send verification code.',
      typeof data.errorCode === 'string' ? data.errorCode : 'REQUEST_FAILED',
      typeof data.waitSeconds === 'number' ? data.waitSeconds : undefined
    );
  }

  return {
    expiresInSeconds:
      typeof data.expiresInSeconds === 'number' ? data.expiresInSeconds : 300,
    cooldownSeconds:
      typeof data.cooldownSeconds === 'number' ? data.cooldownSeconds : 30,
  };
}

export async function verifyAdminEmailOtp(
  user: User,
  code: string
): Promise<{ otpSessionToken: string; expiresAt: number }> {
  const idToken = await user.getIdToken();

  if (IS_APPS_SCRIPT_BACKEND) {
    const data = await callAppsScript({
      action: 'verify',
      idToken,
      code: code.trim(),
    });
    if (typeof data.otpSessionToken !== 'string') {
      throw new OtpServiceError(
        'Verification failed. Please try again.',
        'VERIFY_FAILED'
      );
    }
    saveOtpSessionToken(data.otpSessionToken);
    return {
      otpSessionToken: data.otpSessionToken,
      expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : Date.now(),
    };
  }

  let res: Response;
  try {
    res = await fetch(buildOtpEndpoint('/api/admin-otp/verify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ code: code.trim() }),
    });
  } catch {
    throw new OtpServiceError(
      'Unable to reach the OTP verification server.',
      'NETWORK_ERROR'
    );
  }

  const data = await parseJsonSafe(res);
  if (!data) {
    throw new OtpServiceError(
      'OTP verification backend is not connected on this host.',
      'NO_BACKEND'
    );
  }

  if (!res.ok || data.ok === false || typeof data.otpSessionToken !== 'string') {
    throw new OtpServiceError(
      typeof data.error === 'string'
        ? data.error
        : 'Verification failed. Please try again.',
      typeof data.errorCode === 'string' ? data.errorCode : 'VERIFY_FAILED'
    );
  }

  saveOtpSessionToken(data.otpSessionToken);
  return {
    otpSessionToken: data.otpSessionToken,
    expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : Date.now(),
  };
}

export async function checkAdminOtpSession(
  user: User,
  otpSessionToken: string
): Promise<boolean> {
  try {
    const idToken = await user.getIdToken();

    if (IS_APPS_SCRIPT_BACKEND) {
      const res = await fetch(RAW_OTP_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'session',
          idToken,
          otpSessionToken,
        }),
      });
      const data = await parseJsonSafe(res);
      return Boolean(res.ok && data?.valid === true);
    }

    const res = await fetch(buildOtpEndpoint('/api/admin-otp/session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ otpSessionToken }),
    });
    const data = await parseJsonSafe(res);
    return Boolean(res.ok && data?.valid === true);
  } catch {
    return false;
  }
}
