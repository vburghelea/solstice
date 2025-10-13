import type { ConsentState } from "c15t";

type ConsentStateListener = (state: ConsentState) => void;

let consentSnapshot: ConsentState = {
  necessary: true,
  measurement: false,
  marketing: false,
  functionality: false,
  experience: false,
};

const listeners = new Set<ConsentStateListener>();

export function getConsentStateSnapshot(): ConsentState {
  return consentSnapshot;
}

export function setConsentStateSnapshot(next: ConsentState): void {
  consentSnapshot = next;
  for (const listener of listeners) {
    listener(consentSnapshot);
  }
}

export function subscribeToConsentState(listener: ConsentStateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasMeasurementConsent(): boolean {
  return Boolean(consentSnapshot?.measurement);
}
