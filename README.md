# WhatsApp Sales Agent POC

AI-powered WhatsApp sales assistant for pharmaceutical exports, built as a production-ready proof of concept.

## Features

- **4 AI Specialist Agents** — Pricing, FAQ, Order Collection, Buyer Qualification
- **Smart Orchestrator** — Routes conversations to the right agent automatically
- **Real-time Dashboard** — KPIs, charts, live feed with auto-refresh
- **Admin Configuration** — Products, FAQs, pricing rules, agent settings
- **WhatsApp-Style Chat** — Pixel-perfect demo with context pills and progress tracking
- **Production Architecture** — Error boundaries, code splitting, lazy loading

## Tech Stack

- React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Database, Edge Functions)
- Lovable AI Gateway (Gemini 3 Flash)
- Recharts (Data visualization)
- Zustand (State management)
- Framer Motion (Animations)

## Setup

1. Clone the repository
2. `npm install`
3. Configure your Lovable Cloud backend
4. `npm run dev`

## Project Structure

```
src/
├── components/
│   ├── admin/       # Admin panel tabs
│   ├── agents/      # AI agent displays
│   ├── chat/        # WhatsApp chat UI
│   ├── dashboard/   # Analytics components
│   └── ui/          # shadcn/ui components
├── services/
│   ├── ai/          # Orchestrator, prompts, pricing
│   └── api.ts       # Database API layer
├── stores/          # Zustand state stores
├── types/           # TypeScript interfaces
└── pages/           # Route pages
```

## Deployment

Ready for Vercel/Netlify deployment. Can integrate with real WhatsApp Business API.

## Scaling to Production

- Add authentication with role-based access
- Connect WhatsApp Business API for real messaging
- Add Redis caching for high-volume scenarios
- Integrate monitoring (Sentry, DataDog)
- Replace POC RLS policies with auth-gated ones
