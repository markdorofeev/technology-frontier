import Link from "next/link";
import { SORTS } from "@/components/feed";
import { ItemList } from "@/components/item-list";
import { Empty, MoreLink, PageHeader, Section } from "@/components/ui";
import { shortDate, timeAgo } from "@/lib/format";
import { getFeed, getSourceHealth } from "@/lib/queries";
import { registry, type Tier } from "@/lib/registry";

/** Items shown per domain, by how closely the domain is followed. */
const PER_DOMAIN: Record<Tier, number> = { deep: 5, regular: 3, broad: 2 };

/** Each domain's top items over the week or month, with quiet domains in one line and source health. */
export async function Digest({ period }: { period: "week" | "month" }) {
  const { days } = SORTS[period];
  const { domains, sources } = registry();
  const automatic = sources.filter((s) => s.method !== "manual");
  const [feeds, health] = await Promise.all([
    // A few spare rows per domain, since an item filed under several domains is shown only under the first.
    Promise.all(
      domains.map((d) => getFeed({ domain: d.slug, sort: "top", days, limit: PER_DOMAIN[d.tier] + 3 })),
    ),
    getSourceHealth(),
  ]);

  const seen = new Set<number>();
  const sections = domains.map((d, i) => {
    const fresh = feeds[i].items.filter((it) => !seen.has(it.id));
    // A domain whose whole list is already shown above repeats it rather than showing an empty section.
    const items = (fresh.length ? fresh : feeds[i].items).slice(0, PER_DOMAIN[d.tier]);
    for (const it of items) seen.add(it.id);
    return { domain: d, items, total: feeds[i].total };
  });
  const active = sections.filter((s) => s.total > 0);
  const quiet = sections.filter((s) => s.total === 0).map((s) => s.domain);

  const healthy = automatic.filter((s) => health[s.id]?.lastSuccessAt && !health[s.id]?.lastError).length;
  const lastSuccess = Object.values(health)
    .map((h) => h.lastSuccessAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  const now = new Date();

  return (
    <>
      <PageHeader title={`This ${period} on the frontier`} kicker={`${shortDate(new Date(now.getTime() - days * 86_400_000))} – ${shortDate(now)}`} />

      {active.length ? (
        active.map(({ domain, items, total }) => (
          <Section
            key={domain.slug}
            title={domain.name}
            action={
              <MoreLink href={`/d/${domain.slug}?sort=${period}`}>
                {total.toLocaleString()} {total === 1 ? "item" : "items"} →
              </MoreLink>
            }
          >
            <ItemList items={items} hideDomains flat />
          </Section>
        ))
      ) : (
        <Empty>No items this {period} yet. Run `npm run job ingest`.</Empty>
      )}

      {quiet.length > 0 && (
        <p className="mt-12 text-sm text-muted">
          <span className="text-faint">Nothing new this {period} in </span>
          {quiet.map((d, i) => (
            <span key={d.slug}>
              {i > 0 && ", "}
              <Link href={`/d/${d.slug}`} className="hover:text-ink hover:underline">
                {d.short}
              </Link>
            </span>
          ))}
          .
        </p>
      )}

      <p className="mt-10 text-sm text-faint">
        <Link href="/sources" className="hover:text-ink">
          {healthy} of {automatic.length} sources healthy
        </Link>
        {lastSuccess && <> · last fetch {timeAgo(lastSuccess)}</>}
      </p>
    </>
  );
}
