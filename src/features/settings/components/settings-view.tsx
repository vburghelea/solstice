import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  Shield,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { MfaEnrollmentCard } from "~/features/auth/mfa/mfa-enrollment";
import { MfaRecoveryCard } from "~/features/auth/mfa/mfa-recovery";
import { NotificationPreferencesCard } from "~/features/notifications/components/notification-preferences-card";
import type {
  ChangePasswordInput,
  LinkedAccountsOverview,
  SessionsOverview,
} from "~/features/settings";
import {
  changePassword,
  getAccountOverview,
  getSessionsOverview,
  revokeOtherSessions,
  revokeSession,
  unlinkAccount,
} from "~/features/settings";
import { auth } from "~/lib/auth-client";
import {
  getPasswordStrength,
  getPasswordStrengthLabel,
  validatePassword,
} from "~/lib/security/utils/password-validator";

interface AccountOverviewResult extends LinkedAccountsOverview {
  user: { id: string; name: string; email: string; emailVerified: boolean };
  hasPassword: boolean;
  availableProviders: string[];
}

type ChangePasswordFormValues = ChangePasswordInput & {
  confirmPassword: string;
};

function formatUserAgent(agent: string | null | undefined) {
  if (!agent) return "Unknown device";
  if (agent.toLowerCase().includes("mobile")) return "Mobile device";
  if (agent.toLowerCase().includes("mac")) return "macOS";
  if (agent.toLowerCase().includes("windows")) return "Windows";
  if (agent.toLowerCase().includes("linux")) return "Linux";
  return agent.split(" ")[0] ?? "Unknown";
}

function maskToken(token: string) {
  if (token.length <= 8) return "••••";
  return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}

export function SettingsView() {
  const queryClient = useQueryClient();
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    data: accountOverview,
    isLoading: accountLoading,
    isFetching: accountFetching,
    error: accountError,
  } = useQuery({
    queryKey: ["account-overview"],
    queryFn: async (): Promise<AccountOverviewResult> => {
      const result = await getAccountOverview();
      if (!result.success || !result.data) {
        throw new Error(result.errors?.[0]?.message || "Failed to load account overview");
      }
      return result.data;
    },
    staleTime: 60_000,
  });

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isFetching: sessionsFetching,
    error: sessionsError,
  } = useQuery({
    queryKey: ["sessions-overview"],
    queryFn: async (): Promise<SessionsOverview> => {
      const result = await getSessionsOverview();
      if (!result.success || !result.data) {
        throw new Error(result.errors?.[0]?.message || "Failed to load sessions");
      }
      return result.data;
    },
    refetchInterval: 60_000,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (input: ChangePasswordInput) => changePassword({ data: input }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Password updated");
        queryClient.invalidateQueries({ queryKey: ["account-overview"] });
      } else {
        const message = result.errors?.[0]?.message || "Failed to update password";
        toast.error(message);
        throw new Error(message);
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (token: string) => revokeSession({ data: { token } }),
    onSuccess: async (result) => {
      if (!result.success) {
        const message = result.errors?.[0]?.message || "Failed to revoke session";
        toast.error(message);
        throw new Error(message);
      }
      toast.success("Session revoked");
      await queryClient.invalidateQueries({ queryKey: ["sessions-overview"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to revoke session";
      toast.error(message);
    },
  });

  const revokeOthersMutation = useMutation({
    mutationFn: async () => revokeOtherSessions(),
    onSuccess: async (result) => {
      if (!result.success) {
        const message = result.errors?.[0]?.message || "Failed to revoke other sessions";
        toast.error(message);
        throw new Error(message);
      }
      toast.success("Other sessions revoked");
      await queryClient.invalidateQueries({ queryKey: ["sessions-overview"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to revoke other sessions";
      toast.error(message);
    },
  });

  const unlinkAccountMutation = useMutation({
    mutationFn: async (variables: { providerId: string; accountId?: string }) =>
      unlinkAccount({ data: variables }),
    onSuccess: async (result) => {
      if (!result.success) {
        const message = result.errors?.[0]?.message || "Failed to unlink account";
        toast.error(message);
        throw new Error(message);
      }
      toast.success("Account disconnected");
      await queryClient.invalidateQueries({ queryKey: ["account-overview"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to unlink account";
      toast.error(message);
    },
  });

  const changePasswordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    } as ChangePasswordFormValues,
    onSubmit: async ({ value, formApi }) => {
      const formValues = value as ChangePasswordFormValues;
      setPasswordError(null);

      if (formValues.newPassword !== formValues.confirmPassword) {
        setPasswordError("New password and confirmation do not match");
        return;
      }

      const validation = validatePassword(formValues.newPassword);
      if (!validation.isValid) {
        setPasswordError(validation.errors[0] ?? "Password does not meet requirements");
        return;
      }

      try {
        await changePasswordMutation.mutateAsync({
          currentPassword: formValues.currentPassword,
          newPassword: formValues.newPassword,
          revokeOtherSessions: formValues.revokeOtherSessions,
        });

        formApi.reset();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update password. Please try again.";
        setPasswordError(message);
      }
    },
  });

  const pendingChangePassword = changePasswordMutation.isPending;
  const passwordStrength = (() => {
    const password = (changePasswordForm.state.values as ChangePasswordFormValues)
      .newPassword;
    if (!password) return null;
    const score = getPasswordStrength(password);
    return {
      score,
      label: getPasswordStrengthLabel(score),
    };
  })();

  const otherSessions = useMemo(() => {
    if (!sessionsData) return [];
    return sessionsData.sessions.filter((session) => !session.isCurrent);
  }, [sessionsData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account security, sessions, and connected services
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accountLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    changePasswordForm.handleSubmit();
                  }}
                >
                  {accountOverview?.user.email ? (
                    <input
                      type="email"
                      name="username"
                      autoComplete="username"
                      value={accountOverview.user.email}
                      readOnly
                      tabIndex={-1}
                      className="sr-only"
                    />
                  ) : null}

                  <changePasswordForm.Field name="currentPassword">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        type="password"
                        label="Current password"
                        autoComplete="current-password"
                        placeholder="Enter your current password"
                      />
                    )}
                  </changePasswordForm.Field>

                  <changePasswordForm.Field name="newPassword">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        type="password"
                        label="New password"
                        autoComplete="new-password"
                        placeholder="Create a strong password"
                      />
                    )}
                  </changePasswordForm.Field>

                  {passwordStrength ? (
                    <div className="text-muted-foreground text-sm">
                      Password strength:{" "}
                      <span className="font-medium">{passwordStrength.label}</span>
                    </div>
                  ) : null}

                  <changePasswordForm.Field name="confirmPassword">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        type="password"
                        label="Confirm new password"
                        autoComplete="new-password"
                        placeholder="Re-enter your new password"
                      />
                    )}
                  </changePasswordForm.Field>

                  <changePasswordForm.Field name="revokeOtherSessions">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label="Sign out of other devices"
                        description="End active sessions on other browsers and devices"
                      />
                    )}
                  </changePasswordForm.Field>

                  {passwordError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Unable to update password</AlertTitle>
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="submit"
                      disabled={pendingChangePassword}
                      className="min-w-[140px]"
                    >
                      {pendingChangePassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update password"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {accountOverview?.hasPassword ? (
            <>
              <MfaEnrollmentCard />
              <MfaRecoveryCard />
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Multi-factor authentication unavailable</AlertTitle>
              <AlertDescription>
                MFA requires a password-based account. Add a password to enable MFA.
              </AlertDescription>
            </Alert>
          )}

          <NotificationPreferencesCard />

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Review browsers and devices that are currently signed in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : sessionsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to load sessions</AlertTitle>
                  <AlertDescription>
                    {(sessionsError as Error).message ||
                      "Please refresh the page and try again."}
                  </AlertDescription>
                </Alert>
              ) : sessionsData ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Last active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionsData.sessions.map((session) => (
                        <TableRow
                          key={session.id}
                          data-state={session.isCurrent ? "selected" : undefined}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {session.isCurrent
                                  ? "This device"
                                  : formatUserAgent(session.userAgent)}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                Session ID: {maskToken(session.token)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{session.ipAddress ?? "Unknown"}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(session.updatedAt), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {session.isCurrent ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                Current
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  revokeSessionMutation.mutate(session.token)
                                }
                                disabled={revokeSessionMutation.isPending}
                              >
                                {revokeSessionMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <LogOut className="mr-2 h-4 w-4" />
                                )}
                                Revoke
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {otherSessions.length > 0 ? (
                    <Button
                      variant="outline"
                      onClick={() => revokeOthersMutation.mutate()}
                      disabled={revokeOthersMutation.isPending}
                    >
                      {revokeOthersMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="mr-2 h-4 w-4" />
                      )}
                      Sign out of all other sessions
                    </Button>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Only your current session is active.
                    </div>
                  )}

                  {sessionsFetching ? (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Refreshing session data...
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account status</CardTitle>
              <CardDescription>Overview of your primary account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accountLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ) : accountError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unable to load account</AlertTitle>
                  <AlertDescription>
                    {(accountError as Error).message ||
                      "Please refresh the page and try again."}
                  </AlertDescription>
                </Alert>
              ) : accountOverview ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-muted-foreground text-sm font-medium">Name</div>
                    <div className="text-sm">{accountOverview.user.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm font-medium">Email</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{accountOverview.user.email}</span>
                      {accountOverview.user.emailVerified ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-400 text-amber-700"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" /> Not verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm font-medium">
                      Password
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>
                        {accountOverview.hasPassword ? "Set" : "Not configured"}
                      </span>
                      {!accountOverview.hasPassword ? (
                        <Badge variant="outline" className="border-red-400 text-red-700">
                          Required
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {accountFetching ? (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Refreshing account info...
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected accounts</CardTitle>
              <CardDescription>Manage social logins and linked services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accountLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : accountOverview ? (
                <div className="space-y-3">
                  {accountOverview.availableProviders.map((providerId) => {
                    if (providerId === "email") {
                      return (
                        <div
                          key={providerId}
                          className="border-border flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">Email &amp; password</div>
                            <p className="text-muted-foreground text-sm">
                              {accountOverview.hasPassword
                                ? "You can sign in with your email and password."
                                : "Set a password to allow email-based sign in."}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const focusElement = document.querySelector(
                                'input[name="currentPassword"]',
                              ) as HTMLInputElement | null;
                              focusElement?.focus();
                            }}
                          >
                            Update password
                          </Button>
                        </div>
                      );
                    }

                    const account = accountOverview.accounts.find(
                      (item) => item.providerId === providerId,
                    );

                    const isLinked = Boolean(account);

                    return (
                      <div
                        key={providerId}
                        className="border-border flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{providerId}</span>
                            {isLinked ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                Connected
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not connected</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {isLinked
                              ? "You can sign in using this provider."
                              : "Connect this provider to sign in without a password."}
                          </p>
                        </div>
                        {isLinked ? (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (account?.accountId) {
                                unlinkAccountMutation.mutate({
                                  providerId,
                                  accountId: account.accountId,
                                });
                              } else {
                                unlinkAccountMutation.mutate({ providerId });
                              }
                            }}
                            disabled={unlinkAccountMutation.isPending}
                          >
                            {unlinkAccountMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() =>
                              auth.signInWithOAuth(
                                {
                                  provider: providerId as "google",
                                  callbackURL: window.location.href,
                                },
                                {
                                  onRequest: () => {
                                    toast.message("Redirecting to provider...");
                                  },
                                  onError: (ctx: unknown) => {
                                    const errorContext =
                                      ctx && typeof ctx === "object" && "error" in ctx
                                        ? (ctx as { error?: { message?: string } })
                                        : undefined;
                                    const errorMessage =
                                      errorContext?.error?.message ||
                                      "Failed to connect account";
                                    toast.error(errorMessage);
                                  },
                                },
                              )
                            }
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Connect
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
