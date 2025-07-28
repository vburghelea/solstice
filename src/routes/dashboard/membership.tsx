import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  confirmMembershipPurchase,
  createCheckoutSession,
} from "~/features/membership/membership.mutations";
import {
  getUserMembershipStatus,
  listMembershipTypes,
} from "~/features/membership/membership.queries";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";

export const Route = createFileRoute("/dashboard/membership")({
  component: MembershipPage,
});

function MembershipPage() {
  const [processingPayment, setProcessingPayment] = useState(false);

  // Check for payment return (both mock and real Square)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isMockCheckout = searchParams.get("mock_checkout") === "true";
    const sessionId = searchParams.get("session");
    const success = searchParams.get("success") === "true";
    const error = searchParams.get("error");
    const paymentId = searchParams.get("payment_id");

    // Handle mock checkout
    if (isMockCheckout && sessionId) {
      handleMockPaymentReturn(sessionId);
    }
    // Handle real Square success
    else if (success && paymentId) {
      toast.success("Membership purchased successfully!");
      // Remove query params
      window.history.replaceState({}, document.title, "/dashboard/membership");
      // Refetch membership status
      membershipStatusQuery.refetch();
    }
    // Handle errors
    else if (error) {
      const errorMessages: Record<string, string> = {
        cancelled: "Payment was cancelled",
        verification_failed: "Payment verification failed",
        processing_error: "An error occurred while processing your payment",
      };
      toast.error(errorMessages[error] || "Payment failed");
      // Remove query params
      window.history.replaceState({}, document.title, "/dashboard/membership");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMockPaymentReturn = async (sessionId: string) => {
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
          membershipTypeId: new URLSearchParams(window.location.search).get("type") || "",
          sessionId,
          paymentId: `mock_payment_${Date.now()}`,
        },
      });

      if (result.success) {
        toast.success("Membership purchased successfully!");
        // Remove query params
        window.history.replaceState({}, document.title, "/dashboard/membership");
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
      // @ts-expect-error - TanStack Start type inference issue
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

      {/* Current Membership Status */}
      {membershipStatus?.hasMembership && membershipStatus.currentMembership && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Active Membership</CardTitle>
            <CardDescription>
              {membershipStatus.currentMembership.membershipType.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Status: <span className="font-medium text-green-600">Active</span>
              </p>
              <p className="text-muted-foreground text-sm">
                Expires: {membershipStatus.expiresAt?.toLocaleDateString()}
              </p>
              <p className="text-muted-foreground text-sm">
                Days Remaining: {membershipStatus.daysRemaining} days
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Memberships */}
      <div className="mb-4">
        <h2 className="mb-4 text-2xl font-semibold">
          {membershipStatus?.hasMembership ? "Renew or Upgrade" : "Available Memberships"}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {membershipTypes?.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle>{type.name}</CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">
                  ${(type.priceCents / 100).toFixed(2)} CAD
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
                    ? "Upgrade/Renew"
                    : "Purchase"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
