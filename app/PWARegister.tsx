"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // evita cache atrapalhar o dev
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
