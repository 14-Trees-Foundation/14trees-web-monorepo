export function formatLog(message: string, context?: unknown): void {
  if (context === undefined) {
    console.log(`[buffer-script] ${message}`);
    return;
  }

  if (context && typeof context === "object") {
    console.log(`[buffer-script] ${message}`, context);
    return;
  }

  console.log(`[buffer-script] ${message}`, context);
}