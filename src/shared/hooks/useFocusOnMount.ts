import { useEffect, useRef } from "react";

/**
 * Custom hook to focus an element when the component mounts
 * Useful for improving form UX by automatically focusing the first input
 *
 * @example
 * const emailInputRef = useFocusOnMount<HTMLInputElement>();
 *
 * return <input ref={emailInputRef} type="email" />
 */
export function useFocusOnMount<T extends HTMLElement = HTMLElement>(shouldFocus = true) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      // Use setTimeout to ensure the element is fully rendered
      const timeoutId = setTimeout(() => {
        elementRef.current?.focus();
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldFocus]);

  return elementRef;
}

/**
 * Create refs for managing focus between multiple elements
 * Useful for form navigation with keyboard (Tab, Shift+Tab)
 *
 * @example
 * const focusManager = createFocusManager(3);
 *
 * return (
 *   <>
 *     <input ref={focusManager.refs[0]} onKeyDown={(e) => e.key === 'Enter' && focusManager.focusNext(0)} />
 *     <input ref={focusManager.refs[1]} />
 *     <input ref={focusManager.refs[2]} />
 *   </>
 * )
 */
export function createFocusManager<T extends HTMLElement = HTMLElement>(count: number) {
  const refs = Array.from({ length: count }, () => ({ current: null as T | null }));

  const focusNext = (currentIndex: number) => {
    const nextIndex = (currentIndex + 1) % count;
    refs[nextIndex].current?.focus();
  };

  const focusPrevious = (currentIndex: number) => {
    const prevIndex = (currentIndex - 1 + count) % count;
    refs[prevIndex].current?.focus();
  };

  const focusFirst = () => {
    refs[0].current?.focus();
  };

  const focusLast = () => {
    refs[count - 1].current?.focus();
  };

  return {
    refs,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}
