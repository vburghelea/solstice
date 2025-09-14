import { vi } from "vitest";

// Mock implementation for TanStack Start's createServerFn
// This mock preserves the API structure while allowing tests to work with the functions

export const createMockServerFn = () => {
  const serverFn = () => {
    // Default function call
    return vi.fn();
  };

  // Add handler method that returns the original function
  serverFn.handler = <T>(fn: T) => {
    // For server functions, we want to return the actual function so tests can call it
    // but we also want to be able to spy on it if needed
    return fn;
  };

  // Add validator method for functions that use it
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  serverFn.validator = <T>(_fn: T) => {
    // Return an object that has both validator and handler methods
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const validatedFn: any = vi.fn();
    validatedFn.handler = <U>(_fn: U) => serverFn.handler(_fn);
    validatedFn.validator = <U>(_fn: U) => serverFn.validator(_fn);
    return validatedFn;
  };

  return serverFn;
};

// Mock module for @tanstack/react-start
export const mockTanStackStart = {
  createServerFn: createMockServerFn,
};
