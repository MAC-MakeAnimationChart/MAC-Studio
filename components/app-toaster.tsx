"use client";

import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import { useApplyTheme, useTheme } from "@/lib/theme";

// App-wide toasts and the theme sync, rendered once in the layout.
// Placement: bottom-left, away from the header buttons, the options panel and the page content;
// full width on phones (sonner does that itself). Calls should use a fixed `id` so repeats replace
// each other instead of stacking, a short duration for success, and a long one for errors.
export function AppToaster() {
  useApplyTheme();
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="bottom-left"
      closeButton
      visibleToasts={2}
      duration={3000}
      offset={{ bottom: 20, left: 16 }}
      mobileOffset={{ bottom: 12, left: 12, right: 12 }}
      toastOptions={{
        classNames: {
          toast: "app-toast",
          actionButton: "app-toast-action",
          closeButton: "app-toast-close",
        },
      }}
      style={
        {
          "--normal-bg": "var(--c-bg-ffffff)",
          "--normal-text": "var(--c-text-0c1b4c)",
          "--normal-border": "var(--c-border-e3e6f0)",
          "--border-radius": "8px",
        } as CSSProperties
      }
    />
  );
}
