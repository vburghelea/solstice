// Minimal browser-safe stand-in for Node's AsyncLocalStorage
export class AsyncLocalStorage<T = unknown> {
  private store: T | undefined;

  run<R>(store: T, fn: () => R): R {
    const previous = this.store;
    this.store = store;
    try {
      return fn();
    } finally {
      this.store = previous;
    }
  }

  getStore(): T | undefined {
    return this.store;
  }

  enterWith(store: T) {
    this.store = store;
  }

  disable() {
    this.store = undefined;
  }
}
