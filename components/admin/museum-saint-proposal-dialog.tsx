"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import type { MuseumSaintPlacement, MuseumTier } from "@/lib/museum-proposals";
import type { MuseumAnchorOption as AnchorOption } from "@/lib/museum-proposal-preview";

const tiers: MuseumTier[] = ["Featured", "Secondary", "Tertiary"];

export function MuseumSaintProposalDialog({
  anchorOptions,
  anchorValue,
  member,
  onAnchorChange,
  onClose,
  onPrimarySectionChange,
  onTierChange,
  primarySectionValue,
  row,
  sectionNames,
  tierValue
}: {
  anchorOptions: AnchorOption[];
  anchorValue: string;
  member?: Record<string, string>;
  onAnchorChange: (value: string) => void;
  onClose: () => void;
  onPrimarySectionChange: (value: string) => void;
  onTierChange: (tier: MuseumTier) => void;
  primarySectionValue: string;
  row: MuseumSaintPlacement;
  sectionNames: string[];
  tierValue: MuseumTier;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => trigger?.focus();
  }, []);
  return (
    <div className="museum-modal-backdrop" role="presentation">
      <section aria-labelledby={titleId} aria-modal="true" className="museum-modal" ref={dialogRef} role="dialog"
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); onClose(); }
          if (event.key !== "Tab") return;
          const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex='0']") ?? []);
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
        <div className="museum-modal__header">
          <div>
            <div className="museum-admin-kicker">Saint proposal</div>
            <h2 id={titleId}>{row.name}</h2>
          </div>
          <button aria-label="Close saint proposal" className="museum-icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <p className="museum-filter-note">These are historical proposal details. Preview controls below do not save changes.</p>
        <p><Link href={`/museumadmin/review?q=${encodeURIComponent(row.name)}`}>Find the saint in placement review</Link></p>
        <div className="museum-modal__actions">
          <label>
            <span>Status</span>
            <select onChange={(event) => onTierChange(event.target.value as MuseumTier)} value={tierValue}>
              {tiers.map((tier) => <option key={tier} value={tier}>{tier === "Featured" ? "Primary" : tier}</option>)}
            </select>
          </label>
          <label>
            <span>Primary section</span>
            <select onChange={(event) => onPrimarySectionChange(event.target.value)} value={primarySectionValue}>
              {sectionNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            <span>Anchor card</span>
            <select onChange={(event) => onAnchorChange(event.target.value)} value={anchorValue}>
              <option value="">No explicit anchor</option>
              <option value={`saint:${row.id}`}>Make a new anchor card with this saint</option>
              {anchorOptions
                .filter((option) => option.id !== `saint:${row.id}`)
                .map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <dl className="museum-saint-data">
          <DataItem label="Original primary section" value={row.section} />
          {primarySectionValue !== row.section ? <DataItem label="Proposed primary section" value={primarySectionValue} /> : null}
          <DataItem label="Alternate sections" value={row.alternatives.join("; ")} />
          <DataItem label="Confidence" value={row.confidence} />
          <DataItem label="Family" value={row.curatorialFamily || row.familyId} />
          <DataItem label="Family size" value={row.familySize ? String(row.familySize) : ""} />
          <DataItem label="Sampradaya" value={row.sampradaya} />
          <DataItem label="Spiritual regions" value={row.spiritualRegions.join("; ")} />
          <DataItem label="Normalized places" value={row.normalizedPlaces.join("; ")} />
          <DataItem label="Birth / samadhi" value={[member?.BirthDate, member?.SamadhiDate].filter(Boolean).join(" - ")} />
          <DataItem label="Masters" value={member?.Masters} />
          <DataItem label="Disciples" value={member?.Disciples} />
          <DataItem label="Partner" value={member?.Partner} />
          <DataItem label="Incarnation" value={member?.Incarnation} />
          <DataItem label="Rationale" value={row.rationale} wide />
          <DataItem label="Internal note" value={row.note} wide />
          <DataItem label="Review signal" value={row.needsResearch ? "Needs more research or cleanup review" : ""} wide />
        </dl>
      </section>
    </div>
  );
}

function DataItem({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  if (!value) return null;
  return (
    <div className={wide ? "museum-saint-data__wide" : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

