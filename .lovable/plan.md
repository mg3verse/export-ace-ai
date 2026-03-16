

## Plan: Full Admin Panel + Production Polish

This is a large scope request combining two major workstreams: (1) a comprehensive 6-tab admin panel, and (2) production-readiness polish across the entire app. Here's the implementation plan.

---

### Database Changes

**New table: `app_settings`** — stores key-value configuration (pricing rules, agent settings, integration status, etc.) so admin changes persist.

```sql
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: public read/write for POC (no auth required)
```

**Add RLS policies** for public read/insert/update on `app_settings`.

**Add UPDATE + DELETE policies on `products` table** (currently read-only — admin needs to edit/delete products).

**Add INSERT policy on `products` table** (admin needs to add products).

**Add UPDATE + DELETE policies on `leads` table** (admin needs to manage leads).

---

### Admin Panel (`src/pages/AdminPage.tsx`) — Complete Rewrite

**Tab 1: Products Management**
- Fetch products from database via `supabase.from('products')`
- Search/filter by name or SKU
- Add Product dialog (form with sku, name, category, price, stock, description, specifications)
- Edit Product dialog (pre-filled form)
- Delete with confirmation modal (AlertDialog)
- CSV bulk upload button (parse CSV, insert rows)
- Toast notifications on success/error

**Tab 2: FAQ Knowledge Base**
- Display all FAQs from `FAQ_KNOWLEDGE` (currently hardcoded — keep client-side for POC, with note about DB migration)
- Add/Edit FAQ form with category dropdown, question input, answer textarea, keywords
- Delete with confirmation
- Filter by category

**Tab 3: Pricing Rules**
- Display current `PRICING_TIERS` and `CURRENCY_RATES` from pricingUtils
- Editable form for discount tiers (min qty, max qty, discount %)
- Country-specific pricing multiplier editor
- Save to `app_settings` table

**Tab 4: Agent Settings**
- AI Model selector (dropdown with supported models)
- Temperature slider (0-1)
- Max tokens input
- Agent enable/disable toggles (checkboxes for each agent)
- Lead scoring thresholds (Hot/Warm/Cold point inputs)
- Save to `app_settings` table

**Tab 5: Integrations**
- WhatsApp Business API status card (UI-only, "Not Connected")
- CRM Integration card (HubSpot/Salesforce dropdown, "Not Connected")
- AI API status card (shows "Connected" with usage info)
- Connect buttons (show toast "Coming soon" for POC)

**Tab 6: Team & Access**
- Static team member table (Mr. Rohit as Admin, Sales 1 as Manager)
- Add Team Member button (UI-only for POC)
- Role and access level display

---

### New Supporting Components

- `src/components/admin/ProductFormDialog.tsx` — Add/Edit product dialog with form validation
- `src/components/admin/DeleteConfirmDialog.tsx` — Reusable confirmation dialog
- `src/components/admin/FAQManager.tsx` — FAQ CRUD component
- `src/components/admin/PricingRulesEditor.tsx` — Pricing tier editor
- `src/components/admin/AgentSettingsPanel.tsx` — Agent configuration panel
- `src/components/admin/IntegrationsPanel.tsx` — Integration status cards
- `src/components/admin/TeamPanel.tsx` — Team management display

---

### Production Polish

**Loading & Error States**
- Add `ErrorBoundary` component wrapping routes in `App.tsx`
- Skeleton screens already exist on Dashboard — add to Admin tabs during data fetch

**Code Splitting**
- Lazy load `DashboardPage`, `AdminPage`, `AgentsPage`, `DemoPage` with `React.lazy` + `Suspense` in `App.tsx`

**Animations**
- Add `framer-motion` fade transitions on page mount (wrap page components)
- Message bubble entrance animations (already partially done)

**Responsive Design**
- Admin tabs: use `ScrollArea` for horizontal tab scrolling on mobile
- Product table: responsive with horizontal scroll on small screens
- Forms: stack fields vertically on mobile

**SEO & Meta**
- Use `react-helmet-async` (or document.title) for page titles
- Add meta descriptions per page

**README Update**
- Rewrite `README.md` with proper project description, setup instructions, tech stack, and scaling notes as specified

**Security**
- Input validation with length limits on all admin forms
- Sanitize inputs before database writes
- API keys already proxied through edge functions

**Database Indexes**
- Add index on `products.sku` (already unique)
- Add index on `orders.status` and `conversations.conversation_state` for dashboard query performance

---

### Technical Details

- All admin CRUD operations use `supabase` client directly with proper error handling and toast feedback
- Product form uses controlled inputs with client-side validation (required fields, numeric ranges)
- Delete operations use `AlertDialog` with explicit confirmation
- Settings saved as JSON in `app_settings` table keyed by setting name (e.g., `pricing_tiers`, `agent_config`)
- Lazy loading uses `React.lazy(() => import('./pages/...'))` with a shared `Suspense` fallback showing a centered spinner
- Tab state preserved via URL search params or component state

---

### Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/components/admin/ProductFormDialog.tsx` |
| Create | `src/components/admin/DeleteConfirmDialog.tsx` |
| Create | `src/components/admin/FAQManager.tsx` |
| Create | `src/components/admin/PricingRulesEditor.tsx` |
| Create | `src/components/admin/AgentSettingsPanel.tsx` |
| Create | `src/components/admin/IntegrationsPanel.tsx` |
| Create | `src/components/admin/TeamPanel.tsx` |
| Create | `src/components/ErrorBoundary.tsx` |
| Rewrite | `src/pages/AdminPage.tsx` |
| Modify | `src/App.tsx` (lazy loading, error boundary) |
| Modify | `README.md` |
| Migration | Add `app_settings` table, update RLS on `products`/`leads` |

