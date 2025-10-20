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

  // Add inputValidator method for functions that use it
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  serverFn.inputValidator = <T>(_fn: T) => {
    // Return an object that has both inputValidator and handler methods
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const validatedFn: any = vi.fn();
    validatedFn.handler = <U>(_fn: U) => serverFn.handler(_fn);
    validatedFn.inputValidator = <U>(_fn: U) => serverFn.inputValidator(_fn);
    return validatedFn;
  };

  // Keep validator for backward compatibility during migration
  serverFn.validator = <T>(_fn: T) => {
    return serverFn.inputValidator(_fn);
  };

  return serverFn;
};

// Mock createServerOnlyFn - this function is used to create server-only dependency functions
export const createMockServerOnlyFn = () => {
  return vi.fn().mockImplementation((fn: () => unknown) => {
    // Return a mock function that calls the original function
    return fn();
  });
};

// Mock module for @tanstack/react-start
export const mockTanStackStart = {
  createServerFn: createMockServerFn,
  createServerOnlyFn: createMockServerOnlyFn,
};
