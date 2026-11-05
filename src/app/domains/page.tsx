import type { Metadata } from "next";
import Link from "next/link";
import { LayerBoard } from "@/components/layer-board";
import { PageHeader, Rows, Section } from "@/components/ui";
import { getLayerBoard } from "@/lib/queries";
import { registry } from "@/lib/registry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Domains" };

const DAYS = 7;

export default async function DomainsPage() {
  const { domains, reference } = registry();
  const board = await getLayerBoard(DAYS);
  const name = (slug: string) => domains.find((d) => d.slug === slug)?.short ?? slug;

  return (
    <>
      <PageHeader title="Domains" />

      <LayerBoard domains={domains} board={board} days={DAYS} />

      <Section title="Cross-domain watchlist">
        <Rows>
          {reference.crossDomain.map((c) => (
            <div key={c.pair} className="py-3">
              <div className="flex items-baseline justify-between gap-4">
                <span>{c.pair}</span>
                <span className="flex shrink-0 gap-3 text-sm">
                  {c.domains.map((slug) => (
                    <Link key={slug} href={`/d/${slug}`} className="text-accent hover:underline">
                      {name(slug)}
                    </Link>
                  ))}
                </span>
              </div>
              <p className="text-sm text-muted">{c.why}</p>
            </div>
          ))}
        </Rows>
      </Section>
    </>
  );
}
