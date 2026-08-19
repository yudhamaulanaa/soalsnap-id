"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Rehidrasi store dari localStorage setelah mount. Dijalankan manual
 * (`skipHydration`) agar render pertama di klien identik dengan HTML server.
 */
export function StoreHydration() {
  useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);
  return null;
}
