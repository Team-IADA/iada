"use client";

import { useState } from "react";

export interface ResultRow {
  entry_code: string;
  submitter_name: string | null;
  title: string;
  category_name: string;
  question_count: number;
  judge_totals: number[];
  combined_total: number;
  max_possible: number;
  final_score: number;
}

interface Props {
  rows: ResultRow[];
  judgeNames: string[];
}

export default function ResultsTable({ rows, judgeNames }: Props) {
  const [sortBy, setSortBy] = useState<"entry_no" | "final_score">("entry_no");

  const sorted = [...rows].sort((a, b) =>
    sortBy === "entry_no"
      ? parseInt(a.entry_code) - parseInt(b.entry_code)
      : b.final_score - a.final_score
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-zinc-400 mr-1">Sort:</span>
        <button
          onClick={() => setSortBy("entry_no")}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
            sortBy === "entry_no"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Entry No
        </button>
        <button
          onClick={() => setSortBy("final_score")}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
            sortBy === "final_score"
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Final Score ↓
        </button>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wide border-b border-zinc-100">
              <th className="pb-3 pr-4">Entry</th>
              <th className="pb-3 pr-4">Company</th>
              <th className="pb-3 pr-4">Report Title</th>
              <th className="pb-3 pr-6">Category</th>
              {judgeNames.map((name, i) => (
                <th key={i} className="pb-3 pr-4 text-right">{name}</th>
              ))}
              <th className="pb-3 pr-4 text-right">Total</th>
              <th className="pb-3 pr-4 text-right">Max</th>
              <th className="pb-3 text-right">Score %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map((row) => (
              <tr key={row.entry_code} className="hover:bg-zinc-50">
                <td className="py-2.5 pr-4 font-mono text-xs text-zinc-500">{row.entry_code}</td>
                <td className="py-2.5 pr-4 text-zinc-600 max-w-[180px] truncate">{row.submitter_name ?? "—"}</td>
                <td className="py-2.5 pr-4 text-zinc-900 max-w-[220px] truncate">{row.title}</td>
                <td className="py-2.5 pr-6">
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {row.category_name}
                  </span>
                </td>
                {row.judge_totals.map((total, i) => (
                  <td key={i} className="py-2.5 pr-4 text-right tabular-nums text-zinc-600">{total}</td>
                ))}
                <td className="py-2.5 pr-4 text-right tabular-nums font-semibold text-zinc-900">{row.combined_total}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-400 text-xs">{row.max_possible}</td>
                <td className="py-2.5 text-right">
                  <span className="inline-flex items-center rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                    {row.final_score.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
