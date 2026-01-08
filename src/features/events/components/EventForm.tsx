import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { ValidatedCountryCombobox } from "~/components/form-fields/ValidatedCountryCombobox";
import { ValidatedPhoneInput } from "~/components/form-fields/ValidatedPhoneInput";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { baseCreateEventSchema } from "~/db/schema/events.schema";
import { createEventSchema } from "~/features/events/events.schemas";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

type CreateEventInput = z.infer<typeof createEventSchema>;

interface EventFormProps {
  initialValues?: Partial<CreateEventInput>;
  onSubmit: (values: CreateEventInput) => Promise<void>;
  isSubmitting: boolean;
}

function getDateInputString(daysFromToday: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split("T")[0];
}

function getNextDayString(dateString: string) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split("T")[0];
}

export function EventForm({ initialValues, onSubmit, isSubmitting }: EventFormProps) {
  const { t } = useEventsTranslation();
  const computedStartDate = initialValues?.startDate ?? getDateInputString(7);
  const computedEndDate = initialValues?.endDate ?? getNextDayString(computedStartDate);
  const defaults = {
    name: initialValues?.name ?? "",
    slug: initialValues?.slug ?? "",
    type: (initialValues?.type as CreateEventInput["type"]) ?? "tournament",
    shortDescription: initialValues?.shortDescription ?? "",
    description: initialValues?.description ?? "",
    venueName: initialValues?.venueName ?? "",
    venueAddress: initialValues?.venueAddress ?? "",
    city: initialValues?.city ?? "Berlin",
    province: initialValues?.province ?? "",
    country: initialValues?.country ?? "Germany",
    postalCode: initialValues?.postalCode ?? "10115",
    startDate: computedStartDate,
    endDate: computedEndDate,
    registrationType:
      (initialValues?.registrationType as CreateEventInput["registrationType"]) ?? "team",
    maxTeams: initialValues?.maxTeams,
    maxParticipants: initialValues?.maxParticipants,
    teamRegistrationFee: initialValues?.teamRegistrationFee ?? 0,
    individualRegistrationFee: initialValues?.individualRegistrationFee ?? 0,
    contactEmail: initialValues?.contactEmail ?? "",
    contactPhone: initialValues?.contactPhone ?? "+4915123456789",
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
        province: value.province ? value.province : undefined,
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
        {meta.errors
          .map((e) => (typeof e === "string" ? e : t("validation.invalid_value")))
          .join(", ")}
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
              baseCreateEventSchema.shape.name.parse(value);
              return undefined;
            } catch (e) {
              return (e as z.ZodError).issues?.[0]?.message;
            }
          },
        }}
      >
        {(field) => (
          <div>
            <Label htmlFor={field.name}>{t("form.fields.name")}</Label>
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
              placeholder={t("form.placeholders.name")}
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
                baseCreateEventSchema.shape.slug.parse(value);
                return undefined;
              } catch (e) {
                return (e as z.ZodError).issues?.[0]?.message;
              }
            },
          }}
        >
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("form.fields.slug")}</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("form.placeholders.slug")}
              />
              {renderFieldError(field.state.meta)}
            </div>
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("form.fields.type")}</Label>
              <Select
                value={field.state.value as string}
                onValueChange={(val: string) =>
                  field.handleChange(val as CreateEventInput["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select.select_type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tournament">{t("types.tournament")}</SelectItem>
                  <SelectItem value="league">{t("types.league")}</SelectItem>
                  <SelectItem value="camp">{t("types.camp")}</SelectItem>
                  <SelectItem value="clinic">{t("types.clinic")}</SelectItem>
                  <SelectItem value="social">{t("types.social")}</SelectItem>
                  <SelectItem value="other">{t("types.other")}</SelectItem>
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
              <Label htmlFor={field.name}>{t("form.fields.start_date")}</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const value = e.target.value;
                  field.handleChange(value);
                  if (!value) {
                    return;
                  }
                  const nextDay = getNextDayString(value);
                  const currentEnd = form.state.values.endDate as string | undefined;
                  if (!currentEnd || currentEnd < value) {
                    form.setFieldValue("endDate", nextDay);
                  }
                }}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="endDate">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("form.fields.end_date")}</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                {...(form.state.values.startDate
                  ? { min: form.state.values.startDate as string }
                  : {})}
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
              <Label htmlFor={field.name}>{t("form.fields.registration_type")}</Label>
              <Select
                value={field.state.value as string}
                onValueChange={(val: string) =>
                  field.handleChange(val as CreateEventInput["registrationType"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select.select_registration_type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">{t("registration_types.team")}</SelectItem>
                  <SelectItem value="individual">
                    {t("registration_types.individual")}
                  </SelectItem>
                  <SelectItem value="both">{t("registration_types.both")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <div className="col-span-1 grid gap-4 sm:col-span-1 sm:grid-cols-2">
          <form.Field name="maxTeams">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("form.fields.max_teams")}</Label>
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
                <Label htmlFor={field.name}>{t("form.fields.max_participants")}</Label>
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
              <Label htmlFor={field.name}>{t("form.fields.team_fee")}</Label>
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
              <Label htmlFor={field.name}>{t("form.fields.individual_fee")}</Label>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <form.Field name="city">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("form.fields.city")}</Label>
              <Input
                id={field.name}
                type="text"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("form.placeholders.city")}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="province">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("form.fields.province")}</Label>
              <Input
                id={field.name}
                type="text"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="country">
          {(field) => (
            <ValidatedCountryCombobox
              field={field}
              label={t("form.fields.country")}
              placeholder={t("form.placeholders.country")}
              valueFormat="label"
            />
          )}
        </form.Field>
      </div>

      <form.Field name="shortDescription">
        {(field) => (
          <div>
            <Label htmlFor={field.name}>{t("form.fields.short_description")}</Label>
            <Input
              id={field.name}
              type="text"
              value={field.state.value as string}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("form.placeholders.short_description_card")}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div>
            <Label htmlFor={field.name}>{t("form.fields.description")}</Label>
            <Textarea
              id={field.name}
              value={(field.state.value as string) ?? ""}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("form.placeholders.description_details")}
              rows={6}
            />
          </div>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="contactEmail">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>{t("form.fields.contact_email")}</Label>
              <Input
                id={field.name}
                type="email"
                value={field.state.value as string}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("form.placeholders.contact_email")}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="contactPhone">
          {(field) => (
            <ValidatedPhoneInput
              field={field}
              label={t("form.fields.contact_phone")}
              placeholder={t("form.placeholders.contact_phone")}
            />
          )}
        </form.Field>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("buttons.creating") : t("buttons.create")}
        </Button>
      </div>
    </form>
  );
}
