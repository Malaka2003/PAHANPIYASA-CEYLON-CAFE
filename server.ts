import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebaseClientConfig {
  projectId: string;
}

const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(
  fs.readFileSync(firebaseConfigPath, 'utf8')
) as FirebaseClientConfig;

const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
const OWNER_ADMIN_EMAIL = (
  process.env.OWNER_ADMIN_EMAIL || 'ellacloudscapecafe@gmail.com'
)
  .trim()
  .toLowerCase();

const OTP_SECRET =
  process.env.OTP_SESSION_SECRET?.trim() ||
  crypto.randomBytes(32).toString('hex');

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 30 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

interface OtpChallenge {
  codeHash: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
}

const activeChallenges = new Map<string, OtpChallenge>();

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  )
);

interface VerifiedOwner {
  uid: string;
  email: string;
}

async function verifyOwnerFromRequest(req: Request): Promise<VerifiedOwner> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Firebase authorization token.');
  }
  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    throw new Error('Empty Firebase authorization token.');
  }

  const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });

  const uid = typeof payload.sub === 'string' ? payload.sub : '';
  const email =
    typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const emailVerified = payload.email_verified === true;

  if (!uid || !emailVerified || email !== OWNER_ADMIN_EMAIL) {
    throw new Error('Unauthorized account.');
  }

  return { uid, email };
}

function getEmailProvider(): 'gmail' | 'smtp' | 'resend' | null {
  if (process.env.GMAIL_APP_PASSWORD?.trim()) {
    return 'gmail';
  }
  if (
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ) {
    return 'smtp';
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    return 'resend';
  }
  return null;
}

function hashOtpCode(uid: string, code: string): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${uid}:${code}`)
    .digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function createOtpSessionToken(uid: string): { token: string; expiresAt: number } {
  const now = Date.now();
  const expiresAt = now + OTP_SESSION_TTL_MS;
  const payloadB64 = Buffer.from(
    JSON.stringify({ uid, iat: now, exp: expiresAt })
  ).toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', OTP_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return {
    token: `${payloadB64}.${sigB64}`,
    expiresAt,
  };
}

function verifyOtpSessionToken(
  token: string,
  expectedUid: string
): { valid: boolean; expiresAt?: number } {
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return { valid: false };

  const expectedSigB64 = crypto
    .createHmac('sha256', OTP_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64, 'utf8');
  const expectedBuf = Buffer.from(expectedSigB64, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as { uid?: unknown; exp?: unknown };
    if (
      parsed.uid !== expectedUid ||
      typeof parsed.exp !== 'number' ||
      parsed.exp <= Date.now()
    ) {
      return { valid: false };
    }
    return { valid: true, expiresAt: parsed.exp };
  } catch {
    return { valid: false };
  }
}

async function sendOtpEmail(toEmail: string, code: string): Promise<void> {
  const provider = getEmailProvider();
  if (!provider) {
    throw new Error('OTP_NOT_CONFIGURED');
  }

  const subject = 'Admin Login Verification Code — Pahanpiyasa Ceylon Café';
  const textBody = [
    'Ayubowan,',
    '',
    `Your 6-digit Admin Dashboard verification code is: ${code}`,
    '',
    'This code expires in 5 minutes. If you did not request this login, please change your password immediately.',
    '',
    'Pahanpiyasa Ceylon Café · Demodara, Ella',
  ].join('\n');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FAF6EE; border: 1px solid #E5D7C1; border-radius: 14px; color: #24160D;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #7C5A3C; font-weight: 600;">Pahanpiyasa Ceylon Café · Owner Security</p>
      <h2 style="margin: 0 0 14px; font-size: 20px; font-weight: 600;">Admin Verification Code</h2>
      <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.5; color: #4A3525;">
        Enter this 6-digit verification code to unlock your Admin Dashboard:
      </p>
      <div style="background: #FFFFFF; border: 1px solid #D9C3A3; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 18px;">
        <span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #8A4B22;">${code}</span>
      </div>
      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6F5947;">
        This code expires in <strong>5 minutes</strong>. If you did not initiate this sign-in, secure your account immediately.
      </p>
    </div>
  `;

  if (provider === 'gmail') {
    const gmailUser = (process.env.GMAIL_USER || toEmail).trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, '');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    await transporter.sendMail({
      from: `"Pahanpiyasa Admin Security" <${gmailUser}>`,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });
    return;
  }

  if (provider === 'smtp') {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!.trim(),
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.trim(),
      },
    });
    await transporter.sendMail({
      from:
        process.env.OTP_EMAIL_FROM?.trim() ||
        `"Pahanpiyasa Admin Security" <${process.env.SMTP_USER!.trim()}>`,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });
    return;
  }

  // Resend API
  const fromAddress =
    process.env.OTP_EMAIL_FROM?.trim() || 'Pahanpiyasa Security <onboarding@resend.dev>';
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toEmail],
      subject,
      text: textBody,
      html: htmlBody,
    }),
  });

  if (!resendResponse.ok) {
    const detail = await resendResponse.text();
    throw new Error(`Email delivery failed (${resendResponse.status}): ${detail}`);
  }
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (origin === 'https://malaka2003.github.io') return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return true;
  }
  if (/^https:\/\/[a-z0-9.-]+\.run\.app$/i.test(origin)) {
    return true;
  }
  const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return extraOrigins.includes(origin);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/admin-otp/status', (_req: Request, res: Response) => {
    const provider = getEmailProvider();
    res.json({
      configured: provider !== null,
      provider,
    });
  });

  app.post('/api/admin-otp/request', async (req: Request, res: Response) => {
    let owner: VerifiedOwner;
    try {
      owner = await verifyOwnerFromRequest(req);
    } catch {
      res.status(403).json({
        errorCode: 'UNAUTHORIZED',
        error: 'Only the verified website owner may request a verification code.',
      });
      return;
    }

    if (!getEmailProvider()) {
      res.status(503).json({
        errorCode: 'OTP_NOT_CONFIGURED',
        error:
          'Email OTP delivery is not configured on the server yet. Add GMAIL_APP_PASSWORD (or RESEND_API_KEY) to your server environment variables.',
      });
      return;
    }

    const existing = activeChallenges.get(owner.uid);
    const now = Date.now();
    if (existing && now - existing.sentAt < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - existing.sentAt)) / 1000);
      res.status(429).json({
        errorCode: 'COOLDOWN',
        waitSeconds,
        error: `Please wait ${waitSeconds}s before requesting another verification code.`,
      });
      return;
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const challenge: OtpChallenge = {
      codeHash: hashOtpCode(owner.uid, code),
      expiresAt: now + OTP_TTL_MS,
      sentAt: now,
      attempts: 0,
    };

    try {
      await sendOtpEmail(owner.email, code);
      activeChallenges.set(owner.uid, challenge);
      res.json({
        ok: true,
        expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
        cooldownSeconds: Math.floor(OTP_COOLDOWN_MS / 1000),
      });
    } catch (err: unknown) {
      console.error('Failed to send admin OTP email:', err);
      res.status(502).json({
        errorCode: 'DELIVERY_FAILED',
        error: 'Could not send verification email. Check your server email credentials.',
      });
    }
  });

  app.post('/api/admin-otp/verify', async (req: Request, res: Response) => {
    let owner: VerifiedOwner;
    try {
      owner = await verifyOwnerFromRequest(req);
    } catch {
      res.status(403).json({
        errorCode: 'UNAUTHORIZED',
        error: 'Only the verified website owner may verify codes.',
      });
      return;
    }

    const rawCode = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!/^\d{6}$/.test(rawCode)) {
      res.status(400).json({
        errorCode: 'INVALID_FORMAT',
        error: 'Please enter a valid 6-digit numeric verification code.',
      });
      return;
    }

    const challenge = activeChallenges.get(owner.uid);
    if (!challenge) {
      res.status(400).json({
        errorCode: 'NO_ACTIVE_CODE',
        error: 'No active verification code found. Please request a new code.',
      });
      return;
    }

    if (Date.now() > challenge.expiresAt) {
      activeChallenges.delete(owner.uid);
      res.status(400).json({
        errorCode: 'CODE_EXPIRED',
        error: 'Verification code has expired. Please request a new code.',
      });
      return;
    }

    const submittedHash = hashOtpCode(owner.uid, rawCode);
    if (!safeEqualHex(submittedHash, challenge.codeHash)) {
      challenge.attempts += 1;
      if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
        activeChallenges.delete(owner.uid);
        res.status(400).json({
          errorCode: 'TOO_MANY_ATTEMPTS',
          error: 'Too many incorrect attempts. Please request a new verification code.',
        });
        return;
      }
      const remaining = OTP_MAX_ATTEMPTS - challenge.attempts;
      res.status(400).json({
        errorCode: 'WRONG_CODE',
        error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
      return;
    }

    activeChallenges.delete(owner.uid);
    const session = createOtpSessionToken(owner.uid);
    res.json({
      ok: true,
      otpSessionToken: session.token,
      expiresAt: session.expiresAt,
    });
  });

  app.post('/api/admin-otp/session', async (req: Request, res: Response) => {
    let owner: VerifiedOwner;
    try {
      owner = await verifyOwnerFromRequest(req);
    } catch {
      res.status(403).json({ valid: false });
      return;
    }

    const token =
      typeof req.body?.otpSessionToken === 'string'
        ? req.body.otpSessionToken.trim()
        : '';
    if (!token) {
      res.json({ valid: false });
      return;
    }

    const result = verifyOtpSessionToken(token, owner.uid);
    res.json(result);
  });

  if (process.env.OTP_SERVER_ONLY !== 'true') {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distDir = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distDir)) {
        app.use('/PAHANPIYASA-CEYLON-CAFE', express.static(distDir));
        app.use(express.static(distDir));
        app.get('/{*splat}', (_req: Request, res: Response) => {
          res.sendFile(path.join(distDir, 'index.html'));
        });
      }
    }
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
