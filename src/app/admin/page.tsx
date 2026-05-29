import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import { sql } from "@/lib/pg";
import UploadForm from "./UploadForm";
import ResetButton from "./ResetButton";
import DownloadButton from "./DownloadButton";
import JudgeRow from "./JudgeRow";
import ResultsSection from "./ResultsSection";

interface JudgeRecord extends Record<string, unknown> {
  id: number;
  name: string;
  access_code: string;
  submitted_at: string | null;
  completed_entries: number;
  total_entries: number;
}

function formatDate(iso: string): string {
  const [date] = iso.split("T")[0] ? [iso.split("T")[0]] : iso.split(" ");
  const [year, month, day] = date.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

export default async function AdminPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const [judgesResult, totalResult] = await Promise.all([
    sql<JudgeRecord>`
      WITH entry_question_counts AS (
        SELECT e.id AS entry_id, COUNT(q.id) AS question_count
        FROM entries e
        JOIN questions q ON q.category_id = e.category_id
        WHERE e.is_active = 1
        GROUP BY e.id
      ),
      judge_entry_scores AS (
        SELECT judge_id, entry_id, COUNT(*) AS scored_count
        FROM scores
        GROUP BY judge_id, entry_id
      )
      SELECT
        j.id, j.name, j.access_code, j.submitted_at,
        COUNT(DISTINCT CASE
          WHEN jes.scored_count >= eqc.question_count THEN eqc.entry_id
        END) AS completed_entries,
        COUNT(DISTINCT eqc.entry_id) AS total_entries
      FROM judges j
      CROSS JOIN entry_question_counts eqc
      LEFT JOIN judge_entry_scores jes ON jes.judge_id = j.id AND jes.entry_id = eqc.entry_id
      WHERE j.is_active = 1
      GROUP BY j.id, j.name, j.access_code, j.submitted_at
      ORDER BY j.name
    `,
    sql<{ n: number; last_uploaded: string | null }>`
      SELECT COUNT(*) AS n, MAX(created_at) AS last_uploaded
      FROM entries WHERE is_active = 1
    `,
  ]);

  const judges = judgesResult;
  const totalEntries = Number(totalResult[0]?.n ?? 0);
  const lastUploaded = totalResult[0]?.last_uploaded ?? null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">IADA Admin Panel</h1>
            <p className="text-xs text-zinc-400 mt-0.5">International Annual Report Design Awards</p>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* PRE-JUDGING */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pre-Judging</h2>
            <div className="mt-3 border-t border-zinc-200" />
          </div>

          {/* Upload entries */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Upload Entries CSV</h3>
            <UploadForm
              endpoint="/api/admin/upload-entries"
              label="Upload"
              description="Replaces all existing entries and clears all scores."
            />
            {totalEntries > 0 && lastUploaded && (
              <p className="mt-3 text-xs text-zinc-400">
                {totalEntries} entries imported · Last uploaded {formatDate(String(lastUploaded))}
              </p>
            )}
          </div>

          {/* Judges */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Judges</h3>
            {totalEntries === 0 ? (
              <p className="text-sm text-zinc-400">No entries loaded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Access Code</th>
                    <th className="pb-3 pr-4 text-right">Progress</th>
                    <th className="pb-3 text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {judges.map((judge: JudgeRecord) => (
                    <JudgeRow
                      key={judge.id}
                      id={judge.id}
                      name={judge.name}
                      accessCode={judge.access_code}
                      completedEntries={Number(judge.completed_entries)}
                      totalEntries={totalEntries}
                      submittedAt={judge.submitted_at}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Reset */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">Reset</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Clears all entries and scores. Use this to start fresh for a new year.
            </p>
            <ResetButton />
          </div>
        </section>

        {/* POST-JUDGING */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Post-Judging</h2>
            <div className="mt-3 border-t border-zinc-200" />
          </div>

          {/* Upload winners */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Upload Winners CSV</h3>
            <UploadForm
              endpoint="/api/admin/upload-winners"
              label="Upload"
              description="Same format as entries CSV. Updates award_tier for each entry matched by entry_no."
            />
          </div>

          {/* Downloads */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Generate Mailing List</h3>
              <p className="text-xs text-zinc-500 mb-3">
                Downloads a numbered .txt file with company name, contact, and address for each entry.
              </p>
              <DownloadButton
                endpoint="/api/admin/mailing-list"
                filename="iada-mailing-list.txt"
                label="Download .txt"
              />
            </div>

            <div className="border-t border-zinc-100 pt-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Generate Certificate Data</h3>
              <p className="text-xs text-zinc-500 mb-3">
                Downloads a .csv ready for InDesign Data Merge with award tier, company, report title, and contact fields.
              </p>
              <DownloadButton
                endpoint="/api/admin/certificate-data"
                filename="iada-certificate-data.csv"
                label="Download .csv"
              />
            </div>
          </div>
        </section>

        <ResultsSection />

      </main>
    </div>
  );
}
