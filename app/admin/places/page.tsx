import Link from "next/link";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { mergePlaces, updatePlace } from "./actions";

export default async function AdminPlacesPage() {
  const places = await db.place.findMany({
    orderBy: [
      { placeScope: "desc" },
      { name: "asc" }
    ],
    include: {
      parentState: { select: { id: true, name: true } },
      _count: { select: { saints: true, localities: true } }
    }
  });
  const placeOptions = places.map((place) => ({
    id: place.id,
    label: `${place.name} (${formatStatus(place.placeScope)}, ${place._count.saints} saints)`
  }));
  const stateOptions = places.filter((place) => place.placeScope === "state");

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Place editor</div>
          <h1>Places</h1>
          <p className="lede">Edit place pages, classify states and localities, attach localities to states, and merge duplicates.</p>
        </div>
      </div>

      <section className="review-panel">
        <h2>Consolidate duplicates</h2>
        <p>Move saint relationships and child locality links from a duplicate place into the canonical place.</p>
        <form action={mergePlaces} className="form-stack">
          <label>
            Duplicate place
            <select name="sourcePlaceId" required>
              <option value="">Select duplicate</option>
              {placeOptions.map((place) => (
                <option key={place.id} value={place.id}>{place.label}</option>
              ))}
            </select>
          </label>
          <label>
            Canonical place
            <select name="targetPlaceId" required>
              <option value="">Select canonical</option>
              {placeOptions.map((place) => (
                <option key={place.id} value={place.id}>{place.label}</option>
              ))}
            </select>
          </label>
          <div className="review-actions">
            <button className="admin-form-button admin-form-button--warning" type="submit">Merge duplicate</button>
          </div>
        </form>
      </section>

      <section className="review-list" aria-label="Place records">
        {places.map((place) => (
          <article className="review-panel" key={place.id}>
            <div className="admin-toolbar">
              <div>
                <div className="review-meta">
                  <StatusBadge label={formatStatus(place.placeScope)} />
                  <StatusBadge label={`${place._count.saints} saints`} />
                  {place.parentState ? <StatusBadge label={`state: ${place.parentState.name}`} /> : null}
                  {place._count.localities > 0 ? <StatusBadge label={`${place._count.localities} localities`} /> : null}
                </div>
                <h2>{place.name}</h2>
              </div>
              <Link className="button button--secondary" href={`/places/${place.slug}`}>View public page</Link>
            </div>

            <form action={updatePlace} className="form-stack">
              <input name="placeId" type="hidden" value={place.id} />
              <label>
                Name
                <input name="name" defaultValue={place.name} required maxLength={200} />
              </label>
              <label>
                Alternate names
                <textarea name="alternateNames" defaultValue={place.alternateNames.join("\n")} />
              </label>
              <label>
                Place unit
                <select name="placeScope" defaultValue={place.placeScope}>
                  <option value="locality">Locality</option>
                  <option value="state">State</option>
                </select>
              </label>
              <label>
                Parent state
                <select name="parentStateId" defaultValue={place.parentStateId ?? ""}>
                  <option value="">No parent state</option>
                  {stateOptions
                    .filter((state) => state.id !== place.id)
                    .map((state) => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                </select>
              </label>
              <label>
                Region
                <input name="region" defaultValue={place.region ?? ""} maxLength={200} />
              </label>
              <label>
                Country
                <input name="country" defaultValue={place.country ?? ""} maxLength={120} />
              </label>
              <div className="form-stack__field">
                <label htmlFor={`place-overview-${place.id}`}>Page overview</label>
                <MarkdownEditor
                  defaultValue={place.overviewMarkdown ?? ""}
                  maxLength={20000}
                  name="overviewMarkdown"
                  textareaId={`place-overview-${place.id}`}
                />
              </div>
              <label>
                Internal notes
                <textarea name="notes" defaultValue={place.notes ?? ""} maxLength={1000} />
              </label>
              <div className="review-actions">
                <button className="admin-form-button" type="submit">Save place</button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
