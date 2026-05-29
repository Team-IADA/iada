"use client";

import { useState } from "react";

interface Props {
  judgeName: string;
  initialSubmitted: boolean;
  allScored: boolean;
}

export default function SubmitSection({ judgeName, initialSubmitted, allScored }: Props) {
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  if (submitted) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 text-center">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-3">Scores Submitted</h2>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto">
          Thank you, {judgeName}. Your scores have been submitted to the IADA team.
          We appreciate your time and valuable contribution to the International Annual Report Design Awards 2026.
        </p>
      </div>
    );
  }

  if (!allScored) return null;

  async function handleConfirm() {
    setLoading(true);
    const res = await fetch("/api/judge/submit", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setConfirming(false);
      setSubmitted(true);
    }
  }

  return (
    <>
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-green-900">All entries scored</p>
          <p className="text-xs text-green-700 mt-0.5">You&apos;re ready to submit your scores to IADA.</p>
        </div>
        <button
          onClick={() => setConfirming(true)}
          className="shrink-0 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          Submit My Scores
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h2 className="text-base font-semibold text-zinc-900 mb-2">Submit your scores?</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Are you sure you want to submit? You won&apos;t be able to change your scores after submitting.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                {loading ? "Submitting…" : "Yes, submit"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
