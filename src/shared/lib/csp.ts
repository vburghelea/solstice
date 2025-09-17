export const CSP_NONCE_META = "csp-nonce";

export const getCspNonce = (): string | undefined => {
  if (typeof document === "undefined") return undefined;

  return (
    document.querySelector(`meta[name="${CSP_NONCE_META}"]`)?.getAttribute("content") ??
    undefined
  );
};
