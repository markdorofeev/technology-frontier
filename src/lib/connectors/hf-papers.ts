import { z } from "zod";
import { normalizeArxivId } from "@/lib/pipeline/canonicalize";
import { excerpt, parseDate } from "@/lib/text";
import { defineConnector } from "./types";

const config = z
  .object({
    /** Papers below this many upvotes are skipped; they are picked up on a later run if they climb. */
    minUpvotes: z.number().int().nonnegative().default(0),
    /** Listing days to re-read, today included, so a paper that climbs past the floor days later is caught. */
    lookbackDays: z.number().int().positive().max(30).default(7),
  })
  .default({ minUpvotes: 0, lookbackDays: 7 });

const response = z.array(
  z.object({
    paper: z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string().optional(),
      upvotes: z.number().optional(),
      publishedAt: z.string().optional(),
      authors: z.array(z.object({ name: z.string().optional() })).optional(),
    }),
    publishedAt: z.string().optional(),
    numComments: z.number().optional(),
  }),
);

const DAY_MS = 86_400_000;

/** HF Daily Papers are arXiv papers: they dedupe onto the arXiv item and add an upvotes mention. */
export const hfPapersConnector = defineConnector({
  method: "hf-papers",
  configSchema: config,
  async fetch({ config, http, now }) {
    const byId = new Map<string, z.infer<typeof response>[number]>();
    for (let daysAgo = 0; daysAgo < config.lookbackDays; daysAgo++) {
      const date = new Date(now.getTime() - daysAgo * DAY_MS).toISOString().slice(0, 10);
      // Without `limit` the API stops at 50, and busy days list more. 100 is the most it allows.
      const res = await http.get(`https://huggingface.co/api/daily_papers?date=${date}&limit=100`, {
        accept: "application/json",
      });
      for (const entry of response.parse(JSON.parse(res.text))) {
        if (!byId.has(entry.paper.id)) byId.set(entry.paper.id, entry);
      }
    }
    return {
      items: [...byId.values()]
        .filter(({ paper }) => (paper.upvotes ?? 0) >= config.minUpvotes)
        .map(({ paper, publishedAt, numComments }) => {
          const id = normalizeArxivId(paper.id);
          const signals: Record<string, number> = {};
          if (paper.upvotes != null) signals.hf_upvotes = paper.upvotes;
          if (numComments != null) signals.hf_comments = numComments;
          return {
            url: `https://arxiv.org/abs/${id}`,
            externalKind: "arxiv" as const,
            externalId: id,
            title: paper.title.replace(/\s+/g, " ").trim(),
            authors: paper.authors?.flatMap((a) => a.name ?? []).slice(0, 20),
            publishedAt: parseDate(paper.publishedAt ?? publishedAt),
            excerpt: excerpt(paper.summary),
            abstract: paper.summary,
            signals,
          };
        }),
    };
  },
});
