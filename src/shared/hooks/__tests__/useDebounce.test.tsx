import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { act, render } from "~/tests/utils";

import { useDebounce } from "../useDebounce";

type HarnessProps = {
  value: string;
  delay?: number;
  onValue: (value: string) => void;
};

function DebounceHarness({ value, delay, onValue }: HarnessProps) {
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    onValue(debouncedValue);
  }, [debouncedValue, onValue]);

  return null;
}

describe("useDebounce", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("delays updates by the provided duration", () => {
    vi.useFakeTimers();
    const onValue = vi.fn();

    const { rerender } = render(
      <DebounceHarness value="initial" delay={200} onValue={onValue} />,
    );

    expect(onValue).toHaveBeenCalledTimes(1);
    expect(onValue).toHaveBeenLastCalledWith("initial");

    rerender(<DebounceHarness value="next" delay={200} onValue={onValue} />);

    expect(onValue).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(onValue).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onValue).toHaveBeenCalledTimes(2);
    expect(onValue).toHaveBeenLastCalledWith("next");
  });

  it("falls back to 500ms when delay is not provided", () => {
    vi.useFakeTimers();
    const onValue = vi.fn();

    const { rerender } = render(<DebounceHarness value="initial" onValue={onValue} />);

    expect(onValue).toHaveBeenCalledTimes(1);
    expect(onValue).toHaveBeenLastCalledWith("initial");

    rerender(<DebounceHarness value="later" onValue={onValue} />);

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onValue).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onValue).toHaveBeenCalledTimes(2);
    expect(onValue).toHaveBeenLastCalledWith("later");
  });
});
