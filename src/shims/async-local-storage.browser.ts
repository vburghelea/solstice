// Minimal browser-safe stand-in for Node's AsyncLocalStorage
export class AsyncLocalStorage<T = unknown> {
  run<R>(_: T, fn: () => R): R {
    return fn();
  }
  getStore(): T | undefined {
    return undefined;
  }
  enterWith(_: T) {}
  disable() {}
}