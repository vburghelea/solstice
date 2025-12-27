import type { AnyFieldApi } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedCheckbox } from "~/components/form-fields/ValidatedCheckbox";
import { ValidatedDatePicker } from "~/components/form-fields/ValidatedDatePicker";
import { ValidatedFileUpload } from "~/components/form-fields/ValidatedFileUpload";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedPhoneInput } from "~/components/form-fields/ValidatedPhoneInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { listOrganizations } from "~/features/organizations/organizations.queries";
import type { FieldComponentProps } from "~/lib/form";
import { useAppForm } from "~/lib/hooks/useAppForm";
import type { JsonRecord, JsonValue } from "~/shared/lib/json";
import {
  createForm,
  createFormUpload,
  publishForm,
  reviewFormSubmission,
  submitForm,
  updateForm,
} from "../forms.mutations";
import {
  getLatestFormVersion,
  getSubmissionFileDownloadUrl,
  listFormSubmissionVersions,
  listFormSubmissions,
  listForms,
  listSubmissionFiles,
} from "../forms.queries";
import type { FormDefinition } from "../forms.schemas";

const fieldTypeOptions = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "multiselect", label: "Multi-select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File" },
  { value: "textarea", label: "Textarea" },
  { value: "rich_text", label: "Rich text" },
];

const validationTypes = [
  { value: "", label: "None" },
  { value: "min_length", label: "Min length" },
  { value: "max_length", label: "Max length" },
  { value: "pattern", label: "Regex pattern" },
  { value: "min", label: "Min value" },
  { value: "max", label: "Max value" },
];

const conditionalOperators = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater than" },
];

const reviewStatusOptions = [
  { value: "under_review", label: "Under review" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const formatPayloadValue = (value: JsonValue) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
};

type FormValues = Record<string, JsonValue>;

type FieldDraft = {
  key: string;
  label: string;
  type: string;
  description: string;
  placeholder: string;
  required: boolean;
  optionsText: string;
  validationType: string;
  validationValue: string;
  validationMessage: string;
  conditionalField: string;
  conditionalOperator: string;
  conditionalValue: string;
  fileTypes: string;
  maxSizeMb: string;
  maxFiles: string;
};

type ValidationRuleType = NonNullable<
  FormDefinition["fields"][number]["validation"]
>[number]["type"];

type ConditionalOperator = NonNullable<
  FormDefinition["fields"][number]["conditional"]
>["operator"];

const emptyFieldDraft: FieldDraft = {
  key: "",
  label: "",
  type: "text",
  description: "",
  placeholder: "",
  required: false,
  optionsText: "",
  validationType: "",
  validationValue: "",
  validationMessage: "",
  conditionalField: "",
  conditionalOperator: "equals",
  conditionalValue: "",
  fileTypes: "",
  maxSizeMb: "5",
  maxFiles: "1",
};

const defaultSettings: FormDefinition["settings"] = {
  allowDraft: true,
  requireApproval: false,
  notifyOnSubmit: [],
};

const hashFile = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

function TextareaField({ field, label, placeholder }: FieldComponentProps) {
  const inputId = `${field.name}-textarea`;
  const meta = field.state.meta;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Textarea
        id={inputId}
        value={(field.state.value as string | undefined) ?? ""}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={meta.errors.length > 0}
      />
      {meta.isTouched && meta.errors.length > 0 && (
        <div className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
}

function MultiSelectField({
  field,
  label,
  options,
}: FieldComponentProps & {
  options: Array<{ value: string; label: string }>;
}) {
  const meta = field.state.meta;
  const selected = Array.isArray(field.state.value)
    ? (field.state.value as string[])
    : [];

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      field.handleChange(selected.filter((item) => item !== value));
    } else {
      field.handleChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              id={`${field.name}-${option.value}`}
              checked={selected.includes(option.value)}
              onCheckedChange={() => toggle(option.value)}
            />
            <Label htmlFor={`${field.name}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </div>
      {meta.isTouched && meta.errors.length > 0 && (
        <div className="text-destructive text-sm font-medium">
          {meta.errors.join(", ")}
        </div>
      )}
    </div>
  );
}

function evaluateCondition(
  condition: NonNullable<FormDefinition["fields"][number]["conditional"]>,
  values: Record<string, JsonValue>,
) {
  const left = values[condition.field];
  const right = condition.value;

  if (condition.operator === "equals") {
    return left === right;
  }

  if (condition.operator === "not_equals") {
    return left !== right;
  }

  if (condition.operator === "contains") {
    if (Array.isArray(left)) {
      return left.includes(right as never);
    }
    if (typeof left === "string") {
      return left.includes(String(right));
    }
    return false;
  }

  if (condition.operator === "greater_than") {
    return Number(left) > Number(right);
  }

  return true;
}

function buildDefaultValues(definition: FormDefinition) {
  const values: Record<string, JsonValue> = {};
  definition.fields.forEach((field) => {
    if (field.type === "checkbox") {
      values[field.key] = false;
      return;
    }
    if (field.type === "multiselect") {
      values[field.key] = [];
      return;
    }
    if (field.type === "file") {
      values[field.key] = null;
      return;
    }
    values[field.key] = "";
  });
  return values;
}

async function normalizePayload(
  definition: FormDefinition,
  values: Record<string, JsonValue>,
  formId: string,
) {
  const payload: JsonRecord = {};

  definition.fields.forEach((field) => {
    if (field.conditional && !evaluateCondition(field.conditional, values)) {
      return;
    }

    const value = values[field.key];

    if (field.type === "number") {
      payload[field.key] = value === "" ? null : Number(value);
      return;
    }

    if (field.type === "file") {
      payload[field.key] = value ?? null;
      return;
    }

    payload[field.key] = value ?? null;
  });

  for (const field of definition.fields) {
    if (field.type !== "file") continue;
    if (field.conditional && !evaluateCondition(field.conditional, values)) {
      continue;
    }

    const value = values[field.key];
    if (!(value instanceof File)) {
      if (value) {
        payload[field.key] = value;
      }
      continue;
    }

    const checksum = await hashFile(value);
    const upload = await createFormUpload({
      data: {
        formId,
        fieldKey: field.key,
        fileName: value.name,
        mimeType: value.type || "application/octet-stream",
        sizeBytes: value.size,
      },
    });

    if (!upload?.uploadUrl || !upload.storageKey) {
      throw new Error("Upload URL not available.");
    }

    const response = await fetch(upload.uploadUrl, {
      method: "PUT",
      body: value,
      headers: {
        "Content-Type": value.type || "application/octet-stream",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload file.");
    }

    payload[field.key] = {
      storageKey: upload.storageKey,
      fileName: value.name,
      mimeType: value.type || "application/octet-stream",
      sizeBytes: value.size,
      checksum,
    };
  }

  return payload;
}

export function DynamicFormRenderer(props: {
  formId: string;
  organizationId: string | null;
  definition: FormDefinition;
}) {
  const { formId, organizationId, definition } = props;
  const [submitMode, setSubmitMode] = useState<"draft" | "submitted">("submitted");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo(() => buildDefaultValues(definition), [definition]);

  const form = useAppForm<Record<string, unknown>>({
    defaultValues: defaultValues as Record<string, unknown>,
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      if (!organizationId) {
        setSubmitError("Organization is required to submit this form.");
        return;
      }

      try {
        const payload = await normalizePayload(definition, value as FormValues, formId);
        const result = await submitForm({
          data: {
            formId,
            organizationId,
            payload,
            status: submitMode,
          },
        });
        if (result && "error" in result && result.error) {
          setSubmitError(result.error);
        }
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Failed to submit form.");
      }
    },
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      {definition.fields.map((field) => {
        const options = field.options ?? [];
        return (
          <form.Field
            key={field.key}
            name={field.key}
            validators={{
              onChangeListenTo: field.conditional ? [field.conditional.field] : [],
              onChange: ({
                value,
                fieldApi,
              }: {
                value: unknown;
                fieldApi: AnyFieldApi;
              }) => {
                const values = fieldApi.form.state.values as Record<string, JsonValue>;
                if (field.conditional) {
                  const isVisible = evaluateCondition(field.conditional, values);
                  if (!isVisible) return undefined;
                }

                const isEmpty =
                  value === null ||
                  value === undefined ||
                  (typeof value === "string" && value.trim() === "") ||
                  (Array.isArray(value) && value.length === 0);

                if (field.required && isEmpty) {
                  return "This field is required";
                }

                if (field.validation && !isEmpty) {
                  for (const rule of field.validation) {
                    if (rule.type === "min_length" && typeof value === "string") {
                      if (value.length < Number(rule.value)) return rule.message;
                    }
                    if (rule.type === "max_length" && typeof value === "string") {
                      if (value.length > Number(rule.value)) return rule.message;
                    }
                    if (rule.type === "min" && typeof value === "number") {
                      if (value < Number(rule.value)) return rule.message;
                    }
                    if (rule.type === "max" && typeof value === "number") {
                      if (value > Number(rule.value)) return rule.message;
                    }
                    if (rule.type === "pattern" && typeof value === "string") {
                      const regex = new RegExp(String(rule.value));
                      if (!regex.test(value)) return rule.message;
                    }
                  }
                }

                return undefined;
              },
            }}
          >
            {(fieldApi: AnyFieldApi) => {
              const values = fieldApi.form.state.values as Record<string, JsonValue>;
              if (field.conditional && !evaluateCondition(field.conditional, values)) {
                return null;
              }

              if (field.type === "checkbox") {
                const descriptionProps = field.description
                  ? { description: field.description }
                  : {};
                return (
                  <ValidatedCheckbox
                    field={fieldApi}
                    label={field.label}
                    {...descriptionProps}
                  />
                );
              }

              if (field.type === "date") {
                return <ValidatedDatePicker field={fieldApi} label={field.label} />;
              }

              if (field.type === "phone") {
                return <ValidatedPhoneInput field={fieldApi} label={field.label} />;
              }

              if (field.type === "file") {
                const accept = field.fileConfig?.allowedTypes?.join(",");
                const maxSizeMb = field.fileConfig?.maxSizeBytes
                  ? field.fileConfig.maxSizeBytes / (1024 * 1024)
                  : undefined;
                return (
                  <ValidatedFileUpload
                    field={fieldApi}
                    label={field.label}
                    {...(accept ? { accept } : {})}
                    {...(maxSizeMb ? { maxSizeMb } : {})}
                  />
                );
              }

              if (field.type === "select") {
                const placeholderText = field.placeholder
                  ? { placeholderText: field.placeholder }
                  : {};
                return (
                  <ValidatedSelect
                    field={fieldApi}
                    label={field.label}
                    options={options}
                    {...placeholderText}
                  />
                );
              }

              if (field.type === "multiselect") {
                return (
                  <MultiSelectField
                    field={fieldApi}
                    label={field.label}
                    options={options}
                  />
                );
              }

              if (field.type === "textarea" || field.type === "rich_text") {
                const placeholderProps = field.placeholder
                  ? { placeholder: field.placeholder }
                  : {};
                return (
                  <TextareaField
                    field={fieldApi}
                    label={field.label}
                    {...placeholderProps}
                  />
                );
              }

              if (field.type === "number") {
                const placeholderProps = field.placeholder
                  ? { placeholder: field.placeholder }
                  : {};
                return (
                  <ValidatedInput
                    field={fieldApi}
                    label={field.label}
                    type="number"
                    {...placeholderProps}
                    onValueChange={(value) =>
                      fieldApi.handleChange(value === "" ? "" : Number(value))
                    }
                  />
                );
              }

              const placeholderProps = field.placeholder
                ? { placeholder: field.placeholder }
                : {};
              return (
                <ValidatedInput
                  field={fieldApi}
                  label={field.label}
                  type={field.type === "email" ? "email" : "text"}
                  {...placeholderProps}
                />
              );
            }}
          </form.Field>
        );
      })}

      <div className="flex flex-wrap gap-3">
        {definition.settings.allowDraft && (
          <FormSubmitButton
            type="button"
            variant="outline"
            onClick={() => {
              setSubmitMode("draft");
              void form.handleSubmit();
            }}
          >
            Save draft
          </FormSubmitButton>
        )}
        <FormSubmitButton
          onClick={() => setSubmitMode("submitted")}
          isSubmitting={form.state.isSubmitting}
        >
          Submit
        </FormSubmitButton>
      </div>
      {submitError ? (
        <p className="text-destructive text-sm font-medium">{submitError}</p>
      ) : null}
    </form>
  );
}

export function FormBuilderShell() {
  const queryClient = useQueryClient();
  const [slugDirty, setSlugDirty] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [settings, setSettings] = useState<FormDefinition["settings"]>(defaultSettings);
  const [fields, setFields] = useState<FormDefinition["fields"]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations", "list"],
    queryFn: () => listOrganizations({ data: { includeArchived: true } }),
  });

  const { data: forms = [] } = useQuery({
    queryKey: ["forms", "list"],
    queryFn: () => listForms({ data: {} }),
  });

  const { data: latestVersion } = useQuery({
    queryKey: ["forms", "latest", selectedFormId],
    queryFn: () =>
      selectedFormId ? getLatestFormVersion({ data: { formId: selectedFormId } }) : null,
    enabled: Boolean(selectedFormId),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["forms", "submissions", selectedFormId],
    queryFn: () =>
      selectedFormId ? listFormSubmissions({ data: { formId: selectedFormId } }) : [],
    enabled: Boolean(selectedFormId),
  });

  const { data: submissionVersions = [] } = useQuery({
    queryKey: ["forms", "submission-versions", selectedSubmissionId],
    queryFn: () =>
      selectedSubmissionId
        ? listFormSubmissionVersions({ data: { submissionId: selectedSubmissionId } })
        : [],
    enabled: Boolean(selectedSubmissionId),
  });

  const { data: submissionFiles = [] } = useQuery({
    queryKey: ["forms", "submission-files", selectedSubmissionId],
    queryFn: () =>
      selectedSubmissionId
        ? listSubmissionFiles({ data: { submissionId: selectedSubmissionId } })
        : [],
    enabled: Boolean(selectedSubmissionId),
  });

  const selectedSubmission = useMemo(
    () =>
      submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [submissions, selectedSubmissionId],
  );

  const submissionPayloadEntries = useMemo(() => {
    if (!selectedSubmission?.payload) return [];
    return Object.entries(selectedSubmission.payload as Record<string, JsonValue>);
  }, [selectedSubmission]);

  const downloadMutation = useMutation({
    mutationFn: (submissionFileId: string) =>
      getSubmissionFileDownloadUrl({ data: { submissionFileId } }),
    onSuccess: (result) => {
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      submissionId: string;
      status: string;
      reviewNotes?: string;
    }) =>
      reviewFormSubmission({
        data: {
          submissionId: payload.submissionId,
          status: payload.status as
            | "under_review"
            | "changes_requested"
            | "approved"
            | "rejected",
          reviewNotes: payload.reviewNotes,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forms", "submissions"] });
      void queryClient.invalidateQueries({ queryKey: ["forms", "submission-versions"] });
    },
  });

  useEffect(() => {
    if (!latestVersion?.definition) return;
    const definition = latestVersion.definition as FormDefinition;
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setFields(definition.fields ?? []);
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setSettings(definition.settings ?? defaultSettings);
  }, [latestVersion]);

  const createMutation = useMutation({
    mutationFn: async (values: {
      name: string;
      slug: string;
      description?: string;
      organizationId?: string;
    }) =>
      createForm({
        data: {
          name: values.name,
          slug: values.slug,
          description: values.description,
          organizationId: values.organizationId || undefined,
        },
      }),
    onSuccess: (created) => {
      if (created?.id) {
        setSelectedFormId(created.id);
        setFields([]);
        setSettings(defaultSettings);
        setSelectedFieldKey(null);
        setFieldError(null);
        void queryClient.invalidateQueries({ queryKey: ["forms"] });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { formId: string; data: { name?: string; slug?: string } }) =>
      updateForm({ data: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFormId) return null;
      const definition: FormDefinition = {
        fields,
        settings,
      };
      return publishForm({ data: { formId: selectedFormId, definition } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["forms"] });
      void queryClient.invalidateQueries({ queryKey: ["forms", "latest"] });
    },
  });

  const createFormForm = useAppForm({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      organizationId: "",
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value);
    },
  });

  const fieldForm = useAppForm<FieldDraft>({
    defaultValues: emptyFieldDraft,
    onSubmit: async ({ value }) => {
      setFieldError(null);
      const trimmedKey = value.key.trim();
      if (!trimmedKey) {
        setFieldError("Field key is required.");
        return;
      }

      const existing = fields.find((field) => field.key === trimmedKey);
      if (existing && selectedFieldKey !== trimmedKey) {
        setFieldError("Field key must be unique.");
        return;
      }

      const options = value.optionsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({ value: item, label: item }));

      const validation = value.validationType
        ? [
            {
              type: value.validationType as ValidationRuleType,
              value: value.validationValue,
              message: value.validationMessage || "Invalid value",
            },
          ]
        : undefined;

      const conditional = value.conditionalField
        ? {
            field: value.conditionalField,
            operator: value.conditionalOperator as ConditionalOperator,
            value: value.conditionalValue,
          }
        : undefined;

      const fileConfig = value.fileTypes
        ? {
            allowedTypes: value.fileTypes
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            maxSizeBytes: Math.max(1, Number(value.maxSizeMb || 5)) * 1024 * 1024,
            maxFiles: Math.max(1, Number(value.maxFiles || 1)),
          }
        : undefined;

      const nextField: FormDefinition["fields"][number] = {
        key: trimmedKey,
        type: value.type as FormDefinition["fields"][number]["type"],
        label: value.label,
        description: value.description || undefined,
        placeholder: value.placeholder || undefined,
        required: value.required,
        ...(validation ? { validation } : {}),
        ...(options.length ? { options } : {}),
        ...(conditional ? { conditional } : {}),
        ...(fileConfig ? { fileConfig } : {}),
      };

      setFields((prev) => {
        const without = prev.filter((field) => field.key !== trimmedKey);
        return [...without, nextField];
      });

      fieldForm.reset(emptyFieldDraft);
      setSelectedFieldKey(null);
    },
  });

  const reviewForm = useAppForm({
    defaultValues: {
      status: "under_review",
      reviewNotes: "",
    },
    onSubmit: async ({ value }) => {
      if (!selectedSubmissionId) return;
      const payload: { submissionId: string; status: string; reviewNotes?: string } = {
        submissionId: selectedSubmissionId,
        status: value.status,
      };
      if (value.reviewNotes.trim()) {
        payload.reviewNotes = value.reviewNotes.trim();
      }
      await reviewMutation.mutateAsync(payload);
    },
  });

  const prefillFieldDraft = (type: string) => {
    const label = fieldTypeOptions.find((option) => option.value === type)?.label ?? type;
    const keyBase = slugify(label).replace(/-/g, "_");
    setFieldError(null);
    setSelectedFieldKey(null);
    fieldForm.reset({
      ...emptyFieldDraft,
      type,
      label,
      key: keyBase,
    });
  };

  useEffect(() => {
    if (!selectedFieldKey) {
      fieldForm.reset(emptyFieldDraft);
      return;
    }
    const selected = fields.find((field) => field.key === selectedFieldKey);
    if (!selected) return;

    const draft: FieldDraft = {
      key: selected.key,
      label: selected.label,
      type: selected.type,
      description: selected.description ?? "",
      placeholder: selected.placeholder ?? "",
      required: selected.required,
      optionsText: selected.options?.map((item) => item.value).join(", ") ?? "",
      validationType: selected.validation?.[0]?.type ?? "",
      validationValue: selected.validation?.[0]?.value?.toString() ?? "",
      validationMessage: selected.validation?.[0]?.message ?? "",
      conditionalField: selected.conditional?.field ?? "",
      conditionalOperator: selected.conditional?.operator ?? "equals",
      conditionalValue: selected.conditional?.value?.toString() ?? "",
      fileTypes: selected.fileConfig?.allowedTypes?.join(", ") ?? "",
      maxSizeMb: selected.fileConfig?.maxSizeBytes
        ? String(Math.round(selected.fileConfig.maxSizeBytes / (1024 * 1024)))
        : "5",
      maxFiles: selected.fileConfig?.maxFiles?.toString() ?? "1",
    };

    fieldForm.reset(draft);
  }, [fieldForm, fields, selectedFieldKey]);

  useEffect(() => {
    if (!selectedSubmission) {
      reviewForm.reset({ status: "under_review", reviewNotes: "" });
      return;
    }

    const normalizedStatus = reviewStatusOptions.some(
      (option) => option.value === selectedSubmission.status,
    )
      ? selectedSubmission.status
      : "under_review";

    reviewForm.reset({
      status: normalizedStatus,
      reviewNotes: selectedSubmission.reviewNotes ?? "",
    });
  }, [reviewForm, selectedSubmission]);

  const definition = useMemo<FormDefinition>(
    () => ({
      fields,
      settings,
    }),
    [fields, settings],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createFormForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <createFormForm.Field
                name="name"
                validators={{
                  onChange: ({ value }) => (!value ? "Name is required" : undefined),
                }}
              >
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label="Form name"
                    placeholder="Annual report"
                    onValueChange={(value) => {
                      field.handleChange(value);
                      if (!slugDirty) {
                        createFormForm.setFieldValue("slug", slugify(value));
                      }
                    }}
                  />
                )}
              </createFormForm.Field>
              <createFormForm.Field
                name="slug"
                validators={{
                  onChange: ({ value }) => (!value ? "Slug is required" : undefined),
                }}
              >
                {(field) => (
                  <ValidatedInput
                    field={field}
                    label="Slug"
                    placeholder="annual-report"
                    onValueChange={(value) => {
                      setSlugDirty(true);
                      field.handleChange(value);
                    }}
                  />
                )}
              </createFormForm.Field>
            </div>
            <createFormForm.Field name="description">
              {(field) => (
                <TextareaField
                  field={field}
                  label="Description"
                  placeholder="Short summary for admins"
                />
              )}
            </createFormForm.Field>
            <createFormForm.Field name="organizationId">
              {(field) => (
                <ValidatedSelect
                  field={field}
                  label="Organization"
                  options={organizations.map((org) => ({
                    value: org.id,
                    label: org.name,
                  }))}
                  placeholderText="Optional"
                />
              )}
            </createFormForm.Field>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create form"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing forms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {forms.length === 0 ? (
            <p className="text-muted-foreground text-sm">No forms yet.</p>
          ) : (
            forms.map((form) => (
              <Button
                key={form.id}
                type="button"
                variant="outline"
                className={`h-auto w-full items-start justify-between gap-4 px-3 py-2 text-left whitespace-normal ${
                  selectedFormId === form.id
                    ? "border-primary bg-primary/10"
                    : "border-input"
                }`}
                onClick={() => {
                  setSelectedFormId(form.id);
                  setSelectedFieldKey(null);
                  setSelectedSubmissionId(null);
                }}
              >
                <div>
                  <p className="font-semibold">{form.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {form.slug} · {form.status}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">
                  {form.organizationId ? "Org" : "Global"}
                </span>
              </Button>
            ))
          )}
        </CardContent>
      </Card>

      {selectedFormId ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Field palette</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {fieldTypeOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    draggable
                    className="justify-start"
                    onClick={() => prefillFieldDraft(option.value)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", option.value);
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Drag a field type into the configuration panel to prefill settings.
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Field configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void fieldForm.handleSubmit();
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const droppedType = event.dataTransfer.getData("text/plain");
                  if (droppedType) {
                    prefillFieldDraft(droppedType);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <fieldForm.Field
                    name="key"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? "Field key is required" : undefined,
                    }}
                  >
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Key"
                        placeholder="report_title"
                      />
                    )}
                  </fieldForm.Field>
                  <fieldForm.Field name="label">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Label"
                        placeholder="Report title"
                      />
                    )}
                  </fieldForm.Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <fieldForm.Field name="type">
                    {(field) => (
                      <ValidatedSelect
                        field={field}
                        label="Type"
                        options={fieldTypeOptions}
                        placeholderText="Select type"
                      />
                    )}
                  </fieldForm.Field>
                  <fieldForm.Field name="placeholder">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Placeholder"
                        placeholder="Optional placeholder"
                      />
                    )}
                  </fieldForm.Field>
                </div>
                <fieldForm.Field name="description">
                  {(field) => (
                    <TextareaField
                      field={field}
                      label="Description"
                      placeholder="Optional helper text"
                    />
                  )}
                </fieldForm.Field>
                <fieldForm.Field name="required">
                  {(field) => (
                    <ValidatedCheckbox
                      field={field}
                      label="Required field"
                      description="Submission cannot be completed without this value."
                    />
                  )}
                </fieldForm.Field>

                <fieldForm.Field name="optionsText">
                  {(field) => (
                    <TextareaField
                      field={field}
                      label="Options"
                      placeholder="Comma-separated values for select fields"
                    />
                  )}
                </fieldForm.Field>

                <div className="grid gap-3 md:grid-cols-3">
                  <fieldForm.Field name="validationType">
                    {(field) => (
                      <ValidatedSelect
                        field={field}
                        label="Validation rule"
                        options={validationTypes}
                        placeholderText="None"
                      />
                    )}
                  </fieldForm.Field>
                  <fieldForm.Field name="validationValue">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Validation value"
                        placeholder="10"
                      />
                    )}
                  </fieldForm.Field>
                  <fieldForm.Field name="validationMessage">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Validation message"
                        placeholder="Explain the rule"
                      />
                    )}
                  </fieldForm.Field>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <fieldForm.Field name="conditionalField">
                    {(field) => (
                      <ValidatedSelect
                        field={field}
                        label="Conditional field"
                        options={fields.map((item) => ({
                          value: item.key,
                          label: item.label,
                        }))}
                        placeholderText="None"
                      />
                    )}
                  </fieldForm.Field>
                  <fieldForm.Field name="conditionalOperator">
                    {(field) => (
                      <ValidatedSelect
                        field={field}
                        label="Operator"
                        options={conditionalOperators}
                        placeholderText="Equals"
                      />
                    )}
                  </fieldForm.Field>
                  <fieldForm.Field name="conditionalValue">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Value"
                        placeholder="Match value"
                      />
                    )}
                  </fieldForm.Field>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <fieldForm.Field name="fileTypes">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="File types"
                        placeholder="image/*,application/pdf"
                      />
                    )}
                  </fieldForm.Field>
                  <fieldForm.Field name="maxSizeMb">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Max size (MB)"
                        placeholder="5"
                        type="number"
                      />
                    )}
                  </fieldForm.Field>
                  <fieldForm.Field name="maxFiles">
                    {(field) => (
                      <ValidatedInput
                        field={field}
                        label="Max files"
                        placeholder="1"
                        type="number"
                      />
                    )}
                  </fieldForm.Field>
                </div>

                {fieldError && (
                  <p className="text-destructive text-sm font-medium">{fieldError}</p>
                )}

                <Button type="submit">
                  {selectedFieldKey ? "Update field" : "Add field"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm">
                        No fields yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields
                      .slice()
                      .sort((a, b) => a.key.localeCompare(b.key))
                      .map((field) => (
                        <TableRow key={field.key}>
                          <TableCell className="text-xs">{field.key}</TableCell>
                          <TableCell className="text-xs">{field.label}</TableCell>
                          <TableCell className="text-xs">{field.type}</TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedFieldKey(field.key)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setFields((prev) =>
                                  prev.filter((item) => item.key !== field.key),
                                );
                                if (selectedFieldKey === field.key) {
                                  setSelectedFieldKey(null);
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedFormId ? (
        <Card>
          <CardHeader>
            <CardTitle>Form settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="allow-draft"
                checked={settings.allowDraft}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    allowDraft: Boolean(checked),
                  }))
                }
              />
              <Label htmlFor="allow-draft">Allow draft submissions</Label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="require-approval"
                checked={settings.requireApproval}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    requireApproval: Boolean(checked),
                  }))
                }
              />
              <Label htmlFor="require-approval">Require approval after submission</Label>
            </div>
            <div>
              <Label>Notify on submit (comma-separated user IDs)</Label>
              <Input
                value={settings.notifyOnSubmit.join(", ")}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifyOnSubmit: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="user-id-1, user-id-2"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selectedFormId) {
                  const selectedForm = forms.find((form) => form.id === selectedFormId);
                  const formData: { name?: string; slug?: string } = {};
                  if (selectedForm?.name) {
                    formData.name = selectedForm.name;
                  }
                  if (selectedForm?.slug) {
                    formData.slug = selectedForm.slug;
                  }
                  updateMutation.mutate({
                    formId: selectedFormId,
                    data: formData,
                  });
                }
                publishMutation.mutate();
              }}
              disabled={fields.length === 0 || publishMutation.isPending}
            >
              {publishMutation.isPending ? "Publishing..." : "Publish form"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {selectedFormId ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview & submit</CardTitle>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Add at least one field to preview this form.
              </p>
            ) : (
              <DynamicFormRenderer
                formId={selectedFormId}
                organizationId={
                  forms.find((form) => form.id === selectedFormId)?.organizationId ?? null
                }
                definition={definition}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {selectedFormId ? (
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No submissions yet.</p>
            ) : (
              <div className="grid gap-2">
                {submissions.map((submission) => (
                  <Button
                    key={submission.id}
                    type="button"
                    variant="outline"
                    className={`h-auto w-full items-start justify-between gap-4 px-3 py-2 text-left whitespace-normal ${
                      selectedSubmissionId === submission.id
                        ? "border-primary bg-primary/10"
                        : "border-input"
                    }`}
                    onClick={() => setSelectedSubmissionId(submission.id)}
                  >
                    <div>
                      <p className="font-semibold">{submission.status}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(submission.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Score: {submission.completenessScore ?? "-"}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {selectedSubmission ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Submission details</p>
                  {submissionPayloadEntries.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No payload values.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissionPayloadEntries.map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell className="text-xs font-medium">{key}</TableCell>
                            <TableCell className="text-xs">
                              {formatPayloadValue(value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Attachments</p>
                  {submissionFiles.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No files attached.</p>
                  ) : (
                    <div className="space-y-2">
                      {submissionFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs"
                        >
                          <div>
                            <p className="font-semibold">{file.fileName}</p>
                            <p className="text-muted-foreground">
                              {file.mimeType} · {(file.sizeBytes / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => downloadMutation.mutate(file.id)}
                            disabled={downloadMutation.isPending}
                          >
                            {downloadMutation.isPending ? "Fetching..." : "Download"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Review workflow</p>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void reviewForm.handleSubmit();
                    }}
                    className="space-y-3"
                  >
                    <reviewForm.Field name="status">
                      {(field) => (
                        <ValidatedSelect
                          field={field}
                          label="Status"
                          options={reviewStatusOptions}
                          placeholderText="Select status"
                        />
                      )}
                    </reviewForm.Field>
                    <reviewForm.Field name="reviewNotes">
                      {(field) => (
                        <TextareaField
                          field={field}
                          label="Review notes"
                          placeholder="Optional notes for the submitter"
                        />
                      )}
                    </reviewForm.Field>
                    <FormSubmitButton
                      isSubmitting={reviewMutation.isPending}
                      loadingText="Updating..."
                    >
                      Update review
                    </FormSubmitButton>
                  </form>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Submission history</p>
                  {submissionVersions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No submission versions found.
                    </p>
                  ) : (
                    submissionVersions.map((version) => (
                      <div
                        key={version.id}
                        className="rounded-md border border-gray-200 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span>Version {version.versionNumber}</span>
                          <span className="text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {version.changeReason ? (
                          <p className="text-muted-foreground mt-1">
                            {version.changeReason}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
