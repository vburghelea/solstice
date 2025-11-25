// Re-export all mocks for easy importing
export {
  ComplexLocalizedLinkMock,
  ConditionalLocalizedLinkMock,
  LocalizedLinkMock,
  localizedLinkMock,
} from "./localized-link";
export { mockNavigate, setupRouterMock, tanStackRouterMock } from "./router";

import { localizedLinkMock } from "./localized-link";
import { setupRouterMock } from "./router";

// Helper to set up all common mocks
export const setupCommonMocks = (pathname: string = "/") => {
  const routerMock = setupRouterMock(pathname);

  return {
    router: routerMock,
    localizedLink: localizedLinkMock,
  };
};
