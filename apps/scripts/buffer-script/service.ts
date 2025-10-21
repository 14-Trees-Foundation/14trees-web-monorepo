import { Client } from "pg";
import { formatLog } from "./logger";
import { CliOptions } from "./utils";

export interface PlantTypeSummary {
  plant_type_id: number;
  plant_type_name: string;
  total_trees: number;
  required_buffer: number;
  already_reserved: number;
  newly_reserved: number;
  reserved_sapling_ids: string[];
}

export interface PlotSummary {
  plot_id: number;
  reservation_percentage: number;
  plant_types: PlantTypeSummary[];
}

interface DbConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean | Record<string, unknown>;
}

const BUFFER_GROUP_ID = 195;
const BUFFER_ASSIGNED_TO = 20621;

function parseBoolean(value: string | undefined): boolean | Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value === "true";
  }
}

function buildDbConfig(): DbConfig {

  const host = process.env.DB_HOST ?? process.env.POSTGRES_HOST;
  const port = process.env.DB_PORT
    ? Number(process.env.DB_PORT)
    : process.env.POSTGRES_PORT
    ? Number(process.env.POSTGRES_PORT)
    : undefined;
  const user = process.env.DB_USER ?? process.env.POSTGRES_READER_USER;
  const password = process.env.DB_PASSWORD ?? process.env.POSTGRES_READER_PD;
  const database = "defaultdb";

  if (!host || !user || !database) {
    throw new Error(
      "Database configuration missing. Provide DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME"
    );
  }

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: {
      rejectUnauthorized: false, 
    },
  };
}

async function fetchPlantTypeStats(
  client: Client,
  plotIds: number[],
  reservationPercentage: number
): Promise<PlotSummary[]> {
  if (plotIds.length === 0) {
    return [];
  }

  const plotsResult = await client.query(
    `
      SELECT 
        t.plot_id,
        t.plant_type_id,
        p.name AS plant_type_name,
        COUNT(*) AS total_trees,
        SUM(
          CASE WHEN t.mapped_to_group = $2
            AND t.sponsored_by_group = $2
            AND t.assigned_to = $3
          THEN 1 ELSE 0 END
        ) AS already_reserved
      FROM "14trees".trees t
      JOIN "14trees".plant_types p ON t.plant_type_id = p.id
      WHERE t.plot_id = ANY($1::int[])
      GROUP BY t.plot_id, t.plant_type_id, p.name
      ORDER BY t.plot_id, t.plant_type_id, p.name
    `,
    [plotIds, BUFFER_GROUP_ID, BUFFER_ASSIGNED_TO]
  );

  const summaryMap = new Map<number, PlotSummary>();

  for (const row of plotsResult.rows) {
    const plotId = Number(row.plot_id);
    const plantTypeId = Number(row.plant_type_id);
    const totalTrees = Number(row.total_trees);
    const alreadyReserved = Number(row.already_reserved);
    const requiredBuffer = Math.ceil((totalTrees * reservationPercentage) / 100);

    if (!summaryMap.has(plotId)) {
      summaryMap.set(plotId, {
        plot_id: plotId,
        reservation_percentage: reservationPercentage,
        plant_types: [],
      });
    }

    summaryMap.get(plotId)!.plant_types.push({
      plant_type_id: plantTypeId,
      plant_type_name: row.plant_type_name as string,
      total_trees: totalTrees,
      required_buffer: requiredBuffer,
      already_reserved: alreadyReserved,
      newly_reserved: 0,
      reserved_sapling_ids: [],
    });
  }

  return Array.from(summaryMap.values());
}

async function selectAdditionalTrees(
  client: Client,
  summary: PlotSummary
): Promise<void> {
  for (const plantSummary of summary.plant_types) {
    const { plant_type_id, required_buffer, already_reserved } = plantSummary;
    const additionalNeeded = required_buffer - already_reserved;

    if (additionalNeeded <= 0) {
      continue;
    }

    const eligibleResult = await client.query(
      `
        SELECT sapling_id
        FROM "14trees".trees
        WHERE plot_id = $1
          AND plant_type_id = $2
          AND mapped_to_group IS NULL
          AND mapped_to_user IS NULL
        ORDER BY sapling_id ASC
        LIMIT $3
      `,
      [summary.plot_id, plant_type_id, additionalNeeded]
    );

    const eligibleIds = eligibleResult.rows.map((row) => String(row.sapling_id));

    if (eligibleIds.length < additionalNeeded) {
      formatLog("Insufficient eligible trees", {
        plot_id: summary.plot_id,
        plant_type_id,
        required_buffer,
        already_reserved,
        additional_needed: additionalNeeded,
        eligible_found: eligibleIds.length,
      });
    }

    plantSummary.newly_reserved = eligibleIds.length;
    plantSummary.reserved_sapling_ids = eligibleIds;
  }
}

async function applyReservations(
  client: Client,
  summary: PlotSummary
): Promise<void> {
  const saplingIdsToReserve = summary.plant_types.flatMap(
    (plant) => plant.reserved_sapling_ids
  );

  if (saplingIdsToReserve.length === 0) {
    return;
  }

  const now = new Date();
  await client.query(
    `
      UPDATE "14trees".trees
        SET
          mapped_to_group = $1,
          sponsored_by_group = $1,
          assigned_to = $2,
          mapped_at = $3::timestamp,
          assigned_at = $3::timestamp,
          updated_at = $3::timestamp,
          sponsored_at = $3::timestamp
      WHERE sapling_id = ANY($4::varchar[])
    `,
    [BUFFER_GROUP_ID, BUFFER_ASSIGNED_TO, now, saplingIdsToReserve]
  );
}

async function resolvePlotIds(
  client: Client,
  plotIds: number[],
  plotNames: string[]
): Promise<number[]> {
  const resolvedIds = new Set<number>(plotIds);

  if (plotNames.length === 0) {
    return Array.from(resolvedIds);
  }

  const result = await client.query(
    `
      SELECT id, name
      FROM "14trees".plots
      WHERE name = ANY($1::text[])
    `,
    [plotNames]
  );

  const foundNames = new Set<string>();
  for (const row of result.rows) {
    resolvedIds.add(Number(row.id));
    foundNames.add(String(row.name));
  }

  const missing = plotNames.filter((name) => !foundNames.has(name));
  if (missing.length > 0) {
    throw new Error(`Plot name(s) not found: ${missing.join(", ")}`);
  }

  const resolvedList = Array.from(resolvedIds);
  formatLog("Resolved plot identifiers", {
    provided_plot_ids: plotIds,
    provided_plot_names: plotNames,
    resolved_plot_ids: resolvedList,
  });

  return resolvedList;
}

export async function runReservation(options: CliOptions): Promise<PlotSummary[]> {
  const dbConfig = buildDbConfig();
  const client = new Client(dbConfig);
  await client.connect();

  try {
    const plotIds = await resolvePlotIds(
      client,
      options.plotIds,
      options.plotNames
    );

    const summaries = await fetchPlantTypeStats(
      client,
      plotIds,
      options.reservationPercentage
    );

    for (const summary of summaries) {
      await selectAdditionalTrees(client, summary);
    }

    if (options.dryRun) {
      formatLog("Dry-run mode enabled. Skipping database updates.");
      return summaries;
    }

    await client.query("BEGIN");
    try {
      for (const summary of summaries) {
        await applyReservations(client, summary);
      }
      await client.query("COMMIT");
      formatLog("Database update successful.");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    return summaries;
  } finally {
    await client.end();
  }
}