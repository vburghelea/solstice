import { SafeLink, type SafeLinkProps } from "~/components/ui/SafeLink";

export type TypedLinkProps = SafeLinkProps;

export function TypedLink(props: TypedLinkProps) {
  return <SafeLink {...props} />;
}

export default TypedLink;
