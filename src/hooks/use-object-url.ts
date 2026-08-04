"use client";

import { useEffect, useMemo } from "react";

/** Exposes a blob as an object URL and revokes it once it is no longer used. */
export function useObjectUrl(blob: Blob) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return url;
}
