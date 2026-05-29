import { redirect, notFound } from "next/navigation";
import { getSessionJudge } from "@/lib/auth";
import { getJudgeScoresForEntry } from "@/lib/db";
import { sql } from "@/lib/pg";
import ScoreForm from "./ScoreForm";

interface Props {
  params: Promise<{ entryId: string }>;
}

export default async function ScorePage({ params }: Props) {
  const { entryId } = await params;
  const judge = await getSessionJudge();
  if (!judge) redirect("/login");

  const [entryResult, allEntriesResult] = await Promise.all([
    sql<{
      id: number;
      entry_code: string;
      title: string;
      category_name: string;
      category_slug: string;
      submitter_name: string | null;
      format: string | null;
      industry: string | null;
      url: string | null;
    }>`
      SELECT e.*, c.name AS category_name, c.slug AS category_slug
      FROM entries e
      JOIN categories c ON c.id = e.category_id
      WHERE e.id = ${Number(entryId)} AND e.is_active = 1
    `,
    sql<{ id: number }>`
      SELECT id FROM entries WHERE is_active = 1 ORDER BY entry_code::int ASC
    `,
  ]);

  const entry = entryResult[0] ?? null;
  if (!entry) notFound();

  const ids = allEntriesResult.map((e) => e.id);
  const currentIndex = ids.indexOf(entry.id);
  const prevId = currentIndex > 0 ? ids[currentIndex - 1] : null;
  const nextId = currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null;

  const questions = await getJudgeScoresForEntry(judge.id, Number(entryId));

  const metaParts = [entry.format, entry.industry, entry.category_name].filter(Boolean);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <a href="/judge" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors shrink-0">
            ← All entries
          </a>
          <span className="text-zinc-300">|</span>
          <span className="text-sm text-zinc-500 truncate">
            Entry {entry.entry_code} of {ids.length}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Entry info card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-medium text-zinc-400 mb-1">
            {metaParts.join(" / ")}
          </p>
          <h1 className="text-xl font-semibold text-zinc-900">{entry.title}</h1>
          {entry.submitter_name && (
            <p className="text-sm text-zinc-500 mt-1">{entry.submitter_name}</p>
          )}
          <a
            href={entry.url ?? `https://www.iada-award.co.uk/pdf/${entry.entry_code}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View PDF / Report
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
              <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
            </svg>
          </a>
        </div>

        {/* Scoring questions */}
        <ScoreForm
          entryId={entry.id}
          questions={questions as Array<{ id: number; label: string; description: string | null; score: number | null }>}
          locked={!!judge.submitted_at}
        />

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between gap-3 pb-8">
          {prevId ? (
            <a
              href={`/judge/score/${prevId}`}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-400 transition-colors"
            >
              ← Previous
            </a>
          ) : (
            <div />
          )}

          <a
            href="/judge"
            className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            All entries
          </a>

          {nextId ? (
            <a
              href={`/judge/score/${nextId}`}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-400 transition-colors"
            >
              Next →
            </a>
          ) : (
            <div />
          )}
        </div>
      </main>
    </div>
  );
}
