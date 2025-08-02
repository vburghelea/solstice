import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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

  // Process payment return if needed
  const processPaymentReturn = async () => {
    if (hasProcessedReturn) return;

    // Handle mock checkout
    if (paymentReturn.isMockCheckout && paymentReturn.sessionId) {
      setHasProcessedReturn(true);
      await handleMockPaymentReturn(
        paymentReturn.sessionId,
        paymentReturn.membershipTypeId || "",
      );
    }
    // Handle real Square success
    else if (paymentReturn.success && paymentReturn.paymentId) {
      setHasProcessedReturn(true);
      toast.success("Membership purchased successfully!");
      clearPaymentParams();
      membershipStatusQuery.refetch();
    }
    // Handle errors
    else if (paymentReturn.error) {
      setHasProcessedReturn(true);
      const errorMessage = getPaymentErrorMessage(paymentReturn.error);
      if (errorMessage) toast.error(errorMessage);
      clearPaymentParams();
    }
  };

  const handleMockPaymentReturn = async (sessionId: string, membershipTypeId: string) => {
    setProcessingPayment(true);
    try {
      const result = await (
        confirmMembershipPurchase as unknown as (params: {
          data: { membershipTypeId: string; sessionId: string; paymentId: string };
        }) => Promise<{
          success: boolean;
          errors?: Array<{ code: string; message: string }>;
        }>
      )({
        data: {
          membershipTypeId,
          sessionId,
          paymentId: `mock_payment_${Date.now()}`,
        },
      });

      if (result.success) {
        toast.success("Membership purchased successfully!");
        clearPaymentParams();
        // Refetch membership status
        membershipStatusQuery.refetch();
      } else {
        toast.error(result.errors?.[0]?.message || "Failed to confirm membership");
      }
    } catch (error) {
      console.error("Error confirming membership:", error);
      toast.error("Failed to confirm membership purchase");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Process payment return before queries run
  if (
    !hasProcessedReturn &&
    (paymentReturn.sessionId || paymentReturn.success || paymentReturn.error)
  ) {
    processPaymentReturn();
  }

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
  const membershipTypes = membershipTypesQuery.data;

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
          {membershipStatus?.hasMembership && membershipStatus.currentMembership ? (
            <CardDescription>
              {membershipStatus.currentMembership.membershipType.name}
            </CardDescription>
          ) : (
            <CardDescription>No Active Membership</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {membershipStatus?.hasMembership && membershipStatus.currentMembership ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Status:{" "}
                <span className="font-medium text-green-600">Active Membership</span>
              </p>
              <p className="text-muted-foreground text-sm">
                Expires: {membershipStatus.expiresAt?.toLocaleDateString()}
              </p>
              <p className="text-muted-foreground text-sm">
                Days Remaining: {membershipStatus.daysRemaining} days
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Join today to participate in events and access member benefits
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Memberships */}
      <div className="mb-4">
        <h2 className="mb-4 text-2xl font-semibold">Available Memberships</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {membershipTypes?.map((type) => (
          <Card key={type.id} data-testid={`membership-card-${type.id}`}>
            <CardHeader>
              <CardTitle>{type.name}</CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">
                  ${(type.priceCents / 100).toFixed(2)}
                </p>
                <p className="text-muted-foreground text-sm">
                  Duration: {type.durationMonths} months
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handlePurchase(type.id)}
                className="w-full"
                disabled={
                  membershipStatus?.hasMembership &&
                  membershipStatus.currentMembership?.membershipTypeId === type.id
                }
              >
                {membershipStatus?.hasMembership &&
                membershipStatus.currentMembership?.membershipTypeId === type.id
                  ? "Current Plan"
                  : membershipStatus?.hasMembership
                    ? "Renew"
                    : "Purchase"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
