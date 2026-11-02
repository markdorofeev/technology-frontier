import { sql, type SQL } from "drizzle-orm";

/**
 * Every source's own counts (`item_mentions.signals`) fall into one of three measures, so items
 * from different platforms read and sort the same way.
 */
export const MEASURES = {
  votes: { symbol: "▲", label: "votes" },
  comments: { symbol: "💬", label: "comments" },
  downloads: { symbol: "↓", label: "downloads" },
} as const;
export type Measure = keyof typeof MEASURES;

/** Raw signal key → its measure, and how the platform names it (for tooltips). */
export const SIGNALS: Record<string, { measure: Measure; noun: string; platform: string }> = {
  hf_upvotes: { measure: "votes", noun: "upvotes", platform: "Hugging Face" },
  hf_likes: { measure: "votes", noun: "likes", platform: "Hugging Face" },
  hn_points: { measure: "votes", noun: "points", platform: "Hacker News" },
  stars: { measure: "votes", noun: "stars", platform: "GitHub" },
  hf_comments: { measure: "comments", noun: "comments", platform: "Hugging Face" },
  hn_comments: { measure: "comments", noun: "comments", platform: "Hacker News" },
  hf_downloads: { measure: "downloads", noun: "downloads", platform: "Hugging Face" },
};

export type MeasureTotal = { measure: Measure; total: number; parts: { n: number; noun: string; platform: string }[] };

/** Sums each measure over an item's mentions (latest signals per source), in MEASURES order. Unknown keys are ignored. */
export function measureTotals(mentions: { signals: Record<string, number> }[]): MeasureTotal[] {
  const out = new Map<Measure, MeasureTotal>();
  for (const m of mentions) {
    for (const [key, n] of Object.entries(m.signals)) {
      const s = SIGNALS[key];
      if (!s || !Number.isFinite(n)) continue;
      const t = out.get(s.measure) ?? { measure: s.measure, total: 0, parts: [] };
      t.total += n;
      t.parts.push({ n, noun: s.noun, platform: s.platform });
      out.set(s.measure, t);
    }
  }
  return (Object.keys(MEASURES) as Measure[]).flatMap((k) => out.get(k) ?? []);
}

/** One mention row's (alias `m`) count for a measure, as SQL. */
export function measureSql(measure: Measure): SQL {
  const keys = Object.keys(SIGNALS).filter((k) => SIGNALS[k].measure === measure);
  return sql.join(
    keys.map((k) => sql`coalesce((m.signals->>${k})::bigint, 0)`),
    sql` + `,
  );
}
