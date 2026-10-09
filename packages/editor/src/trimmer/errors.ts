/** Rejects `trim()` when `cancel()` (or an abort signal) stops a running trim. */
export class TrimCanceledError extends Error {
  constructor() {
    super("Trim canceled");
    this.name = "TrimCanceledError";
  }
}
