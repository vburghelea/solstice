import { useReducer } from "react";
import type { ProfileInputType } from "~/features/profile/profile.schemas";

export type StepId = "personal" | "emergency" | "privacy";

interface ProfileFormState {
  currentStep: StepId;
  isSubmitting: boolean;
  error: string | null;
  formData: ProfileInputType;
  emergencyContactStarted: boolean;
}

type ProfileFormAction =
  | { type: "SET_STEP"; step: StepId }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "UPDATE_FORM_DATA"; data: Partial<ProfileInputType> }
  | { type: "SET_EMERGENCY_STARTED"; started: boolean }
  | { type: "RESET_FORM" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; error: string };

const initialState: ProfileFormState = {
  currentStep: "personal",
  isSubmitting: false,
  error: null,
  formData: {
    gender: "",
    pronouns: "",
    phone: "",
    privacySettings: {
      showEmail: false,
      showPhone: false,
      allowTeamInvitations: true,
    },
  },
  emergencyContactStarted: false,
};

function profileFormReducer(
  state: ProfileFormState,
  action: ProfileFormAction,
): ProfileFormState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step, error: null };

    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "UPDATE_FORM_DATA":
      return {
        ...state,
        formData: { ...state.formData, ...action.data },
      };

    case "SET_EMERGENCY_STARTED":
      return { ...state, emergencyContactStarted: action.started };

    case "RESET_FORM":
      return initialState;

    case "SUBMIT_START":
      return { ...state, isSubmitting: true, error: null };

    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false, error: null };

    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false, error: action.error };

    default:
      return state;
  }
}

/**
 * Custom hook for managing profile form state with a reducer
 * Groups related state together and provides consistent update patterns
 */
export function useProfileFormReducer() {
  const [state, dispatch] = useReducer(profileFormReducer, initialState);

  return {
    state,
    dispatch,
    // Convenience methods
    setStep: (step: StepId) => dispatch({ type: "SET_STEP", step }),
    updateFormData: (data: Partial<ProfileInputType>) =>
      dispatch({ type: "UPDATE_FORM_DATA", data }),
    setEmergencyStarted: (started: boolean) =>
      dispatch({ type: "SET_EMERGENCY_STARTED", started }),
    submitStart: () => dispatch({ type: "SUBMIT_START" }),
    submitSuccess: () => dispatch({ type: "SUBMIT_SUCCESS" }),
    submitError: (error: string) => dispatch({ type: "SUBMIT_ERROR", error }),
    resetForm: () => dispatch({ type: "RESET_FORM" }),
  };
}
