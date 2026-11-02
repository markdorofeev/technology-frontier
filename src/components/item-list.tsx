import Link from "next/link";
import { compact, dayLabel } from "@/lib/format";
import type { FeedItem } from "@/lib/queries";
import { registry, type Layer } from "@/lib/registry";
import { MEASURES, measureTotals } from "@/lib/signals";
import { ExternalLink, LAYER_LABEL } from "./ui";

/** `ranked` lists show each item's date, since it doesn't follow from its position. */
type ItemProps = { item: FeedItem; hideDomains?: boolean; ranked?: boolean };

function Item({ item, hideDomains, ranked }: ItemProps) {
  const { sources, domains, topics } = registry();
  const sourceName = (id: string) => sources.find((s) => s.id === id)?.name ?? id;
  const extra = item.mentions.filter((m) => m.sourceId !== item.firstSourceId);
  // What lists hide by default; only visible (dimmed) after "Show all".
  const offTopic = item.relevant === false;

  // Provenance goes above the title, led by the layer; counts sit at the right end of the same line.
  const meta: React.ReactNode[] = [];
  meta.push(
    <Link key="src" href={`/sources/${item.firstSourceId}`} className="hover:text-ink">
      {sourceName(item.firstSourceId)}
      {extra.length > 0 && (
        <span className="text-ink" title={extra.map((m) => sourceName(m.sourceId)).join(", ")}>
          {" "}
          +{extra.length}
        </span>
      )}
    </Link>,
  );
  if (ranked) meta.push(<span key="date">{dayLabel(item.sortAt)}</span>);
  if (!hideDomains) {
    for (const slug of item.domains) {
      meta.push(
        <Link key={slug} href={`/d/${slug}`} className="hover:text-ink">
          {domains.find((d) => d.slug === slug)?.short ?? slug}
        </Link>,
      );
    }
  }
  if (offTopic) meta.push(<span key="off">off-topic</span>);
  const counts = measureTotals(item.mentions).map((t) => (
    <span
      key={t.measure}
      className="tabular-nums text-ink"
      title={t.parts.map((p) => `${p.n.toLocaleString()} ${p.noun} on ${p.platform}`).join(", ")}
    >
      <span aria-label={MEASURES[t.measure].label}>{MEASURES[t.measure].symbol}</span> {compact(t.total)}
    </span>
  ));

  const tags = item.tags.slice(0, 3).map((slug) => {
    const topic = topics.find((t) => t.slug === slug);
    return (
      <Link
        key={slug}
        href={topic ? `/d/${topic.domain}?tag=${slug}` : `/feed?tag=${slug}`}
        className="whitespace-nowrap hover:text-ink"
      >
        {topic?.name ?? slug}
      </Link>
    );
  });

  return (
    <li className={`py-3 ${offTopic ? "opacity-60" : ""}`}>
      <div className="mb-0.5 flex items-baseline justify-between gap-x-4 text-xs text-faint">
        <div className="flex min-w-0 items-baseline gap-x-2.5">
          <span className="shrink-0 text-[11px] tracking-[0.07em] text-muted uppercase">
            {LAYER_LABEL[item.layer as Layer] ?? item.layer}
          </span>
          {/* Every part leads with its own dot; the negative margin clips the dot that starts each line. */}
          <div className="min-w-0 overflow-hidden">
            <div className="-ml-4 flex flex-wrap items-baseline">
              {meta.map((m, i) => (
                <span key={i} className="flex">
                  <span aria-hidden className="w-4 shrink-0 text-center">
                    ·
                  </span>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        {counts.length > 0 && <div className="flex shrink-0 gap-x-3">{counts}</div>}
      </div>
      <ExternalLink
        href={item.url}
        className="font-serif text-[17px] leading-snug text-ink decoration-faint hover:underline sm:text-lg"
      >
        {item.title}
      </ExternalLink>
      {item.takeaway && <p className="mt-0.5 text-[15px] leading-snug text-muted">{item.takeaway}</p>}
      {/* Topics close the row on a line of their own, so they never wrap into the title or summary. */}
      {tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-faint">{tags}</div>
      )}
    </li>
  );
}

/**
 * Items newest first under day headings, or with `flat` in the order given (e.g. by votes),
 * each showing its own date.
 */
export function ItemList({ items, hideDomains, flat }: { items: FeedItem[]; hideDomains?: boolean; flat?: boolean }) {
  if (flat) {
    return (
      <ul className="divide-y divide-line border-t border-line">
        {items.map((item) => (
          <Item key={item.id} item={item} hideDomains={hideDomains} ranked />
        ))}
      </ul>
    );
  }
  const groups: { day: string; items: FeedItem[] }[] = [];
  for (const item of items) {
    const day = dayLabel(item.sortAt);
    if (groups.at(-1)?.day === day) groups.at(-1)!.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return (
    <div>
      {groups.map((g) => (
        <section key={g.day} className="mt-6 first:mt-0">
          <h3 className="border-b border-line pb-1.5 text-sm text-faint">{g.day}</h3>
          <ul className="divide-y divide-line">
            {g.items.map((item) => (
              <Item key={item.id} item={item} hideDomains={hideDomains} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
