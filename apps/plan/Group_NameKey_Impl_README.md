# Implementation Plan: Add `name_key` to Group and friendly dashboard routing

Summary
- Add a new string field `name_key` to the `groups` model and DB table.
- `name_key` will be a URL-safe unique key (slug) used by the frontend for friendly URLs like:
  `${BASE_URL}/dashboard/${name_key}`
- Make changes in backend model, repository, controller, routes, and add a DB migration to add the column and backfill values.
- Update frontend add/edit group form to accept `name_key` (with a generated default from the group name), and add routing to resolve group pages by `name_key`.

Goals / success criteria
- DB has a `name_key` column on `groups`, indexed and unique.
- New groups can be created with `name_key` set; existing groups get a sensible backfilled key.
- Frontend supports creating/editing `name_key` and routes `/dashboard/:name_key` to the group page.
- Backwards compatibility: existing integer-ID routes continue to work during rollout.

Contract (inputs/outputs)
- Input: group create/update payload gains optional `name_key: string`.
- Output: group resources will include `name_key` and the frontend will navigate to `/dashboard/${name_key}`.
- Error modes: duplicate/invalid `name_key` -> 400; missing group (not found) -> 404.

Edge cases to handle
- Collisions of slugified values for groups with identical/similar names.
- Characters in names requiring normalization (diacritics, unicode, spaces, punctuation).
- Very long names -> truncated slug of safe length (e.g. 64 chars).
- Empty or missing name -> fallback unique generated key (e.g. group-{id}).
- Case-sensitivity — `name_key` should be canonicalized to lower-case.

Detailed plan

1) DB migration (apps/api/migrations)
- Add migration to alter `groups` table:
  - Add column `name_key VARCHAR(128)` (or appropriate length) NULLABLE initially.
  - Add a UNIQUE index on `name_key` (deferred until after backfill if needed) or create unique partial index to avoid blocking.
- Backfill existing rows:
  - For each group, create a slug from `name` (or `display_name`) by:
    - Lowercasing
    - Replacing spaces and punctuation with `-`
    - Transliteration for diacritics (if available) or remove non-ascii
    - Truncate to 64 chars
  - If slug collides with an existing one, append a numeric suffix (`-1`, `-2`, ...) until unique.
  - Persist `name_key` for all rows.
- Make the `name_key` column NOT NULL if desired, or allow NULLs but enforce presence for new records.
- Add unique index on `name_key` (if not present).

Notes about running the migration
- This migration will update all groups. If there are many groups, perform in batches.
- Provide an idempotent script in the migration that checks for existing `name_key` and skips.
- Include a rollback (DROP column or leave column but remove unique index) for safety.

2) Backend model & repository changes (apps/api/src)
- Update Group model interface/type (e.g. `src/models/group.ts`) to add `name_key?: string`.
- Update database repository layer to include `name_key` in selects, inserts, updates.
- Add validation:
  - `name_key` allowed characters: [a-z0-9-]
  - Lowercase only
  - Length limit (e.g. <= 64)
  - Reject duplicates at service layer before database insert (and rely on DB unique constraint for final guard)
- Provide helper function to generate canonical `name_key` from group name.
- Update any queries that construct group URLs or return group details to include `name_key`.

3) Backend controllers & routes
- Update create/update group endpoints to accept `name_key` optionally.
- If `name_key` not provided on create, generate from `name` server-side and persist.
- Add a route or modify existing group-get route to support lookup by `name_key`.
  - Options:
    - Keep existing `/groups/:id` endpoints and add `/groups/key/:name_key` or
    - Allow `/groups/:identifier` and detect whether `identifier` is numeric (id) or string (name_key) — be cautious with ambiguity.
- For the dashboard page API used by the frontend, add an endpoint `GET /groups/by-key/:name_key` or support query param `?name_key=...`.
- Keep existing behavior (ID-based) while adding key-based access to make rollout smoother.

4) Frontend changes (apps/frontend)
- Add `name_key` input to Add/Edit Group forms.
  - Show small helper text: "Used for group dashboard URL. Auto-generated from name, editable. Allowed: lowercase letters, numbers, hyphens."
  - Validate client-side similarly to server rules.
  - By default prefill `name_key` as a slug of the group name; keep input editable.
- Routing:
  - Add route `/dashboard/:name_key` to the frontend router.
  - On mount, call the API to fetch group by `name_key` (new endpoint). On success, render existing group dashboard page.
  - If not found, optionally fallback to trying integer ID from the path (if you support both), or show 404.
- Update any existing places that link to group dashboards so they use `name_key` if present; otherwise keep the ID link during migration period.

5) Testing & QA
- Backend unit tests for:
  - name_key generation helper (slugify, suffix collision handling)
  - validation and unique constraint errors
  - repository lookups by name_key
- Frontend tests for:
  - Form validation of `name_key` input
  - Routing to `/dashboard/:name_key` resolves correct group
- Smoke test: run migration on a staging DB and verify links and UI work.

6) Rollout strategy
- Deploy DB migration to staging; run backfill; validate.
- Deploy backend changes that support `name_key` while preserving ID-based routes.
- Deploy frontend changes that can link to either `name_key` or id.
- After verification, switch links to `name_key` where appropriate.

7) Backwards compatibility and devops notes
- Keep integer id routes for existing consumers and links until all clients are updated.
- If external systems reference groups by id, document the fallback behavior and consider adding redirects from old ID-based dashboard URLs to new `name_key` URLs.

Acceptance criteria (what I will demo)
- A new migration file in `apps/api/migrations` that adds and backfills `name_key`.
- Backend `Group` model and APIs updated; examples of creating a group with `name_key` and fetching by `name_key`.
- Frontend add/edit screen shows `name_key` with validation and default slug generation.
- Frontend can visit `/dashboard/some-name-key` and render the group dashboard.

Notes / assumptions
- DB is PostgreSQL (adjust SQL/DDL if different); use safe SQL constructs for uniqueness.
- Slug generation uses conservative character set ([a-z0-9-]) and ASCII transliteration for portability.
- `name_key` max length: 64 (tunable if needed).
- We'll add the migration in the same style/numbering used in `apps/api/migrations`.

Next steps after your review
- I'll implement the migration and backend changes first (one small PR at a time). Then frontend UI + routing. Each PR will include tests and a brief migration/run note.

If you'd like any part of this plan changed (e.g. prefer route structure `/groups/key/:name_key` instead of `/dashboard/:name_key` on the FE, or different slug rules), tell me and I'll update the plan.
