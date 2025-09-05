import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { createEventSchema } from "~/features/events/events.schemas";
import { Label } from "~/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/ui/select";
import { Textarea } from "~/shared/ui/textarea";

type CreateEventInput = z.infer<typeof createEventSchema>;

interface EventFormProps {
  initialValues?: Partial<CreateEventInput>;
  onSubmit: (values: CreateEventInput) => Promise<void>;
  isSubmitting: boolean;
}

export function EventForm({ initialValues, onSubmit, isSubmitting }: EventFormProps) {
  const defaults = {
    name: initialValues?.name ?? "",
    slug: initialValues?.slug ?? "",
    type: (initialValues?.type as CreateEventInput["type"]) ?? "tournament",
    shortDescription: initialValues?.shortDescription ?? "",
    description: initialValues?.description ?? "",
    venueName: initialValues?.venueName ?? "",
    venueAddress: initialValues?.venueAddress ?? "",
    city: initialValues?.city ?? "",
    country: initialValues?.country ?? "",
    postalCode: initialValues?.postalCode ?? "",
    startDate: initialValues?.startDate ?? new Date().toISOString().split("T")[0],
    endDate:
      initialValues?.endDate ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    registrationType:
      (initialValues?.registrationType as CreateEventInput["registrationType"]) ?? "team",
    maxTeams: initialValues?.maxTeams,
    maxParticipants: initialValues?.maxParticipants,
    teamRegistrationFee: initialValues?.teamRegistrationFee ?? 0,
    individualRegistrationFee: initialValues?.individualRegistrationFee ?? 0,
    contactEmail: initialValues?.contactEmail ?? "",
    contactPhone: initialValues?.contactPhone ?? "",
  } as const;

  const form = useForm({
    defaultValues: defaults,
    onSubmit: async ({ value }) => {
      // Convert dollar inputs to cents for fee fields if strings were used
      const toInt = (v: unknown) =>
        typeof v === "string" ? Math.round(parseFloat(v) * 100) : (v as number);
      const payload: CreateEventInput = {
        ...value,
        // Ensure strings for dates (YYYY-MM-DD)
        startDate: value.startDate,
        endDate: value.endDate,
        // Fees in cents
        teamRegistrationFee:
          value.teamRegistrationFee !== undefined ? toInt(value.teamRegistrationFee) : 0,
        individualRegistrationFee:
          value.individualRegistrationFee !== undefined
            ? toInt(value.individualRegistrationFee)
            : 0,
      } as unknown as CreateEventInput;

      await onSubmit(payload);
    },
  });

  // Helpers
  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const renderFieldError = (meta: {
    errors: (string | unknown)[];
    isTouched: boolean;
  }) =>
    meta.isTouched && meta.errors.length > 0 ? (
      <p className="text-destructive mt-1 text-sm">
        {meta.errors.map((e) => (typeof e === "string" ? e : "Invalid value")).join(", ")}
      </p>
    ) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => {
            try {
              createEventSchema.shape.name.parse(value);
              return undefined;
            } catch (e) {
              return (e as z.ZodError).errors?.[0]?.message;
            }
          },
        }}
      >
        {(field) => (
          <div>
            <Label htmlFor={field.name}>Event Name</Label>
            <Input
              id={field.name}
              name={field.name}
              type="text"
              value={field.state.value}
              onBlur={() => {
                field.handleBlur();
                // If slug is empty, auto-generate
                const currentSlug = form.state.values.slug;
                if (!currentSlug) {
                  form.setFieldValue("slug", autoSlug(field.state.value as string));
                }
              }}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Awesome Summer Tournament"
            />
            {renderFieldError(field.state.meta)}
          </div>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field
          name="slug"
          validators={{
            onChange: ({ value }) => {
              try {
                createEventSchema.shape.slug.parse(value);
                return undefined;
              } catch (e) {
                return (e as z.ZodError).errors?.[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Slug</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="awesome-summer-tournament"
              />
              {renderFieldError(field.state.meta)}
            </div>
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Type</Label>
              <Select
                value={field.state.value as string}
                onValueChange={(val) =>
                  field.handleChange(val as CreateEventInput["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="league">League</SelectItem>
                  <SelectItem value="camp">Camp</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="startDate">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Start Date</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="endDate">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>End Date</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="registrationType">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Registration Type</Label>
              <Select
                value={field.state.value as string}
                onValueChange={(val) =>
                  field.handleChange(val as CreateEventInput["registrationType"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select registration type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <div className="col-span-1 grid gap-4 sm:col-span-1 sm:grid-cols-2">
          <form.Field name="maxTeams">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Max Teams</Label>
                <Input
                  id={field.name}
                  type="number"
                  inputMode="numeric"
                  value={(field.state.value as number | undefined) ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? parseInt(e.target.value, 10) : undefined,
                    )
                  }
                />
              </div>
            )}
          </form.Field>
          <form.Field name="maxParticipants">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Max Participants</Label>
                <Input
                  id={field.name}
                  type="number"
                  inputMode="numeric"
                  value={(field.state.value as number | undefined) ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? parseInt(e.target.value, 10) : undefined,
                    )
                  }
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="teamRegistrationFee">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Team Fee (USD)</Label>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                inputMode="decimal"
                value={
                  typeof field.state.value === "number"
                    ? (field.state.value as number) / 100
                    : 0
                }
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const v = e.target.value;
                  const cents = v === "" ? 0 : Math.round(parseFloat(v) * 100);
                  field.handleChange(Number.isFinite(cents) ? cents : 0);
                }}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="individualRegistrationFee">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Individual Fee (USD)</Label>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                inputMode="decimal"
                value={
                  typeof field.state.value === "number"
                    ? (field.state.value as number) / 100
                    : 0
                }
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const v = e.target.value;
                  const cents = v === "" ? 0 : Math.round(parseFloat(v) * 100);
                  field.handleChange(Number.isFinite(cents) ? cents : 0);
                }}
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="city">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>City</Label>
              <Input
                id={field.name}
                type="text"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="country">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Country</Label>
              <Input
                id={field.name}
                type="text"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="shortDescription">
        {(field) => (
          <div>
            <Label htmlFor={field.name}>Short Description</Label>
            <Input
              id={field.name}
              type="text"
              value={field.state.value as string}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="One-line summary for cards and previews"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div>
            <Label htmlFor={field.name}>Description</Label>
            <Textarea
              id={field.name}
              value={(field.state.value as string) ?? ""}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Share key details, schedule, and what to expect"
              rows={6}
            />
          </div>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="contactEmail">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Contact Email</Label>
              <Input
                id={field.name}
                type="email"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="contactPhone">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Contact Phone</Label>
              <Input
                id={field.name}
                type="tel"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
