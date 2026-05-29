"use client";

import { useState } from "react";

interface Props {
  id: number;
  name: string;
  accessCode: string;
  completedEntries: number;
  totalEntries: number;
  submittedAt: string | null;
}

export default function JudgeRow({ id, name: initialName, accessCode, completedEntries, totalEntries, submittedAt }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/judges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setName(draft.trim());
      setEditing(false);
    }
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
  }

  function copyLink() {
    const url = `${window.location.origin}/?code=${accessCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <tr>
      <td className="py-3 pr-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              className="rounded border border-zinc-300 px-2 py-1 text-sm font-medium text-zinc-900 w-40 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
              autoFocus
            />
            <button
              onClick={save}
              disabled={saving || !draft.trim()}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancel} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900">{name}</span>
            <button
              onClick={() => { setDraft(name); setEditing(true); }}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </td>
      <td className="py-3 pr-4">
        <code className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono text-zinc-700">
          {accessCode}
        </code>
      </td>
      <td className="py-3 pr-4 text-right tabular-nums">
        <div className="flex items-center justify-end gap-2">
          {submittedAt && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Submitted
            </span>
          )}
          <span>
            <span className={completedEntries >= totalEntries && totalEntries > 0 ? "text-green-700 font-semibold" : "text-zinc-600"}>
              {completedEntries}
            </span>
            <span className="text-zinc-400"> / {totalEntries}</span>
          </span>
        </div>
      </td>
      <td className="py-3 text-right">
        <button
          onClick={copyLink}
          className={`text-xs transition-colors ${copied ? "text-green-600 font-medium" : "text-zinc-400 hover:text-zinc-700"}`}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </td>
    </tr>
  );
}
