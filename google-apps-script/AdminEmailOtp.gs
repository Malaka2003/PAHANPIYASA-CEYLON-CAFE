/**
 * Pahanpiyasa Ceylon Café — Zero-Cost, No-Card Email OTP Backend
 * Deploy inside Google Apps Script (https://script.google.com) using your owner Gmail account.
 *
 * Deploy settings:
 *   - Execute as: Me
 *   - Who has access: Anyone
 */

var FIREBASE_API_KEY = 'AIzaSyAn3hwCGtC2tjx96vxhGRL4cew_k7VHD3I';

function getOwnerEmail_() {
  return String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
}

var OTP_TTL_MS = 5 * 60 * 1000;
var OTP_COOLDOWN_MS = 30 * 1000;
var OTP_MAX_ATTEMPTS = 5;
var OTP_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function doGet() {
  return jsonOut_({
    ok: true,
    service: 'Pahanpiyasa Admin Email OTP',
  });
}

function doPost(e) {
  try {
    var bodyText = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var body = JSON.parse(bodyText);
    var action = typeof body.action === 'string' ? body.action : '';
    var idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';

    if (!idToken) {
      return jsonOut_({
        ok: false,
        errorCode: 'UNAUTHORIZED',
        error: 'Missing Firebase authorization token.',
      });
    }

    var owner = verifyFirebaseOwner_(idToken);
    if (!owner) {
      return jsonOut_({
        ok: false,
        errorCode: 'UNAUTHORIZED',
        error: 'Only the verified website owner may access verification codes.',
      });
    }

    if (action === 'request') {
      return jsonOut_(handleRequestOtp_(owner));
    }
    if (action === 'verify') {
      var code = typeof body.code === 'string' ? body.code.trim() : '';
      return jsonOut_(handleVerifyOtp_(owner, code));
    }
    if (action === 'session') {
      var token = typeof body.otpSessionToken === 'string' ? body.otpSessionToken.trim() : '';
      return jsonOut_(handleSessionCheck_(owner, token));
    }

    return jsonOut_({
      ok: false,
      errorCode: 'UNKNOWN_ACTION',
      error: 'Unsupported OTP action.',
    });
  } catch (err) {
    return jsonOut_({
      ok: false,
      errorCode: 'SERVER_ERROR',
      error: 'OTP service error: ' + (err && err.message ? err.message : String(err)),
    });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getOrCreateSecret_() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('OTP_HMAC_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + '-' + Utilities.getUuid();
    props.setProperty('OTP_HMAC_SECRET', secret);
  }
  return secret;
}

function verifyFirebaseOwner_(idToken) {
  var url =
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' +
    encodeURIComponent(FIREBASE_API_KEY);
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ idToken: idToken }),
    muteHttpExceptions: true,
  });

  if (res.getResponseCode() !== 200) {
    return null;
  }

  var data = JSON.parse(res.getContentText() || '{}');
  var users = data.users || [];
  if (!users.length) {
    return null;
  }

  var user = users[0];
  var email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  var verified = user.emailVerified === true;
  var uid = typeof user.localId === 'string' ? user.localId : '';

  var ownerEmail = getOwnerEmail_();
  if (!uid || !verified || !ownerEmail || email !== ownerEmail) {
    return null;
  }

  return { uid: uid, email: email };
}

function bytesToHex_(bytes) {
  var out = [];
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i];
    if (b < 0) b += 256;
    var hex = b.toString(16);
    if (hex.length < 2) hex = '0' + hex;
    out.push(hex);
  }
  return out.join('');
}

function hmacHex_(value, secret) {
  var bytes = Utilities.computeHmacSha256Signature(value, secret);
  return bytesToHex_(bytes);
}

function constantTimeEqual_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function generateSixDigitCode_(secret) {
  var entropy = Utilities.getUuid() + ':' + Date.now() + ':' + Math.random();
  var digest = Utilities.computeHmacSha256Signature(entropy, secret);
  var b0 = digest[0] < 0 ? digest[0] + 256 : digest[0];
  var b1 = digest[1] < 0 ? digest[1] + 256 : digest[1];
  var b2 = digest[2] < 0 ? digest[2] + 256 : digest[2];
  var b3 = digest[3] < 0 ? digest[3] + 256 : digest[3];
  var num = ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
  var code = 100000 + (num % 900000);
  return String(code);
}

function handleRequestOtp_(owner) {
  var props = PropertiesService.getScriptProperties();
  var key = 'OTP_CHALLENGE_' + owner.uid;
  var rawExisting = props.getProperty(key);
  var now = Date.now();

  if (rawExisting) {
    try {
      var existing = JSON.parse(rawExisting);
      if (existing && typeof existing.sentAt === 'number' && now - existing.sentAt < OTP_COOLDOWN_MS) {
        var waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - existing.sentAt)) / 1000);
        return {
          ok: false,
          errorCode: 'COOLDOWN',
          waitSeconds: waitSeconds,
          error: 'Please wait ' + waitSeconds + 's before requesting another verification code.',
        };
      }
    } catch (e) {
      // Ignore malformed stored challenge
    }
  }

  var secret = getOrCreateSecret_();
  var code = generateSixDigitCode_(secret);
  var codeHash = hmacHex_(owner.uid + ':' + code, secret);

  var subject = 'Admin Login Verification Code — Pahanpiyasa Ceylon Café';
  var textBody = [
    'Ayubowan,',
    '',
    'Your 6-digit Admin Dashboard verification code is: ' + code,
    '',
    'This code expires in 5 minutes. If you did not request this login, please change your password immediately.',
    '',
    'Pahanpiyasa Ceylon Café · Demodara, Ella',
  ].join('\n');

  var htmlBody =
    '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#FAF6EE;border:1px solid #E5D7C1;border-radius:14px;color:#24160D;">' +
    '<p style="margin:0 0 8px;font-size:13px;color:#7C5A3C;font-weight:600;">Pahanpiyasa Ceylon Café · Owner Security</p>' +
    '<h2 style="margin:0 0 14px;font-size:20px;font-weight:600;">Admin Verification Code</h2>' +
    '<p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:#4A3525;">Enter this 6-digit verification code to unlock your Admin Dashboard:</p>' +
    '<div style="background:#FFFFFF;border:1px solid #D9C3A3;border-radius:10px;padding:16px;text-align:center;margin-bottom:18px;">' +
    '<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#8A4B22;">' +
    code +
    '</span></div>' +
    '<p style="margin:0;font-size:12px;line-height:1.5;color:#6F5947;">This code expires in <strong>5 minutes</strong>. If you did not initiate this sign-in, secure your account immediately.</p>' +
    '</div>';

  MailApp.sendEmail({
    to: owner.email,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody,
  });

  props.setProperty(
    key,
    JSON.stringify({
      codeHash: codeHash,
      expiresAt: now + OTP_TTL_MS,
      sentAt: now,
      attempts: 0,
    })
  );

  return {
    ok: true,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    cooldownSeconds: Math.floor(OTP_COOLDOWN_MS / 1000),
  };
}

function handleVerifyOtp_(owner, rawCode) {
  if (!/^\d{6}$/.test(rawCode)) {
    return {
      ok: false,
      errorCode: 'INVALID_FORMAT',
      error: 'Please enter a valid 6-digit numeric verification code.',
    };
  }

  var props = PropertiesService.getScriptProperties();
  var key = 'OTP_CHALLENGE_' + owner.uid;
  var raw = props.getProperty(key);
  if (!raw) {
    return {
      ok: false,
      errorCode: 'NO_ACTIVE_CODE',
      error: 'No active verification code found. Please request a new code.',
    };
  }

  var challenge = JSON.parse(raw);
  var now = Date.now();
  if (!challenge || now > challenge.expiresAt) {
    props.deleteProperty(key);
    return {
      ok: false,
      errorCode: 'CODE_EXPIRED',
      error: 'Verification code has expired. Please request a new code.',
    };
  }

  var secret = getOrCreateSecret_();
  var submittedHash = hmacHex_(owner.uid + ':' + rawCode, secret);
  if (!constantTimeEqual_(submittedHash, challenge.codeHash)) {
    challenge.attempts = (challenge.attempts || 0) + 1;
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      props.deleteProperty(key);
      return {
        ok: false,
        errorCode: 'TOO_MANY_ATTEMPTS',
        error: 'Too many incorrect attempts. Please request a new verification code.',
      };
    }
    props.setProperty(key, JSON.stringify(challenge));
    var remaining = OTP_MAX_ATTEMPTS - challenge.attempts;
    return {
      ok: false,
      errorCode: 'WRONG_CODE',
      error:
        'Incorrect verification code. ' +
        remaining +
        ' attempt' +
        (remaining === 1 ? '' : 's') +
        ' remaining.',
    };
  }

  props.deleteProperty(key);

  var expiresAt = now + OTP_SESSION_TTL_MS;
  var payloadB64 = Utilities.base64EncodeWebSafe(
    JSON.stringify({ uid: owner.uid, iat: now, exp: expiresAt })
  ).replace(/=+$/, '');
  var sigBytes = Utilities.computeHmacSha256Signature(payloadB64, secret);
  var sigB64 = Utilities.base64EncodeWebSafe(sigBytes).replace(/=+$/, '');

  return {
    ok: true,
    otpSessionToken: payloadB64 + '.' + sigB64,
    expiresAt: expiresAt,
  };
}

function handleSessionCheck_(owner, token) {
  if (!token) {
    return { valid: false };
  }
  var parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }
  var payloadB64 = parts[0];
  var sigB64 = parts[1];
  if (!payloadB64 || !sigB64) {
    return { valid: false };
  }

  var secret = getOrCreateSecret_();
  var expectedSigBytes = Utilities.computeHmacSha256Signature(payloadB64, secret);
  var expectedSigB64 = Utilities.base64EncodeWebSafe(expectedSigBytes).replace(/=+$/, '');
  if (!constantTimeEqual_(sigB64, expectedSigB64)) {
    return { valid: false };
  }

  try {
    var padded = payloadB64 + '==='.slice((payloadB64.length + 3) % 4);
    var jsonStr = Utilities.newBlob(Utilities.base64DecodeWebSafe(padded)).getDataAsString('utf-8');
    var parsed = JSON.parse(jsonStr);
    if (!parsed || parsed.uid !== owner.uid || typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) {
      return { valid: false };
    }
    return { valid: true, expiresAt: parsed.exp };
  } catch (e) {
    return { valid: false };
  }
}
