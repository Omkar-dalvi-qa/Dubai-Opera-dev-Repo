"use client";

import { useEffect } from "react";

export default function WebChannelApi() {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      let url = input.toString();

      if (url.startsWith("/api/") && !url.includes("channel=")) {
        url += url.includes("?") ? "&channel=web" : "?channel=web";
      }

      return originalFetch(url, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}