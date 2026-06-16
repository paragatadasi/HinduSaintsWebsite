import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { getKnownPlaceScope, STATE_PLACE_SLUGS } from "@/lib/place-taxonomy";
import { mergePlaces, updatePlace } from "../actions";

type AdminPlaceEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPlaceEditorPage({ params }: AdminPlaceEditorPageProps) {
  const { id } = await params;
  const place = await getPlace(id);

  if (!place) notFound();

  const effectivePlaceScope = getEffectivePlaceScope(place);
  const [statePlaces, mergeOptions] = await Promise.all([
    db.place.findMany({
      where: {
        id: { not: place.id },
        OR: [
          { placeScope: "state" },
          { slug: { in: Array.from(STATE_PLACE_SLUGS) } }
        ]
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    db.place.findMany({
      where: { id: { not: place.id } },
      orderBy: [
        { placeScope: "desc" },
        { name: "asc" }
      ],
      include: {
        _count: { select: { saints: true, localities: true } }
      }
    })
  ]);

  return (
    <div className="admin-stack">
      <div className="admin-toolbar">
        <div>
          <div className="eyebrow">Editing place</div>
          <h1>{place.name}</h1>
          <div className="review-meta">
            <StatusBadge label={formatStatus(effectivePlaceScope)} />
            <StatusBadge label={`${place._count.saints} saints`} />
            {place.parentState ? <StatusBadge label={`state: ${place.parentState.name}`} /> : null}
          </div>
        </div>
        <div className="review-actions">
          <Link className="button button--secondary" href="/admin/places">Back to places</Link>
          <Link className="button button--secondary" href={`/places/${place.slug}` as Route}>View public page</Link>
        </div>
      </div>

      <div className="review-detail-grid">
        <section className="review-panel">
          <h2>Public fields</h2>
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
              <select name="placeScope" defaultValue={effectivePlaceScope}>
                <option value="locality">Locality</option>
                <option value="state">State</option>
              </select>
            </label>
            <label>
              Parent state
              <select name="parentStateId" defaultValue={place.parentStateId ?? ""}>
                <option value="">No parent state</option>
                {statePlaces.map((state) => (
                  <option key={state.id} value={state.id}>{state.name}</option>
                ))}
              </select>
            </label>
            <label>
              Country
              <input name="country" defaultValue={place.country ?? ""} maxLength={120} />
            </label>
            <div className="form-stack__field">
              <label htmlFor="place-overview">Page overview</label>
              <MarkdownEditor
                defaultValue={place.overviewMarkdown ?? ""}
                maxLength={20000}
                name="overviewMarkdown"
                textareaId="place-overview"
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
        </section>

        <aside className="review-panel">
          <h2>Merge duplicate</h2>
          <p>Move saint relationships and child locality links from another record into this place.</p>
          <form action={mergePlaces} className="form-stack">
            <input name="targetPlaceId" type="hidden" value={place.id} />
            <label>
              Duplicate place
              <select name="sourcePlaceId" required>
                <option value="">Select duplicate</option>
                {mergeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({formatStatus(option.placeScope)}, {option._count.saints} saints)
                  </option>
                ))}
              </select>
            </label>
            <div className="review-actions">
              <button className="admin-form-button admin-form-button--warning" type="submit">Merge into this place</button>
            </div>
          </form>

          <div className="review-panel__subsection">
            <h3>Localities</h3>
            {place.localities.length > 0 ? (
              <div className="review-list">
                {place.localities.map((locality) => (
                  <Link className="admin-text-link" href={`/admin/places/${locality.slug}` as Route} key={locality.id}>
                    {locality.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p>No localities are attached.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

async function getPlace(slugOrId: string) {
  return db.place.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    },
    include: {
      parentState: { select: { id: true, name: true, slug: true } },
      localities: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true }
      },
      _count: { select: { saints: true } }
    }
  });
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function getEffectivePlaceScope(place: { placeScope: "locality" | "state"; slug: string }) {
  return getKnownPlaceScope(place.slug) === "state" ? "state" : place.placeScope;
}
