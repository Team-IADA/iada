"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    await fetch("/api/admin/reset", { method: "POST" });
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
      >
        Reset all entries &amp; scores
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-red-600 font-medium">This cannot be undone. Confirm?</span>
      <button
        onClick={handleReset}
        disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Resetting…" : "Yes, reset"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
