import { useCommonTranslation } from "~/hooks/useTypedTranslation";

export function SafeAddressLink({ address }: { address: string }) {
  const { t } = useCommonTranslation();

  if (!address.trim()) {
    return null;
  }

  const href = `https://maps.google.com/?q=${encodeURIComponent(address)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
    >
      {t("links.open_in_google_maps")}
    </a>
  );
}
