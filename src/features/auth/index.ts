// Export auth hooks
export { useAuth, useAuthenticatedUser } from "./hooks/useAuth";

// Export components (default exports)
export { default as Login } from "./components/login";
export { default as Signup } from "./components/signup";

// Legacy exports (deprecated - use route guards instead)
export { useAuthGuard, withAuthGuard } from "./useAuthGuard";
