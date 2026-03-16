

## Plan: WhatsApp Webhook + Full Working System

### Overview
Create the WhatsApp webhook edge function, add order/lead creation tools to the orchestrator, persist conversations, and seed sample data. The web app becomes admin/dashboard only — all customer interaction happens on WhatsApp.

---

### 1. Store WhatsApp Secrets
Store 3 secrets using the secrets tool:
- `WHATSAPP_ACCESS_TOKEN` = the token provided
- `WHATSAPP_PHONE_NUMBER_ID` = `1091673387353532`
- `WHATSAPP_VERIFY_TOKEN` = a custom string (e.g., `medsource_verify_2024`)

### 2. Create WhatsApp Webhook Edge Function
**New file: `supabase/functions/whatsapp-webhook/index.ts`**

- **GET handler**: Meta verification handshake — checks `hub.verify_token` matches secret, returns `hub.challenge`
- **POST handler**:
  1. Parse Meta webhook payload → extract phone number + message text
  2. Find or create conversation in DB by phone number
  3. Load message history from conversation record
  4. Call AI orchestrator logic (same intent classification + agent routing, but **non-streaming** since WhatsApp needs complete text)
  5. Send reply via Meta Cloud API: `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
  6. Save updated messages array back to conversations table
  7. Log analytics event

- Add to `supabase/config.toml`: `[functions.whatsapp-webhook]` with `verify_jwt = false`

### 3. Enhance Orchestrator with Order & Lead Tools
**Modify: `supabase/functions/orchestrator/index.ts`**

Add two new tools (available to order and qualifier agents):
- `create_order(customer_name, products, total_amount, delivery_address)` → inserts into `orders` table, returns order ID
- `create_lead(company_name, contact_person, phone, lead_score, country)` → inserts into `leads` table

Make order agent use tool-calling loop (same pattern as pricing agent) so it can actually save orders during conversation.

### 4. Seed Sample Data
**Database migration** to insert:
- 5 sample conversations (different agents/states)
- 3 orders (pending, confirmed, delivered)
- 3 leads (different scores)
- Analytics events

This makes the dashboard show real data immediately.

### 5. Demo Page Persistence
**Modify: `src/pages/DemoPage.tsx`** — save conversations to DB so demo messages appear in dashboard analytics.

---

### Files

| Action | File |
|--------|------|
| Create | `supabase/functions/whatsapp-webhook/index.ts` |
| Modify | `supabase/config.toml` |
| Modify | `supabase/functions/orchestrator/index.ts` |
| Modify | `src/pages/DemoPage.tsx` |
| Migration | Seed sample data |

### Result
WhatsApp message → webhook → AI orchestrator → reply sent back to WhatsApp. Orders and leads saved to DB. Dashboard shows real data. Web app = admin + analytics.

