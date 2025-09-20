import type { RowSelectionState } from "@tanstack/react-table";

export interface SelectionState {
  signature: string;
  selection: RowSelectionState;
}

export type SelectionAction =
  | { type: "reset"; signature: string }
  | {
      type: "update";
      signature: string;
      updater: RowSelectionState | ((previous: RowSelectionState) => RowSelectionState);
    };

export const createInitialSelectionState = (signature: string): SelectionState => ({
  signature,
  selection: {},
});

export const selectionReducer = (
  state: SelectionState,
  action: SelectionAction,
): SelectionState => {
  switch (action.type) {
    case "reset": {
      if (state.signature === action.signature) {
        return state;
      }
      return { signature: action.signature, selection: {} };
    }
    case "update": {
      const baseSelection = state.signature === action.signature ? state.selection : {};
      const nextSelection =
        typeof action.updater === "function"
          ? action.updater(baseSelection)
          : action.updater;
      return {
        signature: action.signature,
        selection: nextSelection,
      };
    }
    default:
      return state;
  }
};

export const resolveSelectionForSignature = (
  state: SelectionState,
  signature: string,
): RowSelectionState => (state.signature === signature ? state.selection : {});

export const clearSelectionAction = (signature: string): SelectionAction => ({
  type: "update",
  signature,
  updater: () => ({}),
});
