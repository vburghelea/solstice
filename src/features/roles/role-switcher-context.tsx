import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  getGuestPersonaResolution,
  isPersonaAvailable,
  resolvePersonaForContext,
  selectActivePersona,
} from "~/features/roles/persona-resolver";
import type {
  PersonaId,
  PersonaResolution,
  PersonaState,
} from "~/features/roles/persona.types";
import { useCommonTranslation } from "~/hooks/useTypedTranslation";

const STORAGE_KEY = "roundup.activePersona";
const DEFAULT_GUEST_RESOLUTION = getGuestPersonaResolution();

export type RoleSwitcherStatus = "idle" | "switching";

interface RoleSwitcherContextValue {
  resolution: PersonaResolution;
  status: RoleSwitcherStatus;
  error: string | null;
  switchPersona: (personaId: PersonaId) => Promise<void>;
  setResolution: (resolution: PersonaResolution) => void;
  clearError: () => void;
}

interface RoleSwitcherProviderProps {
  initialResolution?: PersonaResolution;
  onSwitch?: (personaId: PersonaId) => Promise<PersonaResolution | void>;
  children: ReactNode;
}

const RoleSwitcherContext = createContext<RoleSwitcherContextValue | null>(null);

export function RoleSwitcherProvider({
  initialResolution = DEFAULT_GUEST_RESOLUTION,
  onSwitch,
  children,
}: RoleSwitcherProviderProps) {
  const { t } = useCommonTranslation();
  const preferredPersonaRef = useRef<PersonaId | null>(readStoredPersona());
  const [resolution, dispatchResolution] = useReducer(
    resolutionReducer,
    initialResolution,
    (initial) => prepareResolution(initial, preferredPersonaRef.current),
  );
  const [status, setStatus] = useState<RoleSwitcherStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const persistPreference = useCallback((personaId: PersonaId | null) => {
    if (typeof window === "undefined") return;

    try {
      if (personaId) {
        window.localStorage.setItem(STORAGE_KEY, personaId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      preferredPersonaRef.current = personaId;
    } catch (storageError) {
      console.warn("Failed to persist persona preference", storageError);
    }
  }, []);

  const setResolution = useCallback((nextResolution: PersonaResolution) => {
    dispatchResolution({
      type: "replace",
      resolution: nextResolution,
      preferredPersonaId: preferredPersonaRef.current,
    });
  }, []);

  useEffect(() => {
    dispatchResolution({
      type: "hydrate",
      resolution: initialResolution,
      preferredPersonaId: preferredPersonaRef.current,
    });
  }, [initialResolution]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const switchPersona = useCallback(
    async (personaId: PersonaId) => {
      const persona = resolution.personas.find((item) => item.id === personaId);

      if (!persona) {
        setError(t("roles.errors.persona_not_found"));
        return;
      }

      if (!isPersonaAvailable(persona)) {
        setError(persona.availabilityReason ?? t("roles.errors.persona_locked"));
        return;
      }

      if (personaId === resolution.activePersonaId) {
        return;
      }

      setStatus("switching");
      setError(null);
      const previousResolution = resolution;

      dispatchResolution({ type: "switch", personaId });
      persistPreference(personaId);

      try {
        const serverResolution = await onSwitch?.(personaId);

        if (serverResolution) {
          setResolution(serverResolution);
        }
      } catch (switchError) {
        console.error("Failed to switch persona", switchError);
        dispatchResolution({
          type: "replace",
          resolution: previousResolution,
          preferredPersonaId: previousResolution.meta.preferredPersonaId,
        });
        setError(
          switchError instanceof Error
            ? switchError.message
            : t("roles.errors.unable_to_switch_persona"),
        );
      } finally {
        setStatus("idle");
      }
    },
    [onSwitch, persistPreference, resolution, setResolution, t],
  );

  const value = useMemo<RoleSwitcherContextValue>(
    () => ({
      resolution,
      status,
      error,
      switchPersona,
      setResolution,
      clearError,
    }),
    [clearError, error, resolution, setResolution, status, switchPersona],
  );

  return <RoleSwitcherContext value={value}>{children}</RoleSwitcherContext>;
}

export function useRoleSwitcher(): RoleSwitcherContextValue {
  const context = use(RoleSwitcherContext);

  if (!context) {
    throw new Error("useRoleSwitcher must be used within a RoleSwitcherProvider");
  }

  return context;
}

export function useActivePersona(): PersonaState {
  const { resolution } = useRoleSwitcher();
  const active = resolution.personas.find(
    (persona) => persona.id === resolution.activePersonaId,
  );

  if (!active) {
    throw new Error("Active persona is missing from the resolution state");
  }

  return active;
}

function readStoredPersona(): PersonaId | null {
  if (typeof window === "undefined") return null;

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return storedValue ? (storedValue as PersonaId) : null;
  } catch (storageError) {
    console.warn("Unable to read persona preference", storageError);
    return null;
  }
}

function prepareResolution(
  resolution: PersonaResolution,
  preferredPersonaId: PersonaId | null,
  previous?: PersonaResolution,
): PersonaResolution {
  const personas = resolution.personas.map((persona) => ({ ...persona }));
  const activePersonaId = selectActivePersona(personas, preferredPersonaId);

  if (
    previous &&
    previous.activePersonaId === activePersonaId &&
    shallowPersonaListEquals(previous.personas, personas)
  ) {
    return previous;
  }

  return {
    activePersonaId,
    personas,
    meta: {
      ...resolution.meta,
      preferredPersonaId: preferredPersonaId ?? resolution.meta.preferredPersonaId,
    },
  } satisfies PersonaResolution;
}

type ResolutionAction =
  | {
      type: "hydrate" | "replace";
      resolution: PersonaResolution;
      preferredPersonaId: PersonaId | null;
    }
  | { type: "switch"; personaId: PersonaId };

function resolutionReducer(
  state: PersonaResolution,
  action: ResolutionAction,
): PersonaResolution {
  switch (action.type) {
    case "hydrate":
    case "replace":
      return prepareResolution(action.resolution, action.preferredPersonaId, state);
    case "switch":
      if (state.activePersonaId === action.personaId) {
        return state;
      }

      return {
        ...state,
        activePersonaId: action.personaId,
        meta: {
          ...state.meta,
          preferredPersonaId: action.personaId,
        },
      } satisfies PersonaResolution;
    default:
      return state;
  }
}

function shallowPersonaListEquals(a: PersonaState[], b: PersonaState[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((persona, index) => {
    const other = b[index];

    return (
      persona.id === other.id &&
      persona.availability === other.availability &&
      persona.availabilityReason === other.availabilityReason &&
      persona.priority === other.priority
    );
  });
}

export function createPersonaResolutionForRoles(options: {
  isAuthenticated: boolean;
  roleNames: string[];
  preferredPersonaId?: PersonaId | null;
}): PersonaResolution {
  return resolvePersonaForContext(
    {
      isAuthenticated: options.isAuthenticated,
      roleNames: options.roleNames,
    },
    {
      preferredPersonaId: options.preferredPersonaId ?? null,
    },
  );
}
