import { redirect } from "next/navigation";
import { getSessionJudge } from "@/lib/auth";
import { getEntriesForJudge } from "@/lib/db";
import Link from "next/link";
import SubmitSection from "./SubmitSection";

export default async function JudgeDashboard() {
  const judge = await getSessionJudge();
  if (!judge) redirect("/login");

  const entries = await getEntriesForJudge(judge.id) as Array<{
    id: number;
    entry_code: string;
    title: string;
    category_name: string;
    total_questions: number;
    scored_questions: number;
  }>;

  const totalEntries = entries.length;
  const completedEntries = entries.filter(
    (e) => e.scored_questions >= e.total_questions && e.total_questions > 0
  ).length;
  const allScored = totalEntries > 0 && completedEntries >= totalEntries;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">IADA Jury Portal</h1>
            <p className="text-sm text-zinc-500">Welcome, {judge.name}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-zinc-200 px-6 py-5">
          <p className="text-lg font-semibold text-zinc-900">Welcome, {judge.name}</p>
          <p className="text-sm text-zinc-500 mt-1">Thank you for joining IADA 2026 as a jury member.</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-900">{completedEntries}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Completed</p>
            </div>
            <div className="h-10 w-px bg-zinc-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-900">{totalEntries - completedEntries}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Remaining</p>
            </div>
            <div className="h-10 w-px bg-zinc-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-900">{totalEntries}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total</p>
            </div>
          </div>
          {totalEntries > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-900 rounded-full transition-all"
                  style={{ width: `${(completedEntries / totalEntries) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <SubmitSection
          judgeName={judge.name}
          initialSubmitted={!!judge.submitted_at}
          allScored={allScored}
        />

        {totalEntries > 0 && (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const done = entry.scored_questions >= entry.total_questions && entry.total_questions > 0;
              return (
                <Link
                  key={entry.id}
                  href={`/judge/score/${entry.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-zinc-200 px-4 py-3.5 hover:border-zinc-400 transition-colors"
                >
                  <span className="w-7 shrink-0 text-sm font-medium text-zinc-400 text-right">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{entry.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{entry.category_name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-zinc-400">
                      {entry.scored_questions}/{entry.total_questions}
                    </span>
                    {done ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        Pending
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalEntries === 0 && (
          <div className="text-center py-16 text-zinc-400">
            <p className="text-sm">No entries assigned yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
