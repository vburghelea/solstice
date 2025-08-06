import type { ComboboxProps } from "~/shared/ui/combobox";
import { Combobox } from "~/shared/ui/combobox";

export function GameSystemCombobox(
  props: Omit<ComboboxProps, "emptyMessage" | "noResultsMessage">,
) {
  return (
    <Combobox
      emptyMessage="Start typing the name of the game system to search."
      noResultsMessage="No game system found."
      {...props}
    />
  );
}
