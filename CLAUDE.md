# TenderMe 2.0 — Enterprise AI Tender Platform

## Architecture Overview

TenderMe is a production-grade AI-powered tender/procurement platform built for the Dutch/EU market, specializing in EMVI (Economisch Meest Voordelige Inschrijving) and BPKV (Beste Prijs-Kwaliteitverhouding) responses.

### Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Radix UI + class-variance-authority
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **AI**: Anthropic Claude + OpenAI GPT-4o (dual provider)
- **Payments**: Stripe (subscriptions + webhooks)
- **Document Processing**: pdf-parse, mammoth, adm-zip, tesseract.js
- **Export**: docx (Word), pdfkit (PDF)
- **State**: Zustand
- **Animations**: Framer Motion

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login, Register pages
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── tenders/       # Tender list + detail views
│   │   ├── settings/      # User/org settings
│   │   └── team/          # Team management
│   ├── (marketing)/       # Landing page
│   └── api/               # API routes
│       ├── auth/          # NextAuth + register
│       ├── tenders/       # CRUD + analyze + generate + export
│       ├── upload/        # File upload
│       └── webhooks/      # Stripe webhooks
├── components/
│   ├── ui/                # Shadcn-style base components
│   ├── dashboard/         # Dashboard shell components
│   ├── tender/            # Tender-specific components
│   ├── scoring/           # Score meter, risk heatmap
│   ├── editor/            # Response editor
│   ├── export/            # Export preview
│   └── shared/            # Shared components
├── lib/
│   ├── ai/                # AI pipeline (5 layers)
│   │   ├── provider.ts    # OpenAI + Anthropic client
│   │   ├── prompts.ts     # Dutch procurement prompts
│   │   └── pipeline.ts    # Full 5-layer orchestrator
│   ├── ingestion/         # Document parsing (PDF, DOCX, ZIP, OCR)
│   ├── scoring/           # Score calculation engine
│   ├── export/            # Word + PDF document generation
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Prisma client
│   └── utils.ts           # Utility functions
├── hooks/                 # React hooks + Zustand stores
├── types/                 # TypeScript type definitions
└── styles/                # Global CSS + design tokens
```

### AI Pipeline (5-Layer System)

1. **Context Builder** — Extracts scope, objectives, constraints, risks, timeline
2. **Criteria Intelligence Engine** — Detects scoring model, evaluator priorities, score multipliers
3. **Score-Optimized Generation** — Generates structured responses: Understanding → Solution → Evidence → Risk Mitigation → Measurable Impact
4. **Self-Scoring Engine** — Scores each response 1-10 with justification, iterates up to 2x
5. **EMVI Compliance Filter** — Removes marketing language, enforces professional procurement tone

### Database Schema
- Users, Organizations, API Keys (multi-tenant)
- Tenders, Documents, Criteria (with subcriteria)
- TenderResponses, CriterionResponses (with structured sections)
- TenderContext (AI analysis cache)
- TenderVersions (version control)
- AuditLogs, AIUsageLogs (enterprise tracking)

### Design System
- 8px grid spacing
- HSL CSS variables (light + dark mode)
- Score colors: emerald (9+), blue (7+), amber (5+), red (<5)
- Lucide icons
- Font: Inter

### Commands
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run db:generate` — Generate Prisma client
- `npm run db:push` — Push schema to database
- `npm run db:migrate` — Run migrations

### Environment Variables
See `.env.example` for all required variables.

### Key Design Decisions
- All AI prompts are in Dutch for Dutch procurement market
- Multi-provider AI support (Anthropic primary, OpenAI fallback)
- Server-side document processing only (security)
- Audit trail for all operations (GDPR compliance)
- AI disclaimer on all generated content (legal compliance)
