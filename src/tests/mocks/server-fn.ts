import { vi } from "vitest";

// Mock implementation for TanStack Start's createServerFn
// This mock preserves the API structure while allowing tests to work with the functions

export const createMockServerFn = () => {
  // Create the base function that will be returned
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createServerFnResult: any = vi.fn();

  // Add inputValidator method - returns the same object for chaining
  createServerFnResult.inputValidator = () => {
    return createServerFnResult;
  };

  // Add middleware method - returns the same object for chaining
  createServerFnResult.middleware = () => {
    return createServerFnResult;
  };

  // Add handler method - sets up the actual handler function
  createServerFnResult.handler = <T>(fn: T) => {
    // Store the handler function so tests can call it
    createServerFnResult._handler = fn;
    // Make the mock return value when called
    createServerFnResult.mockImplementation(fn);
    return createServerFnResult;
  };

  return createServerFnResult;
};

// Mock module for @tanstack/react-start
export const mockTanStackStart = {
  createServerFn: createMockServerFn,
};
