import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedFileUpload } from "~/components/form-fields/ValidatedFileUpload";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedPhoneInput } from "~/components/form-fields/ValidatedPhoneInput";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { PublicLayout } from "~/features/layouts/public-layout";
import { useAppForm } from "~/lib/hooks/useAppForm";

export const Route = createFileRoute("/design-system")({
  component: DesignSystemPage,
});

function DesignSystemPage() {
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(
    null,
  );
  const form = useAppForm({
    defaultValues: {
      organization: "",
      contactEmail: "",
      contactPhone: "",
      teamLogo: null as File | null,
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmittedData({
        ...value,
        teamLogo: value.teamLogo instanceof File ? value.teamLogo.name : value.teamLogo,
      });
    },
  });

  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Component demo"
        title="Reusable form elements & loading states"
        subtitle="Preview the design system building blocks used across Quadball Canada user flows."
        backgroundImage="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80"
        ctaText="View source documentation"
        ctaLink="https://github.com/quadball-canada"
        secondaryCta={{
          text: "Return home",
          link: "/",
        }}
      />

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Club inquiry example
              </CardTitle>
              <p className="text-sm text-gray-600">
                This form uses the shared TanStack Form hook with validated inputs,
                formatted phone numbers, and a file upload preview.
              </p>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit();
                }}
              >
                <form.Field name="organization">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      label="Organization name"
                      placeholder="Vancouver Valkyries"
                      description="Used across event listings and billing."
                      required
                    />
                  )}
                </form.Field>

                <form.Field name="contactEmail">
                  {(field) => (
                    <ValidatedInput
                      field={field}
                      type="email"
                      label="Contact email"
                      placeholder="captain@quadball.ca"
                      required
                    />
                  )}
                </form.Field>

                <form.Field name="contactPhone">
                  {(field) => (
                    <ValidatedPhoneInput
                      field={field}
                      label="Contact phone"
                      description="Canadian format auto-applies for event communications"
                    />
                  )}
                </form.Field>

                <form.Field name="teamLogo">
                  {(field) => (
                    <ValidatedFileUpload
                      field={field}
                      label="Team logo"
                      description="PNG or SVG up to 5MB. Appears on standings, tickets, and schedules."
                      helperText="Optional but recommended"
                    />
                  )}
                </form.Field>

                <FormSubmitButton
                  className="w-full"
                  loadingText="Saving..."
                  isSubmitting={form.state.isSubmitting}
                >
                  Submit example data
                </FormSubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Live preview</CardTitle>
              <p className="text-sm text-gray-600">
                Submitted payload appears here—ideal for QA when wiring forms to server
                functions.
              </p>
            </CardHeader>
            <CardContent>
              {submittedData ? (
                <pre className="max-h-[360px] overflow-auto rounded-lg bg-white p-4 text-left text-xs text-gray-800 shadow-inner">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-3 text-sm text-gray-500">
                  <span>No submission yet</span>
                  <Button size="sm" variant="ghost" onClick={() => setSubmittedData({})}>
                    Populate sample data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
