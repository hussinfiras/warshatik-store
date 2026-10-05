# warshaTik guest purchase recovery

The Worker now supports permanent purchase entitlement with temporary download links.

## Required Cloudflare variables

Add these to the `warshatik-store2` Worker under Settings -> Variables and secrets:

- `RESEND_API_KEY` — Secret
- `EMAIL_FROM` — Variable, e.g. `WarshaTik <downloads@your-domain.com>` after the sending domain is verified in Resend

Existing required secret:

- `ADMIN_KEY`

Existing bindings:

- `DB` -> D1
- `MEDIA` -> R2 bucket `warshatik-media`

## Flow

1. `/api/orders/create` creates a pending guest order from email + product IDs.
2. Payment integration will confirm the order.
3. `/api/orders/mark-paid` is currently admin-only and is used for testing until Wayl webhook verification is connected.
4. When an order becomes paid, the Worker emails temporary download links.
5. Purchase entitlement remains permanent in D1.
6. `/recover.html` lets the buyer enter the same email, receive a 6-digit verification code, and generate fresh download links.
7. Download tokens expire after 1 hour; the paid purchase itself does not expire.

## Security

Product ZIP/PDF/code files remain private in R2. Public customers never receive the raw R2 key. The Worker checks a paid order before streaming the file.