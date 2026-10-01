import Link from "next/link";
import type { Route } from "next";
import { SaintHeroGallery } from "@/components/saints/saint-hero-gallery";
import { SaintProfileSummary } from "@/components/saints/saint-profile-summary";
import type { MuseumSaintProfile as Profile } from "@/lib/museum-saint-profile";

export function MuseumSaintProfile({ profile, titleId }: { profile: Profile; titleId: string }) {
  return <section className="museum-saint-profile" aria-labelledby={titleId}>
    <div className="museum-saint-profile__biography">
      <h2 id={titleId}>{profile.name}</h2>
      {profile.facts.length ? <dl className="museum-saint-profile__facts">
        {profile.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
      </dl> : <p className="muted">Biographical details have not been recorded yet.</p>}
      {profile.description ? <SaintProfileSummary>{profile.description}</SaintProfileSummary> : <p className="muted">A short biography has not been recorded yet.</p>}
      {profile.publicSlug || profile.postUrl ? <div className="review-actions">
        {profile.publicSlug ? <Link className="button button--secondary" target="_blank" rel="noreferrer" href={`/saints/${profile.publicSlug}` as Route}>View saint page</Link> : null}
        {profile.postUrl ? <a className="button button--secondary" href={profile.postUrl} target="_blank" rel="noreferrer">View the post</a> : null}
      </div> : null}
    </div>
    {profile.images.length ? <SaintHeroGallery images={profile.images} saintName={profile.name} /> : <div className="museum-saint-profile__no-photo">Photo not available</div>}
  </section>;
}
