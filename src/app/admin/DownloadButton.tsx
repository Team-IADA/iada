"use client";

import { useState } from "react";

interface Props {
  endpoint: string;
  filename: string;
  label: string;
}

export default function DownloadButton({ endpoint, filename, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setLoading(true);
    setError("");

    const res = await fetch(endpoint);
    if (!res.ok) {
      setError("Failed to generate file");
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-400 disabled:opacity-40 transition-colors"
      >
        {loading ? "Generating…" : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
