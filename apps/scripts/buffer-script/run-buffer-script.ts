#!/usr/bin/env ts-node
import { formatLog } from "./logger";
import { runReservation } from "./service";
import { parseCliArgs } from "./utils";

async function main(): Promise<void> {
  try {
    const options = parseCliArgs(process.argv.slice(2));
    formatLog("Starting buffer reservation process", options);
    const result = await runReservation(options);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    formatLog("Buffer reservation script failed", { error });
    process.exitCode = 1;
  }
}

main();