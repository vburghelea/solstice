import { useGamesTranslation } from "~/hooks/useTypedTranslation";
import type { ComboboxProps } from "~/shared/ui/combobox";
import { Combobox } from "~/shared/ui/combobox";

export function GameSystemCombobox(
  props: Omit<ComboboxProps, "emptyMessage" | "noResultsMessage">,
) {
  const { t } = useGamesTranslation();

  return (
    <Combobox
      emptyMessage={t("combobox.empty_message")}
      noResultsMessage={t("combobox.no_results_message")}
      {...props}
    />
  );
}
