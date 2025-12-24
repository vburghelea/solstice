import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ParseResult } from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedFileUpload } from "~/components/form-fields/ValidatedFileUpload";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { ValidatedSelect } from "~/components/form-fields/ValidatedSelect";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { getLatestFormVersion, listForms } from "~/features/forms/forms.queries";
import type { FormDefinition } from "~/features/forms/forms.schemas";
import { validateFormPayload } from "~/features/forms/forms.utils";
import { listOrganizations } from "~/features/organizations/organizations.queries";
import { useAppForm } from "~/lib/hooks/useAppForm";
import type { JsonRecord } from "~/shared/lib/json";
import {
  createImportJob,
  createImportUpload,
  createMappingTemplate,
  deleteMappingTemplate,
  rollbackImportJob,
  runBatchImport,
  runInteractiveImport,
  updateMappingTemplate,
} from "../imports.mutations";
import {
  listImportJobErrors,
  listImportJobs,
  listMappingTemplates,
} from "../imports.queries";

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

const parseCsvFile = async (file: File) => {
  const Papa = await import("papaparse");
  return new Promise<JsonRecord[]>((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: ParseResult<JsonRecord>) => resolve(result.data as JsonRecord[]),
      error: (error: Error) => reject(error),
    });
  });
};

const parseExcelFile = async (file: File) => {
  const { read, utils } = await import("xlsx");
  const data = new Uint8Array(await file.arrayBuffer());
  const workbook = read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return utils.sheet_to_json(sheet, { defval: "" }) as JsonRecord[];
};

const parseImportFile = async (file: File) => {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return { type: "csv" as const, rows: await parseCsvFile(file) };
  }
  if (
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.name.toLowerCase().endsWith(".xls")
  ) {
    return { type: "excel" as const, rows: await parseExcelFile(file) };
  }
  throw new Error("Unsupported file type. Please upload CSV or Excel.");
};

const buildPayloadFromRow = (
  row: JsonRecord,
  mapping: Record<string, string>,
  fieldLookup: Map<string, FormDefinition["fields"][number]>,
) => {
  const payload: JsonRecord = {};

  Object.entries(mapping).forEach(([sourceColumn, targetFieldKey]) => {
    if (!targetFieldKey) return;
    const field = fieldLookup.get(targetFieldKey);
    if (!field) return;
    const rawValue = row[sourceColumn];

    if (field.type === "number") {
      payload[targetFieldKey] = rawValue === "" ? null : Number(rawValue);
      return;
    }

    if (field.type === "checkbox") {
      const normalized = String(rawValue ?? "").toLowerCase();
      payload[targetFieldKey] = ["true", "1", "yes", "y"].includes(normalized);
      return;
    }

    if (field.type === "multiselect") {
      payload[targetFieldKey] =
        typeof rawValue === "string" ? rawValue.split(",").map((val) => val.trim()) : [];
      return;
    }

    payload[targetFieldKey] = rawValue ?? null;
  });

  return payload;
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

export function ImportWizardShell() {
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
  const fieldOptions = useMemo(
    () =>
      (definition?.fields ?? []).map((field) => ({
        value: field.key,
        label: field.label,
      })),
    [definition],
  );

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
          rows,
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

  const rollbackMutation = useMutation({
    mutationFn: (jobId: string) => rollbackImportJob({ data: { jobId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["imports", "jobs"] });
    },
  });

  useEffect(() => {
    if (!definition || headers.length === 0) return;
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setMapping((prev) => ({ ...autoMapHeaders(headers, definition.fields), ...prev }));
  }, [definition, headers]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    const template = mappingTemplates.find((item) => item.id === selectedTemplateId);
    if (template?.mappings) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setMapping(template.mappings as Record<string, string>);
    }
  }, [mappingTemplates, selectedTemplateId]);

  useEffect(() => {
    if (!selectedFile || !selectedOrganizationId) return;

    const handleFile = async () => {
      try {
        setErrorMessage("");
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

  const previewRows = rows.slice(0, 10);
  const validationPreview = useMemo(() => {
    if (!definition) return [];
    const fieldLookup = new Map(definition.fields.map((field) => [field.key, field]));
    return previewRows.map((row, index) => {
      const payload = buildPayloadFromRow(row, mapping, fieldLookup);
      const validation = validateFormPayload(definition, payload);
      return {
        rowIndex: index + 1,
        missingFields: validation.missingFields,
        errors: validation.validationErrors,
      };
    });
  }, [definition, mapping, previewRows]);

  const validationErrorCount = validationPreview.reduce(
    (total, row) => total + row.errors.length + row.missingFields.length,
    0,
  );

  return (
    <div className="space-y-6">
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
                      setMapping(autoMapHeaders(headers, definition.fields));
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source column</TableHead>
                    <TableHead>Mapped field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header) => (
                    <TableRow key={header}>
                      <TableCell className="text-xs">{header}</TableCell>
                      <TableCell className="text-xs">
                        <SelectField
                          options={fieldOptions}
                          value={mapping[header] ?? ""}
                          onChange={(value) =>
                            setMapping((prev) => ({ ...prev, [header]: value }))
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationPreview.map((row) => (
                    <TableRow key={row.rowIndex}>
                      <TableCell className="text-xs">Row {row.rowIndex}</TableCell>
                      <TableCell className="text-xs">
                        {row.errors.length === 0 && row.missingFields.length === 0
                          ? "OK"
                          : [
                              ...row.errors.map((err) => err.message),
                              ...row.missingFields.map((field) => `${field}: required`),
                            ].join("; ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {selectedLane === "interactive" ? (
                <Button
                  type="button"
                  disabled={
                    !importJobId || !selectedFormId || runImportMutation.isPending
                  }
                  onClick={() => runImportMutation.mutate()}
                >
                  {runImportMutation.isPending ? "Importing..." : "Run import"}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!importJobId || runBatchMutation.isPending}
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
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={
                        job.status === "rolled_back" || rollbackMutation.isPending
                      }
                      onClick={() => rollbackMutation.mutate(job.id)}
                    >
                      {rollbackMutation.isPending ? "Rolling back..." : "Rollback"}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importErrors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell className="text-xs">{error.rowNumber}</TableCell>
                        <TableCell className="text-xs">{error.fieldKey ?? "-"}</TableCell>
                        <TableCell className="text-xs">{error.errorMessage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
