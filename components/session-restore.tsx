"use client";

import { useEffect } from "react";
import { restoreLogin } from "@/lib/auth";

// Runs once when the app opens: brings back the login from the backend's refresh cookie.
export function SessionRestore() {
  useEffect(() => {
    void restoreLogin();
  }, []);
  return null;
}
