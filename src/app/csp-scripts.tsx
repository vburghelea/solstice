import {
  Asset,
  type RouterManagedTag,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { getCspNonce } from "~/shared/lib/csp";

const ensureScriptNonce = (
  tag: RouterManagedTag,
  nonce: string | undefined,
): RouterManagedTag => {
  if (tag.tag !== "script" || !nonce) return tag;

  const attrs = tag.attrs ?? {};
  if (typeof attrs === "object" && attrs && attrs["nonce"]) {
    return tag;
  }

  return {
    ...tag,
    attrs: {
      ...attrs,
      nonce,
    },
  } as RouterManagedTag;
};

const useCspNonce = () => useMemo(() => getCspNonce(), []);

const applyNonce = (assets: Array<RouterManagedTag>, nonce: string | undefined) =>
  assets.map((asset) => ensureScriptNonce(asset, nonce));

export const CspScripts = () => {
  const router = useRouter();
  const nonce = useCspNonce();

  const assetScripts = useRouterState({
    select: (state) => {
      const manifest = router.ssr?.manifest;
      if (!manifest) {
        return [] as Array<RouterManagedTag>;
      }

      const collected: Array<RouterManagedTag> = [];

      state.matches
        .map((match) => router.looseRoutesById[match.routeId]!)
        .forEach((route) => {
          manifest.routes[route.id]?.assets
            ?.filter((asset) => asset.tag === "script")
            .forEach((asset) => {
              collected.push({
                tag: "script",
                attrs: asset.attrs,
                children: asset.children ?? "",
              } as RouterManagedTag);
            });
        });

      return collected;
    },
  }) as Array<RouterManagedTag>;

  const scriptState = useRouterState({
    select: (state) => ({
      scripts: (
        state.matches
          .map((match) => match.scripts!)
          .flat(1)
          .filter(Boolean) as Array<RouterManagedTag>
      ).map(({ children, ...scriptAttrs }) => ({
        tag: "script",
        attrs: {
          ...scriptAttrs,
          suppressHydrationWarning: true,
        },
        children: children ?? "",
      })),
    }),
  }) as { scripts: Array<RouterManagedTag> };

  const scripts = scriptState.scripts;

  const allScripts = useMemo(
    () => applyNonce([...scripts, ...assetScripts], nonce),
    [scripts, assetScripts, nonce],
  );

  return (
    <>
      {allScripts.map((asset) => {
        const assetKey =
          asset.attrs?.["src"] ??
          asset.attrs?.["id"] ??
          (typeof asset.children === "string" ? asset.children : asset.tag);

        return <Asset key={`tsr-scripts-${assetKey}`} {...asset} />;
      })}
    </>
  );
};
