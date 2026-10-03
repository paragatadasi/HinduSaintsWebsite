"use client";
import {MuseumDisplayMembershipEditor} from "@/components/admin/museum-display-membership-editor";
import Link from "next/link";
import type { Route } from "next";
import { useId, type ReactNode } from "react";
import {MuseumDetailDialog} from "@/components/admin/museum-detail-dialog";
import type { MuseumSaintPlacement } from "@/lib/museum-proposals";
import { MuseumSaintProfile } from "@/components/admin/museum-saint-profile";
import type { MuseumSaintProfile as SaintProfile } from "@/lib/museum-saint-profile";
import { formatSaintDate } from "@/lib/public-date-format";

export function MuseumSaintDialog({member,onClose,row,moveControl,profile,sectionSlug,canManage=false,canEditRelationships=false}: {member?: Record<string,string>;onClose:()=>void;row:MuseumSaintPlacement;moveControl?: ReactNode;profile?: SaintProfile;sectionSlug: string;canManage?:boolean;canEditRelationships?:boolean}) {
  const titleId = useId();
  const fallback: SaintProfile = {
    name: row.name, description: "", images: [],
    facts: [
      { label: "Birth date", value: formatSaintDate({ raw: member?.BirthDate }) || "" },
      { label: "Samadhi date", value: formatSaintDate({ raw: member?.SamadhiDate }) || "" },
      { label: "Places", value: row.normalizedPlaces.join(" · ") },
      { label: "Tradition", value: row.sampradaya }
    ].filter(f => f.value)
  };
  const relationships = [
    ["Families and roles", member?.Families], ["Masters", member?.Masters],
    ["Disciples", member?.Disciples], ["Partner", member?.Partner],
    ["Incarnation", member?.Incarnation], ["Other relationships", member?.["Other relationships"]]
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  return (
    <MuseumDetailDialog titleId={titleId} kicker="Saint overview" closeLabel="Close saint overview" onClose={onClose}>
      <MuseumSaintProfile profile={profile || fallback} titleId={titleId} />
      {row.needsResearch ? <p className="museum-research-note">Needs research. Review the proposal notes and source details below before planning this placement.</p> : null}
      {relationships.length ? <section className="museum-saint-review-section">
        <h3>Relationships</h3>
        <dl className="museum-saint-data museum-saint-data--flat">{relationships.map(([label, value]) => <DataItem key={label} label={label} value={value} />)}</dl>
      </section> : null}
      <section className="museum-saint-review-section">
        <h3>Museum placement</h3>
        <dl className="museum-saint-data museum-saint-data--flat">
          <DataItem label="Section" value={<Link href={`/museumadmin/${sectionSlug}` as Route}>{row.section}</Link>} />
          {row.collectionItems?.map(item => <DataItem key={item.id} label={item.label} value={item.location ? item.location.museumName + ": " + item.location.label : item.catalogMuseum.name + ": location unknown"} />)}
          {row.sourceVitrine && !row.collectionItems?.length ? <DataItem label="SPN vitrine (source record)" value={row.sourceVitrine.vitrine + (row.sourceVitrine.shelf ? " / Shelf " + row.sourceVitrine.shelf : "")} /> : null}
          <DataItem label="Placement status" value={row.placementState || "Original proposal"} />
          <DataItem label="Alternate sections" value={row.alternatives.join("; ")} />
          <DataItem label={row.placementState === "Confirmed" ? "Exhibit group" : "Proposed display group"} value={row.groupLabel || row.curatorialFamily || row.familyId} />
          <DataItem label="Confidence" value={row.confidence} />
        </dl>
        <div className="review-actions">
          {row.collectionItems?.map(item => <Link key={item.id} className="museum-admin-button" href={`/museumadmin/collections/${item.id}` as Route}>Plan move: {item.label}</Link>)}
          {row.saintId ? <Link className="museum-admin-button" href={`/museumadmin/saints/${row.saintId}` as Route}>{row.placementState === "Confirmed" ? "Review placement" : "Review and confirm proposal"}</Link> : <p>This proposal needs a saint link before confirmation. <Link href={`/museumadmin/review?q=${encodeURIComponent(row.sourceRecordId || row.id)}`}>Review source link</Link></p>}
          {moveControl}
        </div>
      </section>
      {canManage?<MuseumDisplayMembershipEditor row={row} canEditRelationships={canEditRelationships}/>:null}
      <details className="museum-saint-review-section" open={row.needsResearch || undefined}>
        <summary>Proposal notes and source details</summary>
        <dl className="museum-saint-data museum-saint-data--flat">
          <DataItem label="Original group size" value={row.familySize ? String(row.familySize) : ""} />
          <DataItem label="Spiritual regions" value={row.spiritualRegions.join("; ")} />
          <DataItem label="Proposal places" value={row.normalizedPlaces.join("; ")} />
          <DataItem label="Proposal tradition" value={row.sampradaya} />
          <DataItem label="Source link issue" value={row.linkIssue} wide />
          <DataItem label="Rationale" value={row.rationale} wide />
          <DataItem label="Internal note" value={row.note} wide />
          <DataItem label="Review signal" value={row.needsResearch ? "Needs more research or cleanup review" : ""} wide />
        </dl>
      </details>
    </MuseumDetailDialog>
  );
}

function DataItem({ label, value, wide }: { label: string; value?: ReactNode; wide?: boolean }) {
  if (!value) return null;
  return (
    <div className={wide ? "museum-saint-data__wide" : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
