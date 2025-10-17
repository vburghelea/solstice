import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import {
  clearPaymentParams,
  getPaymentErrorMessage,
  usePaymentReturn,
} from "~/features/membership/hooks/usePaymentReturn";
import {
  confirmMembershipPurchase,
  createCheckoutSession,
} from "~/features/membership/membership.mutations";
import {
  getUserMembershipStatus,
  listMembershipTypes,
} from "~/features/membership/membership.queries";
import { useMembershipTranslation } from "~/hooks/useTypedTranslation";
import { unwrapServerFnResult } from "~/lib/server/fn-utils";

export function MembershipPage() {
  const { t } = useMembershipTranslation();
  const [processingPayment, setProcessingPayment] = useState(false);
  const paymentReturn = usePaymentReturn();
  const [hasProcessedReturn, setHasProcessedReturn] = useState(false);

  const membershipStatusQuery = useQuery({
    queryKey: ["membership-status"],
    queryFn: async () => {
      const result = await getUserMembershipStatus();
      if (!result.success) {
        throw new Error(
          result.errors?.[0]?.message || t("errors.failed_to_fetch_membership_status"),
        );
      }
      return result.data || null;
    },
  });

  const { refetch: refetchMembershipStatus } = membershipStatusQuery;

  const membershipTypesQuery = useQuery({
    queryKey: ["membership-types"],
    queryFn: async () => {
      const result = await listMembershipTypes();
      if (!result.success) {
        throw new Error(
          result.errors?.[0]?.message || t("errors.failed_to_fetch_membership_types"),
        );
      }
      return result.data || [];
    },
  });

  const confirmPurchase = useCallback(
    async (sessionId: string, membershipTypeId: string, paymentId: string) => {
      setProcessingPayment(true);
      try {
        const result = await unwrapServerFnResult(
          confirmMembershipPurchase({
            data: {
              membershipTypeId,
              sessionId,
              paymentId,
            },
          }),
        );

        if (result.success) {
          toast.success(t("success.membership_purchased_successfully"));
          clearPaymentParams();
          await refetchMembershipStatus();
        } else {
          toast.error(
            result.errors?.[0]?.message || t("errors.failed_to_confirm_membership"),
          );
        }
      } catch (error) {
        console.error("Error confirming membership:", error);
        toast.error(t("errors.failed_to_confirm_membership_purchase"));
      } finally {
        setProcessingPayment(false);
      }
    },
    [refetchMembershipStatus, t],
  );

  const handleMockPaymentReturn = useCallback(
    async (sessionId: string, membershipTypeId: string) => {
      await confirmPurchase(sessionId, membershipTypeId, `mock_payment_${Date.now()}`);
    },
    [confirmPurchase],
  );

  // Process payment return if needed
  const processPaymentReturn = useCallback(async () => {
    if (hasProcessedReturn) return;

    // Handle mock checkout
    if (paymentReturn.isMockCheckout && paymentReturn.sessionId) {
      if (!paymentReturn.membershipTypeId) {
        setHasProcessedReturn(true);
        toast.error(t("errors.missing_membership_type_for_checkout"));
        clearPaymentParams();
        return;
      }

      setHasProcessedReturn(true);
      await handleMockPaymentReturn(
        paymentReturn.sessionId,
        paymentReturn.membershipTypeId || "",
      );
    }
    // Handle real Square success
    else if (paymentReturn.success && paymentReturn.paymentId) {
      if (!paymentReturn.sessionId || !paymentReturn.membershipTypeId) {
        setHasProcessedReturn(true);
        toast.error(t("errors.missing_checkout_information"));
        clearPaymentParams();
        return;
      }

      setHasProcessedReturn(true);
      await confirmPurchase(
        paymentReturn.sessionId,
        paymentReturn.membershipTypeId,
        paymentReturn.paymentId,
      );
    }
    // Handle errors
    else if (paymentReturn.error) {
      setHasProcessedReturn(true);
      const errorMessage = getPaymentErrorMessage(paymentReturn.error, t);
      if (errorMessage) toast.error(errorMessage);
      clearPaymentParams();
    }
  }, [hasProcessedReturn, paymentReturn, handleMockPaymentReturn, confirmPurchase, t]);

  // Process payment return using useEffect
  useEffect(() => {
    if (
      !hasProcessedReturn &&
      (paymentReturn.isMockCheckout || paymentReturn.success || paymentReturn.error) &&
      (paymentReturn.sessionId || paymentReturn.paymentId || paymentReturn.error)
    ) {
      processPaymentReturn();
    }
  }, [paymentReturn, hasProcessedReturn, processPaymentReturn]);

  const handlePurchase = async (membershipTypeId: string) => {
    try {
      const result = await unwrapServerFnResult(
        createCheckoutSession({
          data: { membershipTypeId },
        }),
      );
      if (result.success && result.data) {
        // Redirect to checkout URL
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(
          result.errors?.[0]?.message || t("errors.failed_to_create_checkout_session"),
        );
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error(t("errors.failed_to_create_checkout_session"));
    }
  };

  if (membershipStatusQuery.isLoading || membershipTypesQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (membershipStatusQuery.error || membershipTypesQuery.error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-foreground">{t("errors.error")}</CardTitle>
            <CardDescription>
              {membershipStatusQuery.error?.message ||
                membershipTypesQuery.error?.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const membershipStatus = membershipStatusQuery.data;
  const membershipTypes = membershipTypesQuery.data || [];

  if (processingPayment) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>{t("status.processing_payment")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 pb-28 lg:pb-8">
      <h1 className="text-foreground mb-8 text-3xl font-bold">{t("page.title")}</h1>
      <p className="text-muted-foreground mb-6">{t("page.subtitle")}</p>

      {/* Current Membership Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-foreground">{t("current_status.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {membershipStatus?.hasMembership ? (
            <div className="space-y-2">
              <p className="text-admin-status-active-text text-lg font-semibold">
                {t("current_status.active_membership")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("current_status.type", {
                  type: membershipStatus.currentMembership?.membershipType.name,
                })}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("current_status.expires", {
                  date: membershipStatus.currentMembership
                    ? new Date(
                        membershipStatus.currentMembership.endDate,
                      ).toLocaleDateString()
                    : t("status.not_available"),
                })}
              </p>
              {membershipStatus.daysRemaining != null &&
                membershipStatus.daysRemaining > 0 && (
                  <p className="text-muted-foreground text-sm">
                    {t("current_status.days_remaining", {
                      count: membershipStatus.daysRemaining,
                    })}
                  </p>
                )}
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold">
                {t("current_status.no_active_membership")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("current_status.join_today_message")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Memberships */}
      <div id="plans">
        <h2 className="mb-4 text-2xl font-bold">{t("available_plans.title")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {membershipTypes.map((type) => {
            const isCurrent =
              membershipStatus?.currentMembership?.membershipType.id === type.id;
            const canPurchase =
              !membershipStatus?.hasMembership ||
              (membershipStatus.daysRemaining ?? 0) <= 30;

            return (
              <Card key={type.id}>
                <CardHeader>
                  <CardTitle className="text-foreground">{type.name}</CardTitle>
                  <CardDescription>${(type.priceCents / 100).toFixed(2)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{type.description}</p>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      {t("buttons.current_plan")}
                    </Button>
                  ) : canPurchase ? (
                    <Button
                      className="w-full"
                      onClick={() => handlePurchase(type.id)}
                      disabled={processingPayment}
                    >
                      {membershipStatus?.hasMembership &&
                      (membershipStatus.daysRemaining ?? 0) <= 30
                        ? t("buttons.renew")
                        : t("buttons.purchase")}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled>
                      {t("buttons.not_available")}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
      {/* Sticky CTA on mobile to guide selection */}
      <div className="lg:hidden">
        {/* Show when there is at least one purchasable plan */}
        {membershipTypes.length > 0 && (
          <StickyActionBar>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="text-sm">{t("mobile_cta.choose_membership")}</div>
              <Button
                onClick={() => {
                  const el = document.getElementById("plans");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {t("mobile_cta.view_options")}
              </Button>
            </div>
          </StickyActionBar>
        )}
      </div>
    </div>
  );
}
