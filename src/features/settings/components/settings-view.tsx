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
import { useEffect, useMemo, useState } from "react";
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
import type {
  ChangePasswordInput,
  LinkedAccountsOverview,
  NotificationPreferences,
  SessionsOverview,
} from "~/features/settings";
import {
  changePassword,
  defaultNotificationPreferences,
  getAccountOverview,
  getNotificationPreferences,
  getSessionsOverview,
  revokeOtherSessions,
  revokeSession,
  unlinkAccount,
  updateNotificationPreferences,
} from "~/features/settings";
import { useSettingsTranslation } from "~/hooks/useTypedTranslation";
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

function formatUserAgent(agent: string | null | undefined, t: (key: string) => string) {
  if (!agent) return t("sections.sessions.unknown_device");
  if (agent.toLowerCase().includes("mobile"))
    return t("sections.sessions.device_types.mobile_device");
  if (agent.toLowerCase().includes("mac")) return t("sections.sessions.platforms.macos");
  if (agent.toLowerCase().includes("windows"))
    return t("sections.sessions.platforms.windows");
  if (agent.toLowerCase().includes("linux"))
    return t("sections.sessions.platforms.linux");
  return agent.split(" ")[0] ?? t("sections.sessions.unknown_device");
}

function maskToken(token: string) {
  if (token.length <= 8) return "••••";
  return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}

export function SettingsView() {
  const { t } = useSettingsTranslation();
  const queryClient = useQueryClient();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);

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
        throw new Error(result.errors?.[0]?.message || t("errors.load_failed"));
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
        throw new Error(result.errors?.[0]?.message || t("errors.load_sessions"));
      }
      return result.data;
    },
    refetchInterval: 60_000,
  });

  const {
    data: notificationPreferences,
    isLoading: notificationLoading,
    isFetching: notificationFetching,
    error: notificationQueryError,
  } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async (): Promise<NotificationPreferences> => {
      const result = await getNotificationPreferences();
      if (!result.success || !result.data) {
        throw new Error(result.errors?.[0]?.message || t("errors.load_preferences"));
      }
      return result.data;
    },
    staleTime: 60_000,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (input: ChangePasswordInput) => changePassword({ data: input }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("success.password_updated"));
        queryClient.invalidateQueries({ queryKey: ["account-overview"] });
      } else {
        const message = result.errors?.[0]?.message || t("errors.update_password");
        toast.error(message);
        throw new Error(message);
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("errors.update_password");
      toast.error(message);
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (token: string) => revokeSession({ data: { token } }),
    onSuccess: async (result) => {
      if (!result.success) {
        const message = result.errors?.[0]?.message || t("errors.session_revoke_failed");
        toast.error(message);
        throw new Error(message);
      }
      toast.success(t("success.session_revoked"));
      await queryClient.invalidateQueries({ queryKey: ["sessions-overview"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("errors.session_revoke_failed");
      toast.error(message);
    },
  });

  const revokeOthersMutation = useMutation({
    mutationFn: async () => revokeOtherSessions(),
    onSuccess: async (result) => {
      if (!result.success) {
        const message = result.errors?.[0]?.message || t("errors.session_revoke_failed");
        toast.error(message);
        throw new Error(message);
      }
      toast.success(t("success.all_sessions_revoked"));
      await queryClient.invalidateQueries({ queryKey: ["sessions-overview"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("errors.session_revoke_failed");
      toast.error(message);
    },
  });

  const unlinkAccountMutation = useMutation({
    mutationFn: async (variables: { providerId: string; accountId?: string }) =>
      unlinkAccount({ data: variables }),
    onSuccess: async (result) => {
      if (!result.success) {
        const message = result.errors?.[0]?.message || t("errors.unlink_account");
        toast.error(message);
        throw new Error(message);
      }
      toast.success(t("success.account_disconnected"));
      await queryClient.invalidateQueries({ queryKey: ["account-overview"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t("errors.unlink_account");
      toast.error(message);
    },
  });

  const updateNotificationPreferencesMutation = useMutation({
    mutationFn: async (input: NotificationPreferences) =>
      updateNotificationPreferences({ data: input }),
    onSuccess: async (result) => {
      if (!result.success || !result.data) {
        const message = result.errors?.[0]?.message || t("errors.save_preferences");
        toast.error(message);
        throw new Error(message);
      }
      toast.success(t("success.email_preferences_updated"));
      await queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("errors.save_preferences");
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
        setPasswordError(t("sections.security.password.validation.mismatch"));
        return;
      }

      const validation = validatePassword(formValues.newPassword);
      if (!validation.isValid) {
        setPasswordError(
          validation.errors[0] ??
            t("sections.security.password.validation.requirements_not_met"),
        );
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
          error instanceof Error ? error.message : t("errors.update_password");
        setPasswordError(message);
      }
    },
  });

  const notificationForm = useForm({
    defaultValues: {
      ...defaultNotificationPreferences,
    } as NotificationPreferences,
    onSubmit: async ({ value, formApi }) => {
      setNotificationError(null);
      try {
        const preferences = value as NotificationPreferences;
        const result =
          await updateNotificationPreferencesMutation.mutateAsync(preferences);
        if (result.success) {
          formApi.reset();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("errors.save_preferences");
        setNotificationError(message);
      }
    },
  });

  useEffect(() => {
    if (!notificationPreferences) {
      return;
    }

    (
      Object.entries(notificationPreferences) as [
        keyof NotificationPreferences,
        boolean,
      ][]
    ).forEach(([key, value]) => {
      notificationForm.setFieldValue(key, value);
    });
  }, [notificationPreferences, notificationForm]);

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
        <h1 className="text-3xl font-bold tracking-tight">
          {t("sections.account.title")}
        </h1>
        <p className="text-muted-foreground mt-2">{t("sections.account.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.security.password.title")}</CardTitle>
              <CardDescription>
                {t("sections.security.password.subtitle")}
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
                  <changePasswordForm.Field name="currentPassword">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        type="password"
                        label={t("sections.security.password.current_password")}
                        autoComplete="current-password"
                        placeholder={t(
                          "sections.security.password.placeholders.current_password",
                        )}
                      />
                    )}
                  </changePasswordForm.Field>

                  <changePasswordForm.Field name="newPassword">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        type="password"
                        label={t("sections.security.password.new_password")}
                        autoComplete="new-password"
                        placeholder={t(
                          "sections.security.password.placeholders.new_password",
                        )}
                      />
                    )}
                  </changePasswordForm.Field>

                  {passwordStrength ? (
                    <div className="text-muted-foreground text-sm">
                      {t("sections.security.password.strength_label")}{" "}
                      <span className="font-medium">{passwordStrength.label}</span>
                    </div>
                  ) : null}

                  <changePasswordForm.Field name="confirmPassword">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        type="password"
                        label={t("sections.security.password.confirm_new_password")}
                        autoComplete="new-password"
                        placeholder={t(
                          "sections.security.password.placeholders.confirm_password",
                        )}
                      />
                    )}
                  </changePasswordForm.Field>

                  <changePasswordForm.Field name="revokeOtherSessions">
                    {(field) => (
                      <ValidatedCheckbox
                        field={field}
                        label={t("sections.security.password.sign_out_devices")}
                        description={t(
                          "sections.security.password.sign_out_devices_description",
                        )}
                      />
                    )}
                  </changePasswordForm.Field>

                  {passwordError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t("errors.unable_to_update_password")}</AlertTitle>
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
                          {t("sections.security.password.button_loading")}
                        </>
                      ) : (
                        t("sections.security.password.button")
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sections.notifications.title")}</CardTitle>
              <CardDescription>{t("sections.notifications.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {notificationLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-11/12" />
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-10 w-32" />
                </div>
              ) : notificationQueryError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {t("sections.notifications.errors.load_failed")}
                  </AlertTitle>
                  <AlertDescription>
                    {(notificationQueryError as Error).message ||
                      t("sections.notifications.errors.refresh_page")}
                  </AlertDescription>
                </Alert>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    notificationForm.handleSubmit();
                  }}
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <notificationForm.Field name="gameReminders">
                      {(field) => (
                        <ValidatedCheckbox
                          field={field}
                          label={t(
                            "sections.notifications.preferences.game_reminders.label",
                          )}
                          description={t(
                            "sections.notifications.preferences.game_reminders.description",
                          )}
                          disabled={updateNotificationPreferencesMutation.isPending}
                        />
                      )}
                    </notificationForm.Field>
                    <notificationForm.Field name="gameUpdates">
                      {(field) => (
                        <ValidatedCheckbox
                          field={field}
                          label={t(
                            "sections.notifications.preferences.game_updates.label",
                          )}
                          description={t(
                            "sections.notifications.preferences.game_updates.description",
                          )}
                          disabled={updateNotificationPreferencesMutation.isPending}
                        />
                      )}
                    </notificationForm.Field>
                    <notificationForm.Field name="campaignDigests">
                      {(field) => (
                        <ValidatedCheckbox
                          field={field}
                          label={t(
                            "sections.notifications.preferences.campaign_digests.label",
                          )}
                          description={t(
                            "sections.notifications.preferences.campaign_digests.description",
                          )}
                          disabled={updateNotificationPreferencesMutation.isPending}
                        />
                      )}
                    </notificationForm.Field>
                    <notificationForm.Field name="campaignUpdates">
                      {(field) => (
                        <ValidatedCheckbox
                          field={field}
                          label={t(
                            "sections.notifications.preferences.campaign_updates.label",
                          )}
                          description={t(
                            "sections.notifications.preferences.campaign_updates.description",
                          )}
                          disabled={updateNotificationPreferencesMutation.isPending}
                        />
                      )}
                    </notificationForm.Field>
                    <notificationForm.Field name="reviewReminders">
                      {(field) => (
                        <ValidatedCheckbox
                          field={field}
                          label={t(
                            "sections.notifications.preferences.review_reminders.label",
                          )}
                          description={t(
                            "sections.notifications.preferences.review_reminders.description",
                          )}
                          disabled={updateNotificationPreferencesMutation.isPending}
                        />
                      )}
                    </notificationForm.Field>
                    <notificationForm.Field name="socialNotifications">
                      {(field) => (
                        <ValidatedCheckbox
                          field={field}
                          label={t(
                            "sections.notifications.preferences.social_notifications.label",
                          )}
                          description={t(
                            "sections.notifications.preferences.social_notifications.description",
                          )}
                          disabled={updateNotificationPreferencesMutation.isPending}
                        />
                      )}
                    </notificationForm.Field>
                  </div>

                  {notificationError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        {t("sections.notifications.errors.save_failed")}
                      </AlertTitle>
                      <AlertDescription>{notificationError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="submit"
                      disabled={updateNotificationPreferencesMutation.isPending}
                      className="min-w-[160px]"
                    >
                      {updateNotificationPreferencesMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("sections.notifications.buttons.saving")}
                        </>
                      ) : (
                        t("sections.notifications.buttons.save")
                      )}
                    </Button>
                  </div>

                  {notificationFetching ? (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("sections.sessions.status.refreshing_preferences")}
                    </div>
                  ) : null}
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sections.sessions.title")}</CardTitle>
              <CardDescription>{t("sections.sessions.subtitle")}</CardDescription>
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
                  <AlertTitle>{t("sections.sessions.errors.load_failed")}</AlertTitle>
                  <AlertDescription>
                    {(sessionsError as Error).message ||
                      t("sections.sessions.errors.refresh_page")}
                  </AlertDescription>
                </Alert>
              ) : sessionsData ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t("sections.sessions.table_headers.device")}
                        </TableHead>
                        <TableHead>
                          {t("sections.sessions.table_headers.location")}
                        </TableHead>
                        <TableHead>
                          {t("sections.sessions.table_headers.last_active")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("sections.sessions.table_headers.actions")}
                        </TableHead>
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
                                  ? t("sections.sessions.this_device")
                                  : formatUserAgent(session.userAgent, t)}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {t("sections.sessions.session_id")}{" "}
                                {maskToken(session.token)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {session.ipAddress ?? t("sections.sessions.unknown_location")}
                          </TableCell>
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
                                {t("sections.sessions.current")}
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
                                {t("sections.sessions.actions.revoke")}
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
                      {t("sections.sessions.actions.revoke_all")}
                    </Button>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      {t("sections.sessions.only_current_session")}
                    </div>
                  )}

                  {sessionsFetching ? (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("sections.sessions.status.refreshing")}
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
              <CardTitle>{t("sections.account.status.title")}</CardTitle>
              <CardDescription>{t("sections.account.status.subtitle")}</CardDescription>
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
                  <AlertTitle>{t("errors.load_account")}</AlertTitle>
                  <AlertDescription>
                    {(accountError as Error).message || t("errors.refresh_page")}
                  </AlertDescription>
                </Alert>
              ) : accountOverview ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-muted-foreground text-sm font-medium">
                      {t("sections.account.fields.name")}
                    </div>
                    <div className="text-sm">{accountOverview.user.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm font-medium">
                      {t("sections.account.fields.email")}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{accountOverview.user.email}</span>
                      {accountOverview.user.emailVerified ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />{" "}
                          {t("sections.account.status_labels.verified")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-400 text-amber-700"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />{" "}
                          {t("sections.account.status_labels.not_verified")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm font-medium">
                      {t("sections.account.fields.password")}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>
                        {accountOverview.hasPassword
                          ? t("sections.account.status_labels.set")
                          : t("sections.account.status_labels.not_configured")}
                      </span>
                      {!accountOverview.hasPassword ? (
                        <Badge variant="outline" className="border-red-400 text-red-700">
                          {t("sections.account.status_labels.required")}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {accountFetching ? (
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("sections.sessions.status.refreshing_account")}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sections.account.connected_accounts.title")}</CardTitle>
              <CardDescription>
                {t("sections.account.connected_accounts.subtitle")}
              </CardDescription>
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
                            <div className="font-medium">
                              {t("sections.account.providers.email_password")}
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {accountOverview.hasPassword
                                ? t("sections.account.providers.signin_text")
                                : t("sections.account.providers.setup_text")}
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
                            {t("sections.account.buttons.update_password")}
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
                                {t("sections.account.status_labels.connected")}
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {t("sections.account.status_labels.not_connected")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {isLinked
                              ? t("sections.account.providers.connected.signin_text")
                              : t("sections.account.providers.connected.setup_text")}
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
                            {t("sections.account.buttons.disconnect")}
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
                                    toast.message(t("alerts.redirecting_to_provider"));
                                  },
                                  onError: (ctx: unknown) => {
                                    const errorContext =
                                      ctx && typeof ctx === "object" && "error" in ctx
                                        ? (ctx as { error?: { message?: string } })
                                        : undefined;
                                    const errorMessage =
                                      errorContext?.error?.message ||
                                      t("errors.connect_account");
                                    toast.error(errorMessage);
                                  },
                                },
                              )
                            }
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t("sections.account.buttons.connect")}
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
