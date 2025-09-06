import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window { XLSX?: unknown }
}

export function useXlsx() {
  const [ready, setReady] = useState(false);
  const loading = useRef(false);

  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    if (loading.current) return;
    loading.current = true;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);
    document.body.appendChild(script);
  }, []);

  const parseFile = useCallback(async (file: File) => {
    if (!window.XLSX) throw new Error("XLSX not loaded");
    const data = await file.arrayBuffer();
    const XLSX = window.XLSX as unknown as {
      read: (data: ArrayBuffer, opts: { type: string }) => { SheetNames: string[]; Sheets: Record<string, unknown> };
      utils: { sheet_to_json: (sheet: unknown, opts: { defval: string }) => Record<string, unknown>[] };
    };
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = (workbook.Sheets as Record<string, unknown>)[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return rows;
  }, []);

  return { ready, parseFile };
}
