import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Check, FileUp, GitCompare, Play, Search } from "lucide-react";
import { cn } from "~/shared/lib/utils";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedFileUpload } from "~/components/form-fields/ValidatedFileUpload";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { getLatestFormVersion, listForms } from "~/features/forms/forms.queries";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { validateFormPayload } from "~/features/forms/forms.utils";
import { analyzeImport, type CategorizedError } from "~/features/imports/error-analyzer";
import { applyAutofix } from "~/features/imports/autofix-engine";
import {
  buildImportFieldLookup,
  getMappedFileFields,
  parseImportRow,
  parseImportFile,
} from "~/features/imports/imports.utils";
import { listOrganizations } from "~/features/organizations/organizations.queries";
import { useAppForm } from "~/lib/hooks/useAppForm";
import type { JsonRecord } from "~/shared/lib/json";
import {
  createImportJob,
  createImportUpload,
  createMappingTemplate,
  deleteMappingTemplate,
  downloadFormTemplate,
  runBatchImport,
  runInteractiveImport,
  updateImportJobSourceFile,
  updateMappingTemplate,
} from "../imports.mutations";
import {
  listImportJobErrors,
  listImportJobs,
  listMappingTemplates,
} from "../imports.queries";
import { CategorizedErrors } from "./categorized-errors";
import { VirtualizedImportTable } from "./virtualized-import-table";

const laneOptions = [
  { value: "interactive", label: "Lane 1 (interactive)" },
  { value: "batch", label: "Lane 2 (batch)" },
];

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const hashFile = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const autoMapHeaders = (
  headers: string[],
  fields: FormDefinition["fields"],
): Record<string, string> => {
  const normalizedFields = fields.map((field) => ({
    key: field.key,
    label: field.label,
    normalizedKey: normalizeKey(field.key),
    normalizedLabel: normalizeKey(field.label),
  }));

  return headers.reduce<Record<string, string>>((acc, header) => {
    if (normalizeKey(header) === "meta") return acc;
    const normalizedHeader = normalizeKey(header);
    const match = normalizedFields.find(
      (field) =>
        normalizedHeader === field.normalizedKey ||
        normalizedHeader === field.normalizedLabel ||
        normalizedHeader.includes(field.normalizedKey) ||
        normalizedHeader.includes(field.normalizedLabel),
    );
    if (match) {
      acc[header] = match.key;
    }
    return acc;
  }, {});
};

const buildCellKey = (rowIndex: number, header: string) => `${rowIndex}:${header}`;

/**
 * Visual progress indicator showing import workflow steps.
 */
const WIZARD_STEPS = [
  { id: "upload", label: "Upload", icon: FileUp },
  { id: "map", label: "Map", icon: GitCompare },
  { id: "review", label: "Review", icon: Search },
  { id: "import", label: "Import", icon: Play },
] as const;

type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

function ProgressStepper({
  currentStep,
  completedSteps,
}: {
  currentStep: WizardStepId;
  completedSteps: Set<WizardStepId>;
}) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : isPast
                          ? "border-muted-foreground/50 bg-muted text-muted-foreground"
                          : "border-muted bg-background text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent
                      ? "text-primary"
                      : isCompleted || isPast
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors",
                    index < currentIndex || completedSteps.has(WIZARD_STEPS[index + 1].id)
                      ? "bg-primary"
                      : "bg-muted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const generateCorrectedFile = async (
  rows: JsonRecord[],
  headers: string[],
  format: "csv" | "xlsx",
) => {
  const { utils, write } = await import("xlsx");
  const sheet = utils.json_to_sheet(rows, { header: headers });
  if (format === "csv") {
    const csv = utils.sheet_to_csv(sheet);
    return new Blob([csv], { type: "text/csv" });
  }
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, "Sheet1");
  const data = write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export function SmartImportWizard() {
  const queryClient = useQueryClient();
  const [sourceFileKey, setSourceFileKey] = useState<string | null>(null);
  const [sourceFileHash, setSourceFileHash] = useState<string | null>(null);
  const [importFileType, setImportFileType] = useState<"csv" | "excel" | null>(null);
  const [rows, setRows] = useState<JsonRecord[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasReviewedPreview, setHasReviewedPreview] = useState(false);
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set());
  const [ignoredErrorIds, setIgnoredErrorIds] = useState<Set<string>>(new Set());
  const [hasPendingEdits, setHasPendingEdits] = useState(false);
  const [autofixHistory, setAutofixHistory] = useState<
    Array<{ rows: JsonRecord[]; editedCells: Set<string> }>
  >([]);

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations", "list"],
    queryFn: () => listOrganizations({ data: { includeArchived: true } }),
  });

  const { data: forms = [] } = useQuery({
    queryKey: ["forms", "list"],
    queryFn: () => listForms({ data: {} }),
  });

  const importForm = useAppForm({
    defaultValues: {
      organizationId: "",
      formId: "",
      lane: "interactive",
      mappingTemplateId: "",
      file: null as File | null,
    },
    onSubmit: async ({ value }) => {
      if (!sourceFileKey || !sourceFileHash || !importFileType) return;
      if (value.lane === "batch" && !value.mappingTemplateId) {
        setErrorMessage("Batch imports require a mapping template.");
        return;
      }

      const created = await createImportJob({
        data: {
          organizationId: value.organizationId,
          type: importFileType,
          lane: value.lane as "interactive" | "batch",
          sourceFileKey,
          sourceFileHash,
          sourceRowCount: rows.length,
          targetFormId: value.formId || undefined,
          mappingTemplateId: value.mappingTemplateId || undefined,
        },
      });

      if (created?.id) {
        setImportJobId(created.id);
        void queryClient.invalidateQueries({ queryKey: ["imports", "jobs"] });
      }
    },
  });

  const selectedOrganizationId = useStore(
    importForm.store,
    (state) => state.values.organizationId,
  );
  const selectedFormId = useStore(importForm.store, (state) => state.values.formId);
  const selectedLane = useStore(importForm.store, (state) => state.values.lane);
  const selectedTemplateId = useStore(
    importForm.store,
    (state) => state.values.mappingTemplateId,
  );
  const selectedFile = useStore(importForm.store, (state) => state.values.file);

  const { data: latestVersion } = useQuery({
    queryKey: ["forms", "latest", selectedFormId],
    queryFn: () =>
      selectedFormId ? getLatestFormVersion({ data: { formId: selectedFormId } }) : null,
    enabled: Boolean(selectedFormId),
  });

  const definition = latestVersion?.definition as FormDefinition | undefined;
  const supportedFields = useMemo(() => definition?.fields ?? [], [definition]);
  const fieldLookup = useMemo(
    () => (definition ? buildImportFieldLookup(definition) : null),
    [definition],
  );
  const fieldOptions = useMemo(
    () =>
      supportedFields.map((field) => ({
        value: field.key,
        label: field.label,
      })),
    [supportedFields],
  );
  const mappedFileFields = useMemo(() => {
    if (!fieldLookup) return [];
    return getMappedFileFields(mapping, fieldLookup);
  }, [fieldLookup, mapping]);

  const { data: mappingTemplates = [] } = useQuery({
    queryKey: ["imports", "templates", selectedOrganizationId],
    queryFn: () =>
      listMappingTemplates({
        data: selectedOrganizationId ? { organizationId: selectedOrganizationId } : {},
      }),
    enabled: Boolean(selectedOrganizationId),
  });

  const { data: importJobs = [] } = useQuery({
    queryKey: ["imports", "jobs", selectedOrganizationId],
    queryFn: () =>
      listImportJobs({
        data: selectedOrganizationId ? { organizationId: selectedOrganizationId } : {},
      }),
    enabled: Boolean(selectedOrganizationId),
  });

  const { data: importErrors = [] } = useQuery({
    queryKey: ["imports", "errors", selectedJobId],
    queryFn: () =>
      selectedJobId ? listImportJobErrors({ data: { jobId: selectedJobId } }) : [],
    enabled: Boolean(selectedJobId),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      createMappingTemplate({
        data: {
          organizationId: selectedOrganizationId || undefined,
          name: payload.name,
          description: payload.description,
          targetFormId: selectedFormId || undefined,
          targetFormVersionId: latestVersion?.id ?? undefined,
          mappings: mapping as JsonRecord,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["imports", "templates"] });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: () =>
      updateMappingTemplate({
        data: {
          templateId: selectedTemplateId,
          data: {
            organizationId: selectedOrganizationId || undefined,
            name:
              mappingTemplates.find((template) => template.id === selectedTemplateId)
                ?.name ?? "Template",
            mappings: mapping as JsonRecord,
            targetFormId: selectedFormId || undefined,
            targetFormVersionId: latestVersion?.id ?? undefined,
          },
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["imports", "templates"] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: () =>
      deleteMappingTemplate({
        data: { templateId: selectedTemplateId },
      }),
    onSuccess: () => {
      importForm.setFieldValue("mappingTemplateId", "");
      void queryClient.invalidateQueries({ queryKey: ["imports", "templates"] });
    },
  });

  const runImportMutation = useMutation({
    mutationFn: () =>
      runInteractiveImport({
        data: {
          jobId: importJobId ?? "",
          formId: selectedFormId,
          mapping: mapping as JsonRecord,
          rows: undefined,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["imports", "jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["imports", "errors"] });
    },
  });

  const runBatchMutation = useMutation({
    mutationFn: () =>
      runBatchImport({
        data: {
          jobId: importJobId ?? "",
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["imports", "jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["imports", "errors"] });
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrganizationId || !importFileType || !sourceFileKey || !importJobId) {
        return null;
      }
      const format = importFileType === "csv" ? "csv" : "xlsx";
      const blob = await generateCorrectedFile(rows, headers, format);
      const updatedFile = new File([blob], `corrected.${format}`, {
        type: blob.type || "application/octet-stream",
      });
      const upload = await createImportUpload({
        data: {
          organizationId: selectedOrganizationId,
          fileName: updatedFile.name,
          mimeType: updatedFile.type || "application/octet-stream",
          sizeBytes: updatedFile.size,
        },
      });
      if (!upload?.uploadUrl || !upload.storageKey) {
        throw new Error("Upload URL not available.");
      }

      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        body: updatedFile,
        headers: {
          "Content-Type": updatedFile.type || "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload corrected file.");
      }

      const updatedHash = await hashFile(updatedFile);
      const changeSummary = {
        editedCells: editedCells.size,
        rows: rows.length,
      };

      const updated = await updateImportJobSourceFile({
        data: {
          jobId: importJobId,
          sourceFileKey: upload.storageKey,
          sourceFileHash: updatedHash,
          sourceRowCount: rows.length,
          changeSummary,
        },
      });

      setSourceFileKey(upload.storageKey);
      setSourceFileHash(updatedHash);
      setHasPendingEdits(false);
      return updated ?? null;
    },
  });

  const downloadTemplateMutation = useMutation({
    mutationFn: (format: "csv" | "xlsx") =>
      downloadFormTemplate({
        data: {
          formId: selectedFormId,
          format,
          options: {
            includeDescriptions: true,
            includeExamples: true,
            includeDataValidation: format === "xlsx",
            includeMetadataMarkers: true,
            organizationId: selectedOrganizationId || undefined,
          },
        },
      }),
    onSuccess: (result) => {
      if (result?.downloadUrl) {
        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      }
    },
  });

  useEffect(() => {
    if (!definition || headers.length === 0) return;
    setMapping((prev) => ({ ...autoMapHeaders(headers, supportedFields), ...prev }));
  }, [definition, headers, supportedFields]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const template = mappingTemplates.find((item) => item.id === selectedTemplateId);
    if (template?.mappings) {
      setMapping(template.mappings as Record<string, string>);
    }
  }, [mappingTemplates, selectedTemplateId]);

  useEffect(() => {
    if (!selectedFile || !selectedOrganizationId) return;

    const handleFile = async () => {
      try {
        setErrorMessage("");
        setHasReviewedPreview(false);
        setEditedCells(new Set());
        setIgnoredErrorIds(new Set());
        setHasPendingEdits(false);
        setAutofixHistory([]);

        const { type, rows: parsedRows } = await parseImportFile(selectedFile);
        setImportFileType(type);
        setRows(parsedRows);
        setHeaders(parsedRows.length > 0 ? Object.keys(parsedRows[0]) : []);
        setMapping({});
        setImportJobId(null);
        setSourceFileKey(null);
        setSourceFileHash(null);

        const fileHash = await hashFile(selectedFile);
        const upload = await createImportUpload({
          data: {
            organizationId: selectedOrganizationId,
            fileName: selectedFile.name,
            mimeType: selectedFile.type || "application/octet-stream",
            sizeBytes: selectedFile.size,
          },
        });

        if (!upload?.uploadUrl || !upload.storageKey) {
          throw new Error("Upload URL not available.");
        }

        const response = await fetch(upload.uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": selectedFile.type || "application/octet-stream",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to upload file.");
        }

        setSourceFileKey(upload.storageKey);
        setSourceFileHash(fileHash);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to parse file.");
      }
    };

    void handleFile();
  }, [selectedFile, selectedOrganizationId]);

  const analysis = useMemo(() => {
    if (!definition || headers.length === 0) {
      return null;
    }
    return analyzeImport({
      headers,
      rows,
      schema: definition,
      mapping,
      ...(selectedOrganizationId ? { organizationId: selectedOrganizationId } : {}),
    });
  }, [definition, headers, mapping, rows, selectedOrganizationId]);

  const validationPreview = useMemo(() => {
    if (!definition || !fieldLookup) return [];
    return rows.slice(0, 10).map((row, index) => {
      const { payload, parseErrors } = parseImportRow(row, mapping, fieldLookup);
      const validation = validateFormPayload(definition, payload);
      const parseErrorFields = new Set(parseErrors.map((error) => error.fieldKey));
      const validationErrors = validation.validationErrors.filter(
        (error) => !parseErrorFields.has(error.field),
      );
      const missingFields = validation.missingFields.filter(
        (fieldKey) => !parseErrorFields.has(fieldKey),
      );
      return {
        rowIndex: index + 1,
        errors: [
          ...parseErrors.map((error) => ({
            message: `${error.fieldKey}: ${error.message}`,
          })),
          ...validationErrors,
        ],
        missingFields,
      };
    });
  }, [definition, fieldLookup, mapping, rows]);

  const validationErrorCount = validationPreview.reduce(
    (total, row) => total + row.errors.length + row.missingFields.length,
    0,
  );

  const handleEditCell = (rowIndex: number, header: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [header]: value };
      return next;
    });
    setEditedCells((prev) => {
      const next = new Set(prev);
      next.add(buildCellKey(rowIndex, header));
      return next;
    });
    setHasPendingEdits(true);
  };

  const handleAutofix = (error: CategorizedError) => {
    if (!error.autofix) return;
    if (error.autofix.type === "map_column") {
      const from = String(error.autofix.params["from"]);
      const to = String(error.autofix.params["to"]);
      setMapping((prev) => {
        const next = { ...prev };
        const temp = next[from];
        next[from] = next[to] ?? "";
        next[to] = temp ?? "";
        return next;
      });
      return;
    }
    const result = applyAutofix(rows, error);
    if (!result.success) return;
    setAutofixHistory((prev) => [
      ...prev,
      {
        rows: rows.map((row) => ({ ...row })),
        editedCells: new Set(editedCells),
      },
    ]);
    setRows(result.rows);
    setEditedCells((prev) => {
      const next = new Set(prev);
      result.changes.forEach((change) => {
        next.add(buildCellKey(change.row - 1, change.column));
      });
      return next;
    });
    setHasPendingEdits(true);
  };

  const previewRows = rows.slice(0, 10);

  // Calculate current step and completed steps for progress stepper
  const { currentStep, completedSteps } = useMemo(() => {
    const completed = new Set<WizardStepId>();

    // Upload is complete when we have a file parsed
    const uploadComplete =
      Boolean(selectedOrganizationId) &&
      Boolean(selectedFormId) &&
      Boolean(sourceFileKey) &&
      headers.length > 0;

    // Map is complete when we have mappings defined
    const mappingComplete =
      uploadComplete &&
      Object.values(mapping).filter(Boolean).length > 0 &&
      Boolean(importJobId);

    // Review is complete when analysis shows no errors or user has proceeded
    const reviewComplete = mappingComplete && analysis && analysis.canProceed;

    // Import is complete when job status is completed
    const importComplete =
      importJobs.find((j) => j.id === importJobId)?.status === "completed";

    if (uploadComplete) completed.add("upload");
    if (mappingComplete) completed.add("map");
    if (reviewComplete) completed.add("review");
    if (importComplete) completed.add("import");

    // Determine current step
    let current: WizardStepId = "upload";
    if (uploadComplete && !mappingComplete) current = "map";
    else if (mappingComplete && !reviewComplete) current = "review";
    else if (reviewComplete && !importComplete) current = "import";
    else if (importComplete) current = "import";

    return { currentStep: current, completedSteps: completed };
  }, [
    selectedOrganizationId,
    selectedFormId,
    sourceFileKey,
    headers.length,
    mapping,
    importJobId,
    analysis,
    importJobs,
  ]);

  return (
    <div className="space-y-6">
      <ProgressStepper currentStep={currentStep} completedSteps={completedSteps} />

      <Card>
        <CardHeader>
          <CardTitle>Import setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void importForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <importForm.Field name="organizationId">
                {(field) => (
                  <ValidatedSelect
                    field={field}
                    label="Organization"
                    options={organizations.map((org) => ({
                      value: org.id,
                      label: org.name,
                    }))}
                    placeholderText="Select organization"
                  />
                )}
              </importForm.Field>
              <importForm.Field name="formId">
                {(field) => (
                  <ValidatedSelect
                    field={field}
                    label="Target form"
                    options={forms.map((form) => ({
                      value: form.id,
                      label: form.name,
                    }))}
                    placeholderText="Select form"
                  />
                )}
              </importForm.Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <importForm.Field name="lane">
                {(field) => (
                  <ValidatedSelect
                    field={field}
                    label="Import lane"
                    options={laneOptions}
                    placeholderText="Select lane"
                  />
                )}
              </importForm.Field>
              <importForm.Field name="mappingTemplateId">
                {(field) => (
                  <ValidatedSelect
                    field={field}
                    label="Mapping template"
                    options={[
                      { value: "", label: "None" },
                      ...mappingTemplates.map((template) => ({
                        value: template.id,
                        label: template.name,
                      })),
                    ]}
                    placeholderText="Optional"
                  />
                )}
              </importForm.Field>
            </div>
            <importForm.Field name="file">
              {(field) => (
                <ValidatedFileUpload
                  field={field}
                  label="Source file"
                  accept=".csv,.xls,.xlsx"
                  helperText="Upload CSV or Excel. We'll parse the first sheet."
                />
              )}
            </importForm.Field>
            {errorMessage ? (
              <p className="text-destructive text-sm">{errorMessage}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <FormSubmitButton
                disabled={
                  !selectedOrganizationId ||
                  !selectedFormId ||
                  !sourceFileKey ||
                  !sourceFileHash
                }
                isSubmitting={importForm.state.isSubmitting}
              >
                {importJobId ? "Import job created" : "Create import job"}
              </FormSubmitButton>
              <Button
                type="button"
                variant="outline"
                disabled={!selectedFormId || downloadTemplateMutation.isPending}
                onClick={() => downloadTemplateMutation.mutate("xlsx")}
              >
                Download XLSX template
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!selectedFormId || downloadTemplateMutation.isPending}
                onClick={() => downloadTemplateMutation.mutate("csv")}
              >
                Download CSV template
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {headers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Upload a file to configure mappings.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold">Columns detected: {headers.length}</p>
                  <p className="text-muted-foreground text-xs">
                    Auto-mapping applied based on column names.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!definition) return;
                      setMapping(autoMapHeaders(headers, supportedFields));
                    }}
                  >
                    Re-run auto-map
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!selectedTemplateId || updateTemplateMutation.isPending}
                    onClick={() => updateTemplateMutation.mutate()}
                  >
                    Update template
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!selectedTemplateId || deleteTemplateMutation.isPending}
                    onClick={() => deleteTemplateMutation.mutate()}
                  >
                    Delete template
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {headers.map((header) => (
                  <div key={header} className="flex items-center gap-3 text-xs">
                    <div className="w-1/2 truncate">{header}</div>
                    <SelectField
                      options={fieldOptions}
                      value={mapping[header] ?? ""}
                      onChange={(value) =>
                        setMapping((prev) => ({ ...prev, [header]: value }))
                      }
                    />
                  </div>
                ))}
              </div>
              {mappedFileFields.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                  File fields expect JSON payloads with fileName, mimeType, sizeBytes, and
                  storageKey or signedUrl. Mapped file fields:{" "}
                  {mappedFileFields.join(", ")}.
                </p>
              ) : null}

              <div className="rounded-md border border-gray-200 p-3 text-sm">
                <p className="font-semibold">Save mapping template</p>
                <MappingTemplateForm
                  onSubmit={(values) => {
                    const payload: { name: string; description?: string } = {
                      name: values.name,
                    };
                    if (values.description) {
                      payload.description = values.description;
                    }
                    createTemplateMutation.mutate(payload);
                  }}
                  isSubmitting={createTemplateMutation.isPending}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intelligent analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {autofixHistory.length > 0 ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const last = autofixHistory[autofixHistory.length - 1];
                  setRows(last.rows);
                  setEditedCells(new Set(last.editedCells));
                  setAutofixHistory((prev) => prev.slice(0, -1));
                  setHasPendingEdits(true);
                }}
              >
                Undo last autofix
              </Button>
            </div>
          ) : null}
          {analysis ? (
            <CategorizedErrors
              analysis={analysis}
              ignoredErrorIds={ignoredErrorIds}
              onAutofix={handleAutofix}
              onIgnoreError={(errorId) =>
                setIgnoredErrorIds((prev) => new Set([...prev, errorId]))
              }
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Upload a file to analyze errors.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inline edit preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Upload a file to preview data.
            </p>
          ) : (
            <>
              <VirtualizedImportTable
                headers={headers}
                rows={rows}
                editedCells={editedCells}
                onEditCell={handleEditCell}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="text-muted-foreground">
                  Showing {rows.length} rows. Edited cells: {editedCells.size}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    !hasPendingEdits || !importJobId || updateSourceMutation.isPending
                  }
                  onClick={() => updateSourceMutation.mutate()}
                >
                  {updateSourceMutation.isPending ? "Uploading..." : "Update source file"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Upload a file to review validation.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Showing first {previewRows.length} rows. Total errors:{" "}
                <strong>{validationErrorCount}</strong>
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="reviewed-preview"
                  checked={hasReviewedPreview}
                  onCheckedChange={(value) => setHasReviewedPreview(Boolean(value))}
                />
                <Label htmlFor="reviewed-preview">
                  I have reviewed the validation preview
                </Label>
              </div>

              {selectedLane === "interactive" ? (
                <Button
                  type="button"
                  disabled={
                    !importJobId ||
                    !selectedFormId ||
                    runImportMutation.isPending ||
                    !hasReviewedPreview
                  }
                  onClick={() => runImportMutation.mutate()}
                >
                  {runImportMutation.isPending ? "Importing..." : "Run import"}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={
                    !importJobId || runBatchMutation.isPending || !hasReviewedPreview
                  }
                  onClick={() => runBatchMutation.mutate()}
                >
                  {runBatchMutation.isPending ? "Importing..." : "Run batch import"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {importJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No import jobs yet.</p>
          ) : (
            <div className="grid gap-2">
              {importJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-semibold">{job.status}</p>
                    <p className="text-muted-foreground">
                      {job.type} · {new Date(job.createdAt).toLocaleString()}
                    </p>
                    {job.errorReportKey ? (
                      <p className="text-muted-foreground">
                        Error report: {job.errorReportKey}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      View errors
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedJobId ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Import errors</p>
              {importErrors.length === 0 ? (
                <p className="text-muted-foreground text-sm">No errors recorded.</p>
              ) : (
                <div className="space-y-1 text-xs">
                  {importErrors.map((error) => (
                    <div key={error.id} className="rounded border px-2 py-1">
                      Row {error.rowNumber}: {error.fieldKey ?? "-"} ·{" "}
                      {error.errorMessage}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SelectField(props: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  const effectiveValue = props.value || "__ignore__";
  return (
    <Select
      value={effectiveValue}
      onValueChange={(value) => props.onChange(value === "__ignore__" ? "" : value)}
    >
      <SelectTrigger className="h-8 w-48 text-xs">
        <SelectValue placeholder="Ignore" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__ignore__">Ignore</SelectItem>
        {props.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MappingTemplateForm(props: {
  onSubmit: (values: { name: string; description?: string }) => void;
  isSubmitting: boolean;
}) {
  const form = useAppForm({
    defaultValues: {
      name: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      const payload: { name: string; description?: string } = { name: value.name };
      if (value.description.trim()) {
        payload.description = value.description.trim();
      }
      props.onSubmit(payload);
      form.reset();
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-2"
    >
      <form.Field name="name">
        {(field) => (
          <ValidatedInput
            field={field}
            label="Template name"
            placeholder="Default mapping"
          />
        )}
      </form.Field>
      <form.Field name="description">
        {(field) => (
          <div className="space-y-2">
            <Label>Template description</Label>
            <Textarea
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>
      <FormSubmitButton isSubmitting={props.isSubmitting} loadingText="Saving...">
        Save template
      </FormSubmitButton>
    </form>
  );
}
