"use client";

import { useConsentManager } from "@c15t/react";
import { useEffect } from "react";
import { setConsentStateSnapshot } from "../state";

export function ConsentStateSync() {
  const { consents } = useConsentManager();

  useEffect(() => {
    setConsentStateSnapshot(consents);
  }, [consents]);

  return null;
}
