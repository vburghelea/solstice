import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultAvailabilityData } from "~/db/schema/auth.schema";
import { AvailabilityEditor } from "../availability-editor";

describe("AvailabilityEditor", () => {
  it("renders all days and time slots", () => {
    render(<AvailabilityEditor value={defaultAvailabilityData} onChange={() => {}} />);

    expect(screen.getByText("sun")).toBeInTheDocument();
    expect(screen.getByText("mon")).toBeInTheDocument();
    expect(screen.getByText("tue")).toBeInTheDocument();

    // Check for a few slots
    expect(screen.getByTestId("slot-sunday-0")).toBeInTheDocument();
    expect(screen.getByTestId("slot-monday-48")).toBeInTheDocument();
    expect(screen.getByTestId("slot-saturday-95")).toBeInTheDocument();
  });

  it("calls onChange with updated value when a slot is clicked", () => {
    const handleChange = vi.fn();
    render(
      <AvailabilityEditor value={defaultAvailabilityData} onChange={handleChange} />,
    );

    const slot = screen.getByTestId("slot-wednesday-30");
    fireEvent.click(slot);

    expect(handleChange).toHaveBeenCalledTimes(1);
    const newValue = handleChange.mock.calls[0][0];
    expect(newValue.wednesday[30]).toBe(true);
  });

  it.skip("allows drag-to-select multiple slots", () => {
    const handleChange = vi.fn();
    render(
      <AvailabilityEditor value={defaultAvailabilityData} onChange={handleChange} />,
    );

    const startSlot = screen.getByTestId("slot-friday-10");
    const middleSlot = screen.getByTestId("slot-friday-11");
    const endSlot = screen.getByTestId("slot-friday-12");
    const editor = screen.getByTestId("availability-editor");

    fireEvent.mouseDown(startSlot);
    fireEvent.mouseEnter(middleSlot);
    fireEvent.mouseEnter(endSlot);
    fireEvent.mouseUp(editor);

    const lastCallValue = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCallValue.friday[10]).toBe(true);
    expect(lastCallValue.friday[11]).toBe(true);
    expect(lastCallValue.friday[12]).toBe(true);
  });

  it("is non-interactive when readOnly is true", () => {
    const handleChange = vi.fn();
    render(
      <AvailabilityEditor
        value={defaultAvailabilityData}
        onChange={handleChange}
        readOnly
      />,
    );

    const slot = screen.getByTestId("slot-tuesday-20");
    fireEvent.click(slot);

    expect(handleChange).not.toHaveBeenCalled();
  });
});
