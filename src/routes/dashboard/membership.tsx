import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/dashboard/membership")({
  component: MembershipPage,
});

function MembershipPage() {
  const [processingPayment, setProcessingPayment] = useState(false);
  const paymentReturn = usePaymentReturn();
  const [hasProcessedReturn, setHasProcessedReturn] = useState(false);

  const membershipStatusQuery = useQuery({
    queryKey: ["membership-status"],
    queryFn: async () => {
      const result = await getUserMembershipStatus();
      if (!result.success) {
        throw new Error(
          result.errors?.[0]?.message || "Failed to fetch membership status",
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
          result.errors?.[0]?.message || "Failed to fetch membership types",
        );
      }
      return result.data || [];
    },
  });

  type ConfirmMembershipFn = (params: {
    data: { membershipTypeId: string; sessionId: string; paymentId: string };
  }) => Promise<{
    success: boolean;
    errors?: Array<{ code: string; message: string }>;
  }>;

  const confirmPurchase = useCallback(
    async (sessionId: string, membershipTypeId: string, paymentId: string) => {
      setProcessingPayment(true);
      try {
        const result = await (
          confirmMembershipPurchase as unknown as ConfirmMembershipFn
        )({
          data: {
            membershipTypeId,
            sessionId,
            paymentId,
          },
        });

        if (result.success) {
          toast.success("Membership purchased successfully!");
          clearPaymentParams();
          await refetchMembershipStatus();
        } else {
          toast.error(result.errors?.[0]?.message || "Failed to confirm membership");
        }
      } catch (error) {
        console.error("Error confirming membership:", error);
        toast.error("Failed to confirm membership purchase");
      } finally {
        setProcessingPayment(false);
      }
    },
    [refetchMembershipStatus],
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
        toast.error("Missing membership type for checkout session");
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
        toast.error("Missing checkout information. Please contact support.");
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
      const errorMessage = getPaymentErrorMessage(paymentReturn.error);
      if (errorMessage) toast.error(errorMessage);
      clearPaymentParams();
    }
  }, [hasProcessedReturn, paymentReturn, handleMockPaymentReturn, confirmPurchase]);

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
      const result = await createCheckoutSession({ data: { membershipTypeId } });
      if (result.success && result.data) {
        // Redirect to checkout URL
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.errors?.[0]?.message || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to create checkout session");
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
            <CardTitle>Error</CardTitle>
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
              <p>Processing your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Membership</h1>
      <p className="text-muted-foreground mb-6">
        Join Quadball Canada and access exclusive member benefits
      </p>

      {/* Current Membership Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          {membershipStatus?.hasMembership ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                Active Membership
              </p>
              <p className="text-muted-foreground text-sm">
                Type: {membershipStatus.currentMembership?.membershipType.name}
              </p>
              <p className="text-muted-foreground text-sm">
                Expires:{" "}
                {membershipStatus.currentMembership
                  ? new Date(
                      membershipStatus.currentMembership.endDate,
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
              {membershipStatus.daysRemaining != null &&
                membershipStatus.daysRemaining > 0 && (
                  <p className="text-muted-foreground text-sm">
                    Days Remaining: {membershipStatus.daysRemaining}
                  </p>
                )}
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold">No Active Membership</p>
              <p className="text-muted-foreground text-sm">
                Join today to participate in events and access member benefits
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Memberships */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Available Memberships</h2>
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
                  <CardTitle>{type.name}</CardTitle>
                  <CardDescription>${(type.priceCents / 100).toFixed(2)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{type.description}</p>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : canPurchase ? (
                    <Button
                      className="w-full"
                      onClick={() => handlePurchase(type.id)}
                      disabled={processingPayment}
                    >
                      {membershipStatus?.hasMembership &&
                      (membershipStatus.daysRemaining ?? 0) <= 30
                        ? "Renew"
                        : "Purchase"}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled>
                      Not Available
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
