"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  label: string;
  description: string | null;
  score: number | null;
}

interface Props {
  entryId: number;
  questions: Question[];
  locked?: boolean;
}

export default function ScoreForm({ entryId, questions: initial, locked = false }: Props) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<number, number>>(
    Object.fromEntries(initial.map((q) => [q.id, q.score ?? 0]))
  );
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(
    new Set(initial.filter((q) => q.score !== null).map((q) => q.id))
  );

  async function submitScore(questionId: number, score: number) {
    if (score < 1 || score > 10) return;
    setSaving(questionId);

    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: entryId, question_id: questionId, score }),
    });

    setSaved((prev) => new Set([...prev, questionId]));
    setSaving(null);

    const allDone = initial.every(
      (q) => (Number(q.id) === questionId ? score : scores[q.id] ?? 0) >= 1
    );
    if (allDone) router.refresh();
  }

  const allScored = initial.every((q) => (scores[q.id] ?? 0) >= 1);

  return (
    <div className="space-y-4">
      {locked && (
        <div className="rounded-2xl bg-zinc-100 border border-zinc-200 px-5 py-3 flex items-center gap-2 text-sm text-zinc-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
          </svg>
          Scores submitted — view only
        </div>
      )}

      {initial.map((q) => (
        <div key={q.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <p className="text-sm font-semibold text-zinc-900">{q.label}</p>
            {!locked && saved.has(q.id) && (
              <span className="shrink-0 text-xs text-green-600 font-medium">Saved</span>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => {
                  if (locked) return;
                  setScores((prev) => ({ ...prev, [q.id]: n }));
                  submitScore(q.id, n);
                }}
                disabled={locked || saving === q.id}
                className={[
                  "w-9 h-9 rounded-lg text-sm font-semibold transition-all",
                  scores[q.id] === n
                    ? locked ? "bg-zinc-400 text-white" : "bg-zinc-900 text-white shadow-sm"
                    : locked ? "bg-zinc-50 text-zinc-300 cursor-not-allowed" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
                  saving === q.id ? "opacity-50 cursor-wait" : "",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!locked && allScored && (
        <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-3 text-sm font-medium text-green-800">
          All criteria scored
        </div>
      )}
    </div>
  );
}
