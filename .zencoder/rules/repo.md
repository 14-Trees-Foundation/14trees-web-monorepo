# 14trees Web Monorepo Overview

## Structure
- **apps/**: Application-level projects. Notable entries include `api` (Node/Express backend), `front-page` (Next.js site), `frontend` (Vite-based project), and various automation scripts under `scripts`.
- **packages/**: Shared libraries such as UI components, schema definitions, Contentful helpers, ESLint config, and tsconfig presets.
- **.turbo/**: Turborepo cache and daemon artifacts, indicating the monorepo uses Turbo for task orchestration.

## Languages & Tooling
- **TypeScript & JavaScript** across apps and packages.
- **Express** powers the API with controllers in `apps/api/src`.
- **Next.js** and **Vite** serve front-end experiences.
- **Turborepo** coordinates builds and tests.

## Getting Started
1. Install dependencies with `npm install` or `yarn install` at the repository root.
2. Copy environment templates (`.env.template`) where provided and fill required values.
3. Use project-specific README files (e.g., `apps/api/README.md`, `apps/front-page/README.md`) for setup, build, and deployment guidance.

## Testing & Scripts
- Refer to each app/package README for its test commands (examples include `npm run test` or `npm run lint`).
- Shared scripts live under `apps/scripts`; review individual script directories for usage details.

## Additional Notes
- Credentials for integrations (e.g., Google, Gmail) live under `credentials/` and require secure handling.
- Turborepo tasks are configured in `turbo.json`; adjust or extend when adding new pipelines.
- Prefer adding shared utilities in `packages/` or dedicated helper modules to keep controllers/services lean.