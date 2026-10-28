"use client";

import { useEffect } from "react";
import { sweepStorage } from "@/lib/storage-cleanup";

// Runs the browser-storage cleanup (lib/storage-cleanup.ts) once per page load, when the browser is
// idle so it never delays the first paint. Renders nothing.
export function StorageCleanup() {
  useEffect(() => {
    const run = () => sweepStorage();
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 2000);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
