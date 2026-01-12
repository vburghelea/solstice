import { useEffect, useMemo, useState, useId, type ComponentType } from "react";
import { EditorView } from "@codemirror/view";
import { PostgreSQL, sql, type SQLNamespace } from "@codemirror/lang-sql";
import type { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { Textarea } from "~/components/ui/textarea";

type OnCreateEditor = NonNullable<ReactCodeMirrorProps["onCreateEditor"]>;

export function SqlEditor({
  value,
  onChange,
  schema,
  defaultTable,
  onCreateEditor,
}: {
  value: string;
  onChange: (next: string) => void;
  schema?: SQLNamespace;
  defaultTable?: string;
  onCreateEditor?: OnCreateEditor;
}) {
  const [CodeMirror, setCodeMirror] =
    useState<ComponentType<ReactCodeMirrorProps> | null>(null);
  const instructionsId = useId();
  const editorLabel = "SQL query editor";

  useEffect(() => {
    let active = true;
    import("@uiw/react-codemirror")
      .then((mod) => {
        if (active) {
          setCodeMirror(() => mod.default as ComponentType<ReactCodeMirrorProps>);
        }
      })
      .catch(() => {
        if (active) setCodeMirror(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const extensions = useMemo(
    () => [
      sql({
        dialect: PostgreSQL,
        ...(schema ? { schema } : {}),
        ...(defaultTable ? { defaultTable } : {}),
      }),
      EditorView.lineWrapping,
    ],
    [schema, defaultTable],
  );

  if (!CodeMirror) {
    return (
      <Textarea
        rows={10}
        className="font-mono text-sm"
        placeholder="SELECT * FROM organizations WHERE id = {{organization_id}}"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={editorLabel}
        aria-describedby={instructionsId}
      />
    );
  }

  return (
    <div
      className="rounded-md border"
      role="region"
      aria-label={editorLabel}
      aria-describedby={instructionsId}
    >
      <p id={instructionsId} className="sr-only">
        Edit SQL query. Use Ctrl or Cmd with Enter to run. Results appear below.
      </p>
      <CodeMirror
        value={value}
        minHeight="240px"
        theme="light"
        placeholder="SELECT * FROM organizations WHERE id = {{organization_id}}"
        extensions={extensions}
        onChange={(next) => onChange(next)}
        {...(onCreateEditor ? { onCreateEditor } : {})}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
        }}
        aria-label={editorLabel}
        aria-describedby={instructionsId}
      />
    </div>
  );
}
