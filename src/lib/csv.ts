// Shared CSV parsing and category matching used by both API routes and CLI scripts.

export function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rows: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let val = "";
        i++;
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { val += '"'; i += 2; }
          else if (line[i] === '"') { i++; break; }
          else { val += line[i++]; }
        }
        fields.push(val);
        if (line[i] === ",") i++;
      } else {
        const end = line.indexOf(",", i);
        if (end === -1) { fields.push(line.slice(i).trim()); break; }
        fields.push(line.slice(i, end).trim());
        i = end + 1;
      }
    }
    rows.push(fields);
  }
  return rows;
}

export function normaliseKey(s: string): string {
  return s.toLowerCase().replace(/[\s_-]+/g, " ").trim();
}

const CATEGORY_MAP = [
  { slug: "integrated-presentation", patterns: ["integrated presentation", "integreted presentation", "integrated", "integreted"] },
  { slug: "cover-design",            patterns: ["cover design", "cover"] },
  { slug: "interior-design",         patterns: ["interior design", "interior"] },
  { slug: "photography",             patterns: ["photography", "photo"] },
  { slug: "illustration",            patterns: ["illustration"] },
  { slug: "infographic",             patterns: ["infographic"] },
  { slug: "online-overall",          patterns: ["online / overall", "online overall", "overall presentation", "online presentation", "overall"] },
  { slug: "online-homepage",         patterns: ["online / home", "online home", "home/landing", "landing page", "homepage"] },
  { slug: "online-overall",          patterns: ["online", "digital", "interactive", "web"] },
];

export function matchCategorySlug(raw: string): string | null {
  const lower = (raw ?? "").toLowerCase().trim();
  if (!lower) return null;
  for (const { slug, patterns } of CATEGORY_MAP) {
    if (patterns.some((p) => lower.includes(p))) return slug;
  }
  return null;
}

export type ColGetter = (row: string[], ...names: string[]) => string;

export function makeColGetter(rawHeaders: string[]): ColGetter {
  const idx: Record<string, number> = {};
  rawHeaders.forEach((h, i) => { idx[normaliseKey(h)] = i; });
  return (row: string[], ...names: string[]): string => {
    for (const name of names) {
      const i = idx[normaliseKey(name)];
      if (i !== undefined) return (row[i] ?? "").trim();
    }
    return "";
  };
}

export interface ParsedEntryRow {
  entryCode: string;
  title: string;
  submitterName: string;
  categorySlug: string | null;
  year: number;
  awardTier: string;
  format: string;
  industry: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  country: string;
  mailingAddress: string;
  date: string;
  url: string;
}

export function parseEntryRows(csvText: string): {
  rows: ParsedEntryRow[];
  unmatched: Set<string>;
} {
  const parsed = parseCSV(csvText);
  if (parsed.length < 2) return { rows: [], unmatched: new Set() };

  const col = makeColGetter(parsed[0]);
  const unmatched = new Set<string>();
  const rows: ParsedEntryRow[] = [];

  for (const row of parsed.slice(1)) {
    const entryCode = col(row, "entry_no", "entry no");
    if (!entryCode) continue;

    const rawCategory = col(row, "mailing_address", "mailing address");
    const categorySlug = matchCategorySlug(rawCategory);
    if (!categorySlug) {
      unmatched.add(rawCategory || "(empty)");
    }

    rows.push({
      entryCode,
      title: col(row, "report_title", "report title") || col(row, "company_name", "company name"),
      submitterName: col(row, "company_name", "company name"),
      categorySlug,
      year: parseInt(col(row, "year"), 10) || new Date().getFullYear(),
      awardTier: col(row, "award_tier", "award tier"),
      format: col(row, "format"),
      industry: col(row, "industry"),
      contactFirstName: col(row, "contact_first_name", "contact first name"),
      contactLastName: col(row, "contact_last_name", "contact last name"),
      contactEmail: col(row, "email"),
      country: col(row, "country"),
      mailingAddress: col(row, "design_categories", "design categories"),
      date: col(row, "date"),
      url: col(row, "url"),
    });
  }

  return { rows, unmatched };
}
