import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaintEncounter() {
  return (
    <aside className="saint-encounter home-encounter-card">
      <Sparkles className="home-encounter-card__icon" aria-hidden="true" />
      <p className="home-encounter-card__eyebrow">A chance encounter</p>
      <h2>Encounter a new saint</h2>
      <p>Step beyond the familiar and discover another life of devotion, wisdom, and service.</p>
      <Button href="/saints/random">Encounter a saint</Button>
    </aside>
  );
}
