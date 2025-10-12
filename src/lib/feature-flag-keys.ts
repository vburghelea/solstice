export const WORKSPACE_FEATURE_FLAGS = {
  sharedInbox: "workspace-shared-inbox",
  collaboration: "workspace-collaboration",
} as const;

export type WorkspaceFeatureFlagKey =
  (typeof WORKSPACE_FEATURE_FLAGS)[keyof typeof WORKSPACE_FEATURE_FLAGS];
