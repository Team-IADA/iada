"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  endpoint: string;
  label: string;
  description: string;
  onSuccess?: (result: Record<string, unknown>) => void;
}

export default function UploadForm({ endpoint, label, description, onSuccess }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(endpoint, { method: "POST", body: formData });
    const data = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      setStatus("error");
      setMessage((data.error as string) ?? "Upload failed");
      return;
    }

    setStatus("success");
    const parts: string[] = [];
    if (typeof data.imported === "number") parts.push(`${data.imported} imported`);
    if (typeof data.updated === "number") parts.push(`${data.updated} updated`);
    if (typeof data.skipped === "number" && data.skipped > 0) parts.push(`${data.skipped} skipped`);
    const unmatched = data.unmatched as string[] | undefined;
    if (unmatched?.length) parts.push(`unmatched categories: ${unmatched.join(", ")}`);
    setMessage(parts.join(" · ") || "Done");
    if (inputRef.current) inputRef.current.value = "";
    onSuccess?.(data);
    router.refresh();
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-2">{description}</p>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={() => { setStatus("idle"); setMessage(""); }}
          className="flex-1 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
        />
        <button
          onClick={handleUpload}
          disabled={status === "uploading"}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
        >
          {status === "uploading" ? "Uploading…" : label}
        </button>
      </div>
      {message && (
        <p className={`mt-2 text-xs ${status === "error" ? "text-red-600" : "text-green-700"}`}>
          {status === "success" ? "✓ " : "✗ "}{message}
        </p>
      )}
    </div>
  );
}
