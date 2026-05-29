#!/usr/bin/env node
/**
 * Import entries from a CSV file into the local D1 database.
 *
 * Usage:
 *   node import-entries.js <path-to-csv>
 *   node import-entries.js entries.csv --remote   (for the live Cloudflare DB)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";

const csvPath = process.argv[2];
const remote = process.argv.includes("--remote");

if (!csvPath) {
  console.error("Usage: node import-entries.js <path-to-csv> [--remote]");
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields and embedded commas
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let val = "";
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            val += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++; // skip closing quote
            break;
          } else {
            val += line[i++];
          }
        }
        fields.push(val);
        if (line[i] === ",") i++;
      } else {
        const end = line.indexOf(",", i);
        if (end === -1) {
          fields.push(line.slice(i).trim());
          break;
        }
        fields.push(line.slice(i, end).trim());
        i = end + 1;
      }
    }
    rows.push(fields);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Normalise a header name: lowercase, collapse whitespace/underscores/hyphens
// so "entry no", "entry_no", "Entry No" all become "entry no"
// ---------------------------------------------------------------------------
function normaliseKey(s) {
  return s.toLowerCase().replace(/[\s_-]+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Category fuzzy matching
// Maps CSV design_categories values to our DB category slugs.
// ---------------------------------------------------------------------------
const CATEGORY_MAP = [
  { slug: "integrated-presentation", patterns: ["integrated presentation", "integreted presentation", "integrated", "integreted"] },
  { slug: "cover-design",            patterns: ["cover design", "cover"] },
  { slug: "interior-design",         patterns: ["interior design", "interior"] },
  { slug: "photography",             patterns: ["photography", "photo"] },
  { slug: "illustration",            patterns: ["illustration"] },
  { slug: "infographic",             patterns: ["infographic"] },
  { slug: "online-overall",          patterns: ["online / overall", "online overall", "overall presentation", "online presentation"] },
  { slug: "online-home",             patterns: ["online / home", "online home", "home/landing", "landing page", "homepage"] },
  // Fallback: bare "online" or "digital" → overall presentation
  { slug: "online-overall",          patterns: ["online", "digital", "interactive", "web"] },
];

function matchCategory(raw) {
  const lower = (raw ?? "").toLowerCase().trim();
  if (!lower) return null;
  for (const { slug, patterns } of CATEGORY_MAP) {
    if (patterns.some((p) => lower.includes(p))) return slug;
  }
  return null;
}

// ---------------------------------------------------------------------------
// SQL escape
// ---------------------------------------------------------------------------
function esc(val) {
  if (val == null || val === "") return "NULL";
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const raw = fs.readFileSync(csvPath, "utf8");
const rows = parseCSV(raw);

if (rows.length < 2) {
  console.error("CSV appears empty or has no data rows.");
  process.exit(1);
}

// Build a normalised header → column-index map
const rawHeaders = rows[0];
const headerIndex = {};
rawHeaders.forEach((h, i) => { headerIndex[normaliseKey(h)] = i; });

const dataRows = rows.slice(1);

// Look up a column by any reasonable spelling of its name
const col = (row, ...names) => {
  for (const name of names) {
    const idx = headerIndex[normaliseKey(name)];
    if (idx !== undefined) return (row[idx] ?? "").trim();
  }
  return "";
};

// Fetch category slugs→ids from the DB so we can resolve them
const rawCatOutput = execSync(
  `npx wrangler d1 execute iada-jury-db ${remote ? "--remote" : "--local"} --json --command="SELECT id, slug FROM categories"`,
  { cwd: path.dirname(new URL(import.meta.url).pathname), encoding: "utf8" }
);
const jsonStart = rawCatOutput.indexOf("[");
const categoryResult = JSON.parse(rawCatOutput.slice(jsonStart));
const categories = categoryResult[0].results;
const slugToId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

// Build INSERT statements
let inserted = 0;
let skipped = 0;
const unmatchedCategories = new Set();
const sqlStatements = [];

for (const row of dataRows) {
  const entryCode = col(row, "entry_no", "entry no");
  const title = col(row, "report_title", "report title") || col(row, "company_name", "company name");
  const rawCategory = col(row, "design_categories", "design categories");

  if (!entryCode) {
    skipped++;
    continue;
  }

  const slug = matchCategory(rawCategory);
  if (!slug) {
    unmatchedCategories.add(rawCategory || "(empty)");
    skipped++;
    continue;
  }

  const categoryId = slugToId[slug];
  if (!categoryId) {
    console.warn(`  No DB row for slug "${slug}" — skipping ${entryCode}`);
    skipped++;
    continue;
  }

  const contactFirst = col(row, "contact_first_name", "contact first name");
  const contactLast  = col(row, "contact_last_name",  "contact last name");
  const contactName  = [contactFirst, contactLast].filter(Boolean).join(" ");
  const year = parseInt(col(row, "year"), 10) || new Date().getFullYear();

  sqlStatements.push(
    `INSERT OR IGNORE INTO entries ` +
    `(entry_code, title, category_id, submitter_name, year, award_tier, format, industry, ` +
    `contact_name, contact_first_name, contact_last_name, contact_email, country, mailing_address, date, url) VALUES ` +
    `(${esc(entryCode)}, ${esc(title)}, ${categoryId}, ${esc(col(row, "company_name", "company name"))}, ${year}, ` +
    `${esc(col(row, "award_tier", "award tier"))}, ${esc(col(row, "format"))}, ${esc(col(row, "industry"))}, ` +
    `${esc(contactName)}, ${esc(contactFirst)}, ${esc(contactLast)}, ` +
    `${esc(col(row, "email"))}, ${esc(col(row, "country"))}, ` +
    `${esc(col(row, "mailing_address", "mailing address"))}, ${esc(col(row, "date"))}, ${esc(col(row, "url"))});`
  );
  inserted++;
}

if (sqlStatements.length === 0) {
  console.error("No valid rows to import.");
  if (unmatchedCategories.size) {
    console.error("Unmatched categories:", [...unmatchedCategories].join(", "));
  }
  process.exit(1);
}

// Write to a temp SQL file and execute via wrangler
const tmpFile = path.join(os.tmpdir(), `iada-import-${Date.now()}.sql`);
fs.writeFileSync(tmpFile, sqlStatements.join("\n"));

console.log(`\nImporting ${inserted} entries (${skipped} skipped)…`);
if (unmatchedCategories.size) {
  console.warn(`⚠  Unmatched categories (rows skipped): ${[...unmatchedCategories].join(", ")}`);
}

try {
  execSync(
    `npx wrangler d1 execute iada-jury-db ${remote ? "--remote" : "--local"} --file="${tmpFile}"`,
    { stdio: "inherit", cwd: path.dirname(new URL(import.meta.url).pathname) }
  );
  console.log(`\n✅ Done — ${inserted} entries imported into ${remote ? "remote" : "local"} D1.`);
} finally {
  fs.unlinkSync(tmpFile);
}
