# Event-Trees Mapping Script

Update `trees.event_id` for a list of `sapling_id` values. Supports providing an `event_id` directly or resolving it from an event name.

## Prerequisites
- Node.js 18+
- PostgreSQL credentials present in `.env`. By default, this script loads `apps/api/.env` which includes:
  - `POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_DB, POSTGRES_PD, POSTGRES_SCHEMA`
- `pg` and `dotenv` packages available in the repo (installed via Yarn workspaces).

## Usage
Run from repo root or the script directory:

```bash
node apps/scripts/event-trees-mapping/update-event-mapping.js --sapling-ids 1001,1002,1003 --event-id 42
```

### Options
- `--sapling-ids <list>`: Comma or space-separated sapling IDs.
- `--file <path>`: Input file with sapling IDs.
  - Plain text: one id per line.
  - CSV: use `--csv` and `--column sapling_id`.
- `--csv`: Treat input file as CSV.
- `--column <name>`: CSV column to read (default: `sapling_id`).
- `--event-id <id>`: Event ID to set.
- `--event-name <name>`: Resolve event id by name (see `--ilike`).
- `--ilike`: Use case-insensitive partial match (`ILIKE %name%`) when resolving by name.
- `--dry-run`: Show planned changes without updating.
- `--env <path>`: Path to `.env` (default: `apps/api/.env`).
- `--help`: Show help.

### Examples
- Direct IDs and event id:
```bash
node apps/scripts/event-trees-mapping/update-event-mapping.js \
  --sapling-ids 1001 1002 1003 \
  --event-id 10
```

- From text file and resolve by exact event name:
```bash
node apps/scripts/event-trees-mapping/update-event-mapping.js \
  --file ./saplings.txt \
  --event-name "Company Day 2024"
```

- From CSV and resolve by partial name (latest match):
```bash
node apps/scripts/event-trees-mapping/update-event-mapping.js \
  --file ./saplings.csv --csv --column sapling_id \
  --event-name "CSR Week" --ilike
```

- Dry run:
```bash
node apps/scripts/event-trees-mapping/update-event-mapping.js \
  --sapling-ids 2001,2002 \
  --event-id 15 \
  --dry-run
```

## Notes
- If some `sapling_id` do not exist, they will be skipped and a warning will be shown.
- When using `--event-name`, the script picks the latest event by `event_date DESC NULLS LAST, id DESC`.
- If `POSTGRES_SCHEMA` is set, the script sets `search_path` accordingly before running queries.