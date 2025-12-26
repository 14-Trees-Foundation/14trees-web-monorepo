# Landing Image Mobile (landing_image_mobile_s3_path) Implementation Plan

Goal

Add a new field `landing_image_mobile_s3_path` to the `events` domain so the system can store a separate image path optimized for mobile. This will be persisted in the DB, available in the API, stored/served by the backend, and exposed/captured in the frontend UI.

Summary of changes (high level)

- Database: Add a migration to add `landing_image_mobile_s3_path` (TEXT, nullable) to `events` table.
- Backend model: Add the attribute to `apps/api/src/models/events.ts` (EventAttributes + Sequelize column).
- Backend repo/controller: Accept the field on create/update requests, persist it, and include it in responses.
- Tests: Add/adjust unit and integration tests for API endpoints to include the new field.
- Frontend: Add UI element(s) to capture/upload mobile landing image path and include it in API payloads; display it where landing images are used.
- Docs: Update any relevant docs and rollout notes.

Contract (2–4 bullets)

- Inputs: The primary flow is that the frontend will send the image file to the backend (typically via multipart/form-data or a file upload endpoint). The backend will upload the file to S3, receive the S3 path/URL, and persist that value as `landing_image_mobile_s3_path` on the event. Optionally, callers may send an S3 path directly (string) if an alternate upload flow is used, but the canonical flow is FE -> BE upload -> BE stores S3 path.
- Outputs: Event read endpoints will return `landing_image_mobile_s3_path` as a string or null.
- Error modes: Missing/invalid value should be treated as null; controller validation should accept only strings or null; do not block creation if absent.
- Success: Field is persisted, returned in responses, and visible in UI where appropriate.

Edge cases and considerations

- Backfill: Existing events will have null for this field. If a backfill is required, add a follow-up migration/data script.
- Upload flow: If the frontend uploads images directly to S3 (pre-signed URLs), the mobile UI needs to follow same flow as current landing image upload. If images are uploaded via backend, follow existing patterns.
- Validation: Limit string length to a reasonable limit (e.g., 2048 chars) and ensure value is a valid URL/S3 path if you validate. Prefer permissive acceptance and leave validation to the uploader service.
- Display fallback: If `landing_image_mobile_s3_path` is null, frontend should fallback to `landing_image_s3_path` or to a placeholder.

Implementation steps (detailed)

1) Create DB migration (after plan approval)
   - File: `apps/api/migrations/<timestamp>_add_landing_image_mobile_to_events.sql` (or project migration system format).
   - Up SQL: `ALTER TABLE events ADD COLUMN landing_image_mobile_s3_path TEXT;` (nullable by default)
   - Down SQL: `ALTER TABLE events DROP COLUMN landing_image_mobile_s3_path;`
   - Notes: Use the same migration style/locations as the repo uses currently (check `apps/api/migrations/` or `migrations/`).

2) Update Sequelize model
   - File: `apps/api/src/models/events.ts`
   - Add `landing_image_mobile_s3_path?: string;` to `EventAttributes`.
   - Add a `@Column({ type: DataType.TEXT, allowNull: true }) landing_image_mobile_s3_path?: string;` property in the `Event` Model class (match existing `landing_image_s3_path` column style).

3) Update repository, controller, and DTOs
   - Locate event create/update handlers (likely under `apps/api/src/controllers` or `services` or `repositories`).
   - Ensure request body parsing and validation includes the new field.
   - Persist value to DB when creating/updating.
   - Ensure read endpoints include the field in response payloads.

4) Tests
   - Update or add unit/integration tests for event create/update to include `landing_image_mobile_s3_path` in payloads and assert it's returned on fetch.
   - Add a test verifying fallback behavior (frontend-side test after frontend changes).

5) Frontend changes (detailed — `apps/frontend`)

    Where: The frontend application lives in `apps/frontend`. Key areas to change will be:
    - UI components or pages that create/update events (look under `apps/frontend/src/components`, `apps/frontend/src/pages`, or `apps/frontend/src/views`).
    - The API client / services layer that sends event create/update requests (commonly `apps/frontend/src/api` or `apps/frontend/src/services`).
    - Shared TypeScript types/interfaces for `Event` objects (could be under `apps/frontend/src/types` or a shared `packages/schema` package; search for `Event` or `EventAttributes`).
    - Any components that render landing images (event detail, event card, mobile layouts).

    Concrete frontend tasks:
    - Add a new field to the event form UI to capture/upload the mobile landing image. Options:
       - Add a second image upload slot called "Mobile landing image" next to the existing landing image upload.
       - Or add a checkbox/toggle that allows uploading a separate mobile image.
       - Prefer reusing the existing image upload component so the upload flow (presigned S3, validation, progress) stays consistent.

    - Upload flow:
       - If the current flow uses presigned URL uploads (common pattern), reuse the same presigned flow: upload the file, obtain the S3 path/URL, then set `landing_image_mobile_s3_path` in the event payload.
       - If the upload is mediated by the backend, call the same backend endpoint used for other images and capture returned path.

    - API client / payload:
       - Update the create/update payload to include `landing_image_mobile_s3_path?: string` where appropriate.
       - Ensure the API client types are updated so TypeScript surfaces usage errors.

    - Display & fallback:
       - When rendering event landing images on mobile viewports, prefer `landing_image_mobile_s3_path` if present; otherwise fall back to `landing_image_s3_path`.
       - Provide a default placeholder if neither is present.

    - Tests:
       - Update or add unit tests for the upload component to assert the new input triggers upload and sets the correct payload field.
       - Update integration/e2e tests (if any) that create/update events to include both image paths and assert correct rendering.

    - Types & linting:
       - Update TS `Event` interface(s) to include `landing_image_mobile_s3_path?: string`.
       - Run frontend build/lint/tests and fix any type errors introduced.

    Files likely to change (examples):
    - `apps/frontend/src/components/EventForm.tsx` (or similar) — add mobile image upload input.
    - `apps/frontend/src/components/ImageUploader.tsx` — reuse for mobile image if shared.
    - `apps/frontend/src/api/events.ts` or `apps/frontend/src/services/events.ts` — include field in payload.
    - `apps/frontend/src/types/event.ts` or `packages/schema/src` — add field to types.
    - `apps/frontend/src/pages/EventDetail.tsx` and mobile layout components — use mobile image when appropriate.

    Fallback/cross-platform notes:
    - Keep the UI behavior backward-compatible: if a user doesn't provide a mobile image, nothing breaks — the server will store null and the frontend should fall back to the standard landing image.
    - Consider adding a small preview UI that shows both images (desktop vs mobile) for content reviewers.

    Verification:
    - Manual: Create/update event with both images; verify request payload contains `landing_image_mobile_s3_path`, the backend stores it, and the frontend renders mobile image in mobile viewport.
    - Automated: unit test for uploader, integration test for event create/update, and snapshot/visual check for event detail mobile layout.

6) Lint, build, run tests, and smoke test
   - Run the repo's normal build and test routines. Fix any lint/type errors introduced.
   - Run a smoke test: create an event with both landing images and verify persistence and frontend display.

7) Docs & rollout
   - Add a short note in `apps/plan/landing_image_mobile_plan.md` or in repository README about the migration and how to backfill.
   - If you plan to backfill, add a script and a migration note.

Quality gates

- Migration runs cleanly and rollbacks work.
- Backend compiles, lints pass, and tests pass (unit + integration where available).
- Frontend builds and the form correctly sends/receives the new field.
- Manual smoke test: create event with mobile landing image; view on mobile-sized viewport to confirm mobile image shows.

Files likely to change (examples)

- apps/api/migrations/<timestamp>_add_landing_image_mobile_to_events.sql
- apps/api/src/models/events.ts
- apps/api/src/controllers/... (event create/update handlers)
- apps/api/src/repositories/... (if separate layer exists)
- apps/api/src/tests/... (unit/integration tests)
- apps/front-page/... or apps/frontend/... (UI component/form for event create/update)
- apps/frontend/src/types/... (TypeScript interfaces)
- apps/plan/landing_image_mobile_plan.md (this file)

Time estimate

- Create plan & get approval: done (you requested review)
- DB migration + model + repo/controller changes + tests: ~2–4 hours
- Frontend changes + tests + verification: ~2–4 hours (depends on upload flow complexity)
- QA + cleanup + docs: ~1 hour

Next steps after your approval

- I will mark the migration task in the todo list as in-progress and implement the DB migration, model change, controller/repo changes, and tests. Then I will run migrations locally and run tests. Finally, I'll implement frontend UI changes, update types, and run frontend build/tests and a smoke test.

---

Please review this plan. If it looks good, reply "approve" and I will start with the migration/model updates. If you want changes (naming, additional validations, backfill requirements), list them and I'll update the plan before implementing.