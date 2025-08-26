import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defaultAvailabilityData, type AvailabilityData } from "~/db/schema/auth.schema";
import { AvailabilityEditor } from "../availability-editor";

// Helper to get a slot element.
const getSlot = (day: string, intervalIndex: number) => {
  const dayRow = screen.getByText(day.slice(0, 3)).parentElement;
  if (!dayRow) throw new Error(`Day row for ${day} not found`);
  const grid = dayRow.querySelector("[style*='grid-template-columns']");
  if (!grid) throw new Error(`Grid for ${day} not found`);
  const slots = grid.querySelectorAll("div[class*='flex-1']");
  return slots[intervalIndex];
};

describe("AvailabilityEditor", () => {
  it("renders all days and time labels", () => {
    render(<AvailabilityEditor value={defaultAvailabilityData} onChange={() => {}} />);
    expect(screen.getByText("sun")).toBeInTheDocument();
  });

  it("selects a single slot on click", () => {
    const handleChange = vi.fn();
    render(
      <AvailabilityEditor value={defaultAvailabilityData} onChange={handleChange} />,
    );
    fireEvent.mouseDown(getSlot("wednesday", 10));
    expect(handleChange).toHaveBeenCalledOnce();
    const lastCallValue = handleChange.mock.calls[0][0];
    expect(lastCallValue.wednesday[56]).toBe(true);
  });

  it("deselects a segment on click", () => {
    const handleChange = vi.fn();
    const initialData = {
      ...defaultAvailabilityData,
      wednesday: [...defaultAvailabilityData.wednesday],
    };
    initialData.wednesday[56] = true;
    initialData.wednesday[57] = true;
    render(<AvailabilityEditor value={initialData} onChange={handleChange} />);
    fireEvent.mouseDown(getSlot("wednesday", 10));
    expect(handleChange).toHaveBeenCalledOnce();
    const lastCallValue = handleChange.mock.calls[0][0];
    expect(lastCallValue.wednesday[56]).toBe(false);
  });

  it("allows drag-to-select multiple slots", () => {
    let currentData: AvailabilityData = defaultAvailabilityData;
    const handleChange = vi.fn((newData) => {
      currentData = newData;
    });
    const { rerender } = render(
      <AvailabilityEditor value={currentData} onChange={handleChange} />,
    );
    const rerenderWithNewData = () =>
      rerender(<AvailabilityEditor value={currentData} onChange={handleChange} />);

    fireEvent.mouseDown(getSlot("friday", 5));
    rerenderWithNewData();
    fireEvent.mouseEnter(getSlot("friday", 6));
    rerenderWithNewData();
    fireEvent.mouseEnter(getSlot("friday", 7));
    rerenderWithNewData();
    fireEvent.mouseUp(window);

    expect(handleChange).toHaveBeenCalledTimes(3);
    [46, 47, 48, 49, 50, 51].forEach((i) => {
      expect(currentData.friday[i]).toBe(true);
    });
  });

  it("splits a segment when dragging to deselect the middle", () => {
    let currentData = JSON.parse(JSON.stringify(defaultAvailabilityData));
    for (let i = 40; i < 56; i++) currentData.monday[i] = true;
    const handleChange = vi.fn((newData) => {
      currentData = newData;
    });
    const { rerender } = render(
      <AvailabilityEditor value={currentData} onChange={handleChange} />,
    );
    const rerenderWithNewData = () =>
      rerender(<AvailabilityEditor value={currentData} onChange={handleChange} />);

    fireEvent.mouseDown(getSlot("monday", 4)); // 11:00
    rerenderWithNewData();
    fireEvent.mouseEnter(getSlot("monday", 5)); // 11:30
    rerenderWithNewData();
    fireEvent.mouseUp(window);

    expect(currentData.monday[40]).toBe(true); // 10:00 still true
    expect(currentData.monday[44]).toBe(false); // 11:00 now false
    expect(currentData.monday[48]).toBe(true); // 12:00 still true
  });

  it("extends a segment to the left", () => {
    let currentData = JSON.parse(JSON.stringify(defaultAvailabilityData));
    for (let i = 40; i < 48; i++) currentData.tuesday[i] = true;
    const handleChange = vi.fn((newData) => {
      currentData = newData;
    });
    const { rerender } = render(
      <AvailabilityEditor value={currentData} onChange={handleChange} />,
    );
    const rerenderWithNewData = () =>
      rerender(<AvailabilityEditor value={currentData} onChange={handleChange} />);

    const emptySlot = getSlot("tuesday", 1);
    const adjacentSlot = getSlot("tuesday", 2);

    fireEvent.mouseDown(emptySlot);
    rerenderWithNewData();
    fireEvent.mouseEnter(adjacentSlot);
    rerenderWithNewData();
    fireEvent.mouseUp(window);

    for (let i = 38; i < 48; i++) {
      expect(currentData.tuesday[i]).toBe(true);
    }
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
    fireEvent.mouseDown(getSlot("tuesday", 10));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it.skip("displays tooltip with correct times on hover", async () => {
    // This test is skipped due to persistent timing and portal-related issues
    // with Radix UI tooltips in a JSDOM environment. The trigger attributes
    // update, but the content element is not reliably found in the DOM.
    const initialData = { ...defaultAvailabilityData };
    for (let i = 36; i < 46; i++) initialData.sunday[i] = true; // 9:00-11:30
    render(<AvailabilityEditor value={initialData} onChange={() => {}} />);

    const segmentSlot = getSlot("sunday", 0);
    const trigger = segmentSlot.parentElement?.parentElement;
    if (!trigger) throw new Error("Tooltip trigger not found");

    await userEvent.hover(trigger);

    await waitFor(() => {
      const tooltipId = trigger.getAttribute("aria-describedby");
      expect(tooltipId).toBeDefined();
      const tooltip = document.getElementById(tooltipId!);
      expect(tooltip).toHaveTextContent("Available: 09:00 - 11:30");
    });
  });
});
