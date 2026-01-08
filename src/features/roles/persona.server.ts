import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { PersonaResolution } from "~/features/roles/persona.types";
import { personaIdSchema } from "~/features/roles/persona.types";

const resolvePersonaInputSchema = z
  .object({
    preferredPersonaId: personaIdSchema.nullable().optional(),
    forceRefresh: z.boolean().optional(),
  })
  .default({});

export const resolvePersonaResolution = createServerFn({ method: "POST" })
  .inputValidator((input) => resolvePersonaInputSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<PersonaResolution> => {
    const [{ PermissionService }, { getAuth }, { getRequest }] = await Promise.all([
      import("~/features/roles/permission.server"),
      import("~/lib/auth/server-helpers"),
      import("@tanstack/react-start/server"),
    ]);

    const auth = await getAuth();
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    return PermissionService.resolvePersonaResolution(session?.user?.id ?? null, {
      preferredPersonaId: data.preferredPersonaId ?? null,
      forceRefresh: data.forceRefresh ?? false,
    });
  });
