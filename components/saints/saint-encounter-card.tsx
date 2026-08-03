import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type SaintEncounterCardProps = {
  variant: "catalog" | "hero" | "profile";
};

export function SaintEncounterCard({ variant }: SaintEncounterCardProps) {
  const titleId = `saint-encounter-${variant}-title`;

  return (
    <aside
      className={`saint-encounter-card saint-encounter-card--${variant}`}
      aria-labelledby={titleId}
    >
      <Sparkles className="saint-encounter-card__icon" aria-hidden="true" />
      <p className="saint-encounter-card__eyebrow">A moment of discovery</p>
      {variant === "catalog" ? (
        <h3 id={titleId}>Encounter a New Saint</h3>
      ) : (
        <h2 id={titleId}>Encounter a New Saint</h2>
      )}
      <p>Allow providence to introduce you to a saint you may never have met before.</p>
      <Button href="/saints/random" icon={<ArrowRight size={16} />} iconPosition="end" prefetch={false}>
        Begin the encounter
      </Button>
    </aside>
  );
}
