// Browser shim for node:stream imports referenced by SSR utilities.
export class Readable {
  static fromWeb() {
    throw new Error("Readable.fromWeb is not supported in the browser.");
  }

  static toWeb() {
    throw new Error("Readable.toWeb is not supported in the browser.");
  }
}

export class PassThrough {
  constructor() {
    throw new Error("PassThrough is not supported in the browser.");
  }
}
