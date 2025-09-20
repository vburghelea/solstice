import type { RowSelectionState } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import {
  clearSelectionAction,
  createInitialSelectionState,
  resolveSelectionForSignature,
  selectionReducer,
  type SelectionState,
} from "../systems-dashboard-selection";

describe("systems dashboard selection reducer", () => {
  it("returns the existing state when resetting with the same signature", () => {
    const initial: SelectionState = {
      signature: "page-1",
      selection: { "1": true },
    };

    const result = selectionReducer(initial, { type: "reset", signature: "page-1" });

    expect(result).toBe(initial);
  });

  it("clears selection when the dataset signature changes", () => {
    const initial: SelectionState = {
      signature: "page-1",
      selection: { "1": true, "2": true },
    };

    const result = selectionReducer(initial, { type: "reset", signature: "page-2" });

    expect(result).not.toBe(initial);
    expect(result.signature).toBe("page-2");
    expect(result.selection).toEqual({});
  });

  it("merges selection updates when the signature matches", () => {
    const initial: SelectionState = {
      signature: "page-1",
      selection: { "1": true },
    };

    const result = selectionReducer(initial, {
      type: "update",
      signature: "page-1",
      updater: (previous) => ({ ...previous, "2": true }),
    });

    expect(result.signature).toBe("page-1");
    expect(result.selection).toEqual({ "1": true, "2": true });
  });

  it("drops stale selection when updating with a new signature", () => {
    const initial: SelectionState = {
      signature: "page-1",
      selection: { "1": true },
    };

    const result = selectionReducer(initial, {
      type: "update",
      signature: "page-2",
      updater: (previous) => ({ ...previous, "3": true }),
    });

    expect(result.signature).toBe("page-2");
    expect(result.selection).toEqual({ "3": true });
  });
});

describe("systems dashboard selection helpers", () => {
  it("creates an empty selection state for a new signature", () => {
    const state = createInitialSelectionState("page-1");

    expect(state).toEqual({ signature: "page-1", selection: {} });
  });

  it("resolves the current selection when signatures align", () => {
    const state: SelectionState = {
      signature: "page-1",
      selection: { "2": true },
    };

    const resolved = resolveSelectionForSignature(state, "page-1");

    expect(resolved).toBe(state.selection);
  });

  it("returns an empty selection when signatures diverge", () => {
    const state: SelectionState = {
      signature: "page-1",
      selection: { "2": true },
    };

    const resolved = resolveSelectionForSignature(state, "page-2");

    expect(resolved).toEqual({});
  });

  it("produces an action that clears the current selection", () => {
    const action = clearSelectionAction("page-1");
    const selection: RowSelectionState = { "4": true };
    const state: SelectionState = {
      signature: "page-1",
      selection,
    };

    const result = selectionReducer(state, action);

    expect(result.selection).toEqual({});
    expect(result.signature).toBe("page-1");
  });
});
