#!/usr/bin/env ts-node

export interface CliOptions {
  plotIds: number[];
  plotNames: string[];
  reservationPercentage: number;
  dryRun: boolean;
}

const DEFAULT_PERCENTAGE = 20;

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    plotIds: [],
    plotNames: [],
    reservationPercentage: DEFAULT_PERCENTAGE,
    dryRun: false,
  };

  argv.forEach((arg) => {
    if (arg.startsWith("--plots=")) {
      options.plotIds = arg
        .replace("--plots=", "")
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !Number.isNaN(id));
    }

    if (arg.startsWith("--plot-names=") || arg.startsWith("--plotNames=")) {
      const value = arg
        .replace("--plot-names=", "")
        .replace("--plotNames=", "")
        .trim();
      options.plotNames = value.length
        ? value
            .split(",")
            .map((name) => name.trim())
            .filter((name) => name.length > 0)
        : [];
    }

    if (arg.startsWith("--percentage=")) {
      const value = Number(arg.replace("--percentage=", ""));
      if (!Number.isNaN(value) && value > 0) {
        options.reservationPercentage = value;
      }
    }

    if (arg === "--dry-run" || arg === "--dryRun" || arg === "--dryrun") {
      options.dryRun = true;
    }
  });

  if (options.plotIds.length === 0 && options.plotNames.length === 0) {
    throw new Error(
      "At least one plot_id via --plots=<id1,id2,...> or plot name via --plot-names=<name1,name2,...> is required"
    );
  }

  return options;
}