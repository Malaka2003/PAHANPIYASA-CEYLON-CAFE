# Security Specification — PAHANPIYASA CEYLON CAFÉ

## 1. Data Invariants
1. **Single Verified Owner Authority**: Only the verified Google account `ellacloudscapecafe@gmail.com` (`request.auth.token.email_verified == true`) can create, update, or delete any document across `/siteSettings`, `/menuItems`, `/photoSections`, `/siteMedia`, or `/admins`.
2. **Public Visitor Read-Only Guarantee**: Regular visitors (unauthenticated or signed in with any other account) have read-only (`get`/`list`) access strictly to public storefront collections (`/siteSettings`, `/menuItems`, `/photoSections`, `/siteMedia`), and ZERO access to `/admins`.
3. **Strict Document Shape & No Ghost Fields**: Every write validates exact required + allowed keys via `hasAll` and `hasOnly` and explicit `.affectedKeys().hasOnly(...)` on updates.
4. **Server Timestamp & Author Integrity**: Every mutation requires `updatedBy == request.auth.uid` and `updatedAt == request.time`.
5. **Bounded Strings, Lists & Valid IDs**: Every document ID matches `^[a-zA-Z0-9_-]+$` (`<= 128` chars), every string has explicit `.size()` bounds, and arrays (`sectionOrder`, `hiddenSections`, `photos`) are strictly capped.

## 2. "Dirty Dozen" Adversarial Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Site Tamper**: Anonymous visitor writes `{ heroHeadline: "Hacked" }` to `/siteSettings/main`.
2. **Non-Owner Logged-In User**: Authenticated user `visitor@example.com` (`email_verified: true`) tries to update `/menuItems/roti-egg`.
3. **Unverified Admin Email Spoof**: User with `email: "ellacloudscapecafe@gmail.com"` and `email_verified: false` attempts to write `/siteSettings/main`.
4. **Privilege Escalation**: Non-owner user attempts to create `/admins/{uid}` with `{ role: "owner", email: "ellacloudscapecafe@gmail.com" }`.
5. **Shadow / Ghost Field Injection**: Admin writes `/siteSettings/main` including extra unknown key `backdoor: true`.
6. **ID Poisoning**: Admin attempts to write `/menuItems/../../etc/passwd` or a 300-char document ID.
7. **Timestamp Spoofing**: Admin writes `/menuItems/roti-egg` with client-forged `updatedAt` != `request.time`.
8. **Author UID Spoofing**: Admin writes `/photoSections/sec-1` with `updatedBy: "different-uid"`.
9. **Oversized String / Denial-of-Wallet**: Admin writes `/siteSettings/main` with a 50KB `heroHeadline` or 1MB `siteMedia.imageUrl`.
10. **Unbounded Array Injection**: Admin writes `/photoSections/sec-1` with 25 items in `photos` (exceeding max 20) or non-map array items.
11. **PII Leak Attempt on Private Admin Collection**: Visitor or non-owner queries or reads `/admins` or `/admins/{uid}`.
12. **Blanket Unprotected Path Write**: Any user attempts write to an undeclared collection `/secretNotes/doc1`.
