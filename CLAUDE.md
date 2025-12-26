# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

14Trees is an environmental impact NGO platform focused on restoring degraded ecosystems while providing employment opportunities for villagers and tribal communities. The platform manages tree sponsorships, corporate partnerships, gift cards, donations, and event tracking.

Although the repository has a Turborepo monorepo structure, only two applications are actively used and they are completely independent of each other with no shared dependencies. The top-level package.json and other folders can be ignored. Each app is deployed separately with its own dependencies.

## Active Applications

### Backend API (apps/api/)
Express.js backend with PostgreSQL (Sequelize ORM). Handles trees, donations, gift cards, events, user management, and payment processing (Razorpay).

**Commands (run from apps/api/):**
```bash
npm install                     # Install dependencies
npm run dev                     # Start development server (port 8088)
npm run build                   # Build for production
npm run start                   # Start production server
npm run swagger-autogen         # Generate Swagger documentation
npm run migrate                 # Run database migrations
npm run migrate:status          # Check migration status
npm test                        # Run Jest tests
npm run test:api                # Run API integration tests
```

**Structure:**
- Controllers, models, and routes follow a pattern: e.g., `treeController.ts`, `tree.ts` (model), `treeRoutes.ts`
- Swagger docs available at `/api-docs`
- Integrates with AWS S3, SendGrid, LangChain for AI features

### Frontend (apps/frontend/)
React 17 SPA built with Vite. Main admin dashboard for managing trees, donations, CSR (Corporate Social Responsibility), and events.

**Commands (run from apps/frontend/):**
```bash
npm install                     # Install dependencies
npm run dev                     # Start Vite dev server
npm run build                   # Build for production
npm run lint                    # Run ESLint
npm run prettier                # Format code with Prettier
```

**Structure:**
- Uses Material-UI (MUI) and Ant Design
- Redux for state management (actions/reducers pattern in `src/redux/`)
- API client in `src/api/apiClient/`
- Copy `.env.example` to `.env` and configure:
  - `VITE_APP_BASE_URL=http://localhost:8088/api`
  - `VITE_BYPASS_AUTH=true` for local development

## Key Technical Details

### Database
- PostgreSQL via Sequelize ORM
- ~59 models including: trees, users, groups, donations, gift_cards, events, plots, sites
- Migrations run via `npm run migrate` in the API app

### API Environment Variables
Key variables (set in `.env` file in apps/api/):
- `POSTGRES_PD` - PostgreSQL database connection
- `SERVER_PORT` - API server port (default 8088)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` - Payment processing
- AWS S3 credentials for file storage
- SendGrid credentials for email

## Domain Concepts

- **Trees** - Individual trees that can be sponsored, gifted, or tracked
- **Groups** - Corporate organizations managing tree sponsorships
- **Gift Cards** - Tree gift certificates that can be redeemed
- **Donations** - Financial contributions for tree planting
- **CSR (Corporate Social Responsibility)** - Corporate dashboard for managing environmental impact
- **Events** - Tree planting events and activities
- **Plots/Sites** - Physical locations where trees are planted

## Coding Guidelines
Follow requirements exactly; if unclear, state assumptions.

- Think step-by-step first; outline the plan briefly, then write code.
- Prefer clarity and correctness over cleverness or premature optimization.
- Write fully working, complete code — no TODOs or placeholders.
- Use TypeScript strictly; avoid any; infer types where possible.
- Frontend: React/Next.js, Tailwind only for styling, accessible UI, clean components.
- Backend: Express APIs, Postgres + Sequelize, Zod validation, thin controllers, rich services.
- Follow REST conventions, versioned APIs, proper error handling, and logging.
- Keep Swagger/OpenAPI specs accurate and updated for API changes.
- Use clear naming, DRY principles, and SOLID design.
- Be concise in explanations; do not guess—say when unsure.
- Code should be readable, maintainable, and production-grade.