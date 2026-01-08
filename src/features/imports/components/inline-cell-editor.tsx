import { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";

interface InlineCellEditorProps {
  value: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

export function InlineCellEditor(props: InlineCellEditorProps) {
  const [draft, setDraft] = useState(props.value);

  useEffect(() => {
    setDraft(props.value);
  }, [props.value]);

  return (
    <Input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => props.onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          props.onCommit(draft);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          props.onCancel();
        }
      }}
      className="h-7 text-xs"
    />
  );
}
