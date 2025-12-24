// Browser shim for node:stream/web ReadableStream export.
export const ReadableStream =
  globalThis.ReadableStream ??
  class {
    constructor() {
      throw new Error("ReadableStream is not supported in this environment.");
    }
  };
