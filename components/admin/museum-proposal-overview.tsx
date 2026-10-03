import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { GitBranch, Map as MapIcon } from "lucide-react";
import { museumBridgeCards, museumFlowZones } from "@/lib/museum-layout-groups";
import type { MuseumSection } from "@/lib/museum-proposals";

export function MuseumProposalOverview({museumName,sections,basePath,queryLinks=false,showBridges=true,children}:{museumName:string;sections:MuseumSection[];basePath:string;queryLinks?:boolean;showBridges?:boolean;children:ReactNode}) {
 const totals=sections.reduce((a,s)=>({saints:a.saints+s.total,featured:a.featured+s.featured,secondary:a.secondary+s.secondary,tertiary:a.tertiary+s.tertiary}),{saints:0,featured:0,secondary:0,tertiary:0});
 const byName=new Map(sections.map(s=>[s.name,s]));
 const sectionHref=(name:string)=>(queryLinks?`${basePath}?section=${encodeURIComponent(byName.get(name)!.slug)}`:`${basePath}/${byName.get(name)!.slug}`) as Route;
 const zones=museumFlowZones.map(zone=>({...zone,sections:zone.sections.filter(name=>byName.has(name))})).filter(zone=>zone.sections.length);
 const covered=new Set<string>(zones.flatMap(z=>z.sections));
 const remaining=sections.filter(s=>!covered.has(s.name));
 return <>
      <section className="museum-admin-hero museum-admin-hero--index">
        <div>
          <div className="eyebrow">{museumName}</div>
          <h1>Section proposals</h1>
          <p>
            Browse saint proposals, plan destination vitrines, and record completed arrangements. Open a saint to make changes.
          </p>
        </div>
        <div className="museum-admin-hero__stats" aria-label="Museum proposal totals">
          <Metric label="Saints" value={totals.saints} />
          <Metric label="Sections" value={sections.length} />
          <Metric label="Primary" value={totals.featured} />
          <Metric label="Secondary" value={totals.secondary} />
          <Metric label="Tertiary" value={totals.tertiary} />
        </div>
      </section>

      {children}

      <section className="museum-admin-panel museum-flow-panel" aria-labelledby="museum-flow-title">
        <div className="museum-admin-section-heading">
          <div>
            <div className="museum-admin-kicker">Visitor circuit</div>
            <h2 id="museum-flow-title">{showBridges ? "Proposed museum flow and bridges" : "Suggested section arrangement"}</h2>
          </div>
          <MapIcon aria-hidden="true" size={22} />
        </div>

        {!showBridges ? <p className="museum-filter-note">A starting sequence for discussion; physical vitrine layout remains to be planned.</p> : null}
        <ol className="museum-flow-zones" aria-label="Proposed visitor flow">
          {zones.map((zone, index) => (
            <li className="museum-flow-zone" key={zone.title}>
              <div className="museum-flow-zone__index">{String(index + 1).padStart(2, "0")}</div>
              <div className="museum-flow-zone__content">
                <h3>{zone.title}</h3>
                <p>{zone.summary}</p>
                <div className="museum-flow-zone__sections">
                  {zone.sections.map((section) => (
                    <Link href={sectionHref(section)} key={section}>
                      {section}
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {remaining.length ? <div className="museum-flow-zone__sections">{remaining.map(section => <Link key={section.name} href={sectionHref(section.name)}>{section.name}</Link>)}</div> : null}
        <div className="museum-bridge-map" aria-label="Bridge traditions that connect the visitor circuit">
          {(showBridges ? museumBridgeCards : []).map((bridge) => (
            <article className="museum-bridge-card" key={bridge.title}>
              <div className="museum-bridge-card__icon">
                <GitBranch aria-hidden="true" size={17} />
              </div>
              <div>
                <h3>{bridge.title}</h3>
                <p>{bridge.summary}</p>
                <small>{bridge.evidence}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

 </>;
}
function Metric({label,value}:{label:string;value:number}) {return <div><strong>{value}</strong><span>{label}</span></div>;}
