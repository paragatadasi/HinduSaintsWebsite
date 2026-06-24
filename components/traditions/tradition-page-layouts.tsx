import Link from "next/link";
import { ArrowRight, GitBranch, Library, Network } from "lucide-react";
import { Prose } from "@/components/content/prose";
import { SaintCard } from "@/components/saints/saint-card";
import { TraditionLayoutToggle } from "@/components/traditions/tradition-layout-toggle";
import type { TraditionDetailTemplateContent } from "@/lib/site-content";
import type { PublicSaintSummary, PublicTraditionDetail } from "@/lib/public-contracts";

export type TraditionDetailLayoutOption = "overview" | "lineage" | "reading";

export const traditionLayoutOptions: Array<{
  value: TraditionDetailLayoutOption;
  label: string;
}> = [
  { value: "overview", label: "Overview blocks" },
  { value: "lineage", label: "Lineage tree" },
  { value: "reading", label: "Reading layout" }
];

type TraditionPageLayoutsProps = {
  tradition: PublicTraditionDetail;
  template: TraditionDetailTemplateContent;
  layout: TraditionDetailLayoutOption;
};

export function TraditionPageLayouts({ tradition, template, layout }: TraditionPageLayoutsProps) {
  const historyMarkdown = tradition.introductionMarkdown ?? template.placeholderMarkdown;
  const layoutClass = `tradition-detail tradition-detail--${layout}`;

  return (
    <main className={layoutClass}>
      <TraditionHero tradition={tradition} template={template} />
      {layout === "lineage" ? (
        <LineageLayout tradition={tradition} historyMarkdown={historyMarkdown} />
      ) : layout === "reading" ? (
        <ReadingLayout tradition={tradition} historyMarkdown={historyMarkdown} />
      ) : (
        <OverviewLayout tradition={tradition} historyMarkdown={historyMarkdown} />
      )}
      <div className="page-shell">
        <TraditionLayoutToggle currentLayout={layout} options={traditionLayoutOptions} />
      </div>
    </main>
  );
}

function TraditionHero({ tradition, template }: {
  tradition: PublicTraditionDetail;
  template: TraditionDetailTemplateContent;
}) {
  return (
    <section className="tradition-hero">
      <div className="page-shell tradition-hero__inner">
        <div className="tradition-hero__content">
          <div className="eyebrow">{template.eyebrow}</div>
          <h1>{tradition.name}</h1>
          <p>{tradition.shortDescription}</p>
          {tradition.alternateNames && tradition.alternateNames.length > 0 ? (
            <div className="chip-list" aria-label="Alternate names">
              {tradition.alternateNames.map((name) => <span className="chip" key={name}>{name}</span>)}
            </div>
          ) : null}
        </div>
        <TraditionOverviewPanel tradition={tradition} />
      </div>
    </section>
  );
}

function OverviewLayout({ tradition, historyMarkdown }: {
  tradition: PublicTraditionDetail;
  historyMarkdown: string;
}) {
  return (
    <div className="page-shell section tradition-detail__grid">
      <div className="tradition-detail__main">
        <HistorySection markdown={historyMarkdown} />
        <AssociatedSaints saints={tradition.saints} />
      </div>
      <aside className="tradition-detail__aside">
        <SaintTree tradition={tradition} />
        <RelatedPages tradition={tradition} />
      </aside>
    </div>
  );
}

function LineageLayout({ tradition, historyMarkdown }: {
  tradition: PublicTraditionDetail;
  historyMarkdown: string;
}) {
  return (
    <div className="page-shell section tradition-detail__stack">
      <SaintTree tradition={tradition} prominent />
      <div className="tradition-detail__grid">
        <HistorySection markdown={historyMarkdown} />
        <RelatedPages tradition={tradition} />
      </div>
      <AssociatedSaints saints={tradition.saints} />
    </div>
  );
}

function ReadingLayout({ tradition, historyMarkdown }: {
  tradition: PublicTraditionDetail;
  historyMarkdown: string;
}) {
  return (
    <div className="page-shell section tradition-detail__reading">
      <div className="tradition-detail__main">
        <HistorySection markdown={historyMarkdown} />
      </div>
      <aside className="tradition-detail__aside">
        <SaintTree tradition={tradition} />
        <RelatedPages tradition={tradition} />
      </aside>
      <AssociatedSaints saints={tradition.saints} />
    </div>
  );
}

function TraditionOverviewPanel({ tradition }: { tradition: PublicTraditionDetail }) {
  return (
    <aside className="tradition-panel tradition-panel--summary">
      <div>
        <div className="eyebrow">Overview</div>
        <dl className="tradition-facts">
          {tradition.founder ? (
            <div>
              <dt>Founder</dt>
              <dd>{tradition.founder}</dd>
            </div>
          ) : null}
          <div>
            <dt>Published saints</dt>
            <dd>{tradition.saints.length}</dd>
          </div>
          <div>
            <dt>Related traditions</dt>
            <dd>{tradition.relatedTraditions.length}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

function HistorySection({ markdown }: { markdown: string }) {
  return (
    <section className="tradition-section tradition-section--history">
      <div className="section-heading section-heading--text">
        <div>
          <div className="eyebrow">History</div>
          <h2>Tradition history</h2>
        </div>
      </div>
      <Prose markdown={markdown} />
    </section>
  );
}

function SaintTree({ tradition, prominent = false }: {
  tradition: PublicTraditionDetail;
  prominent?: boolean;
}) {
  const saints = getTreeSaints(tradition);

  return (
    <section className={prominent ? "tradition-panel tradition-panel--tree tradition-panel--tree-prominent" : "tradition-panel tradition-panel--tree"}>
      <div className="section-heading section-heading--text">
        <div>
          <div className="eyebrow">Saint Tree</div>
          <h2>Connected saints</h2>
        </div>
        <Network size={22} aria-hidden="true" />
      </div>
      {saints.length > 0 ? (
        <ol className="tradition-saint-tree">
          {saints.map((saint, index) => (
            <li key={saint.slug}>
              <Link href={`/saints/${saint.slug}`}>
                <span className="tradition-saint-tree__marker" aria-hidden="true">{index + 1}</span>
                <span>
                  <strong>{saint.displayName}</strong>
                  <small>{saint.eraLabel} · {saint.primaryLocation}</small>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-note">A lineage view will appear after published saints are linked.</p>
      )}
    </section>
  );
}

function RelatedPages({ tradition }: { tradition: PublicTraditionDetail }) {
  const saintLinks = tradition.saints.slice(0, 6);
  const hasRelatedPages = tradition.relatedTraditions.length > 0 || saintLinks.length > 0;

  return (
    <section className="tradition-panel tradition-panel--related">
      <div className="section-heading section-heading--text">
        <div>
          <div className="eyebrow">Related</div>
          <h2>Related pages</h2>
        </div>
        <Library size={22} aria-hidden="true" />
      </div>
      {hasRelatedPages ? (
        <ul className="context-list">
          {tradition.relatedTraditions.map((relatedTradition) => (
            <li key={relatedTradition.slug}>
              <Link href={`/traditions/${relatedTradition.slug}`}>
                {relatedTradition.name}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              {relatedTradition.shortDescription ? <p>{relatedTradition.shortDescription}</p> : null}
            </li>
          ))}
          {saintLinks.map((saint) => (
            <li key={saint.slug}>
              <Link href={`/saints/${saint.slug}`}>
                {saint.displayName}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <p>{saint.eraLabel} · {saint.tradition}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">Related pages will appear as the archive grows.</p>
      )}
    </section>
  );
}

function AssociatedSaints({ saints }: { saints: PublicSaintSummary[] }) {
  return (
    <section className="tradition-section tradition-section--saints">
      <div className="section-heading section-heading--text">
        <div>
          <div className="eyebrow">Saints</div>
          <h2>Associated saints</h2>
        </div>
        <GitBranch size={22} aria-hidden="true" />
      </div>
      {saints.length > 0 ? (
        <div className="card-grid">
          {saints.map((saint) => <SaintCard key={saint.slug} saint={saint} />)}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No published saints linked yet</h2>
          <p>Associated saints will appear here after editorial review.</p>
        </div>
      )}
    </section>
  );
}

function getTreeSaints(tradition: PublicTraditionDetail) {
  if (!tradition.founder) return tradition.saints;

  return [...tradition.saints].sort((first, second) => {
    if (first.displayName === tradition.founder) return -1;
    if (second.displayName === tradition.founder) return 1;
    return first.displayName.localeCompare(second.displayName);
  });
}
