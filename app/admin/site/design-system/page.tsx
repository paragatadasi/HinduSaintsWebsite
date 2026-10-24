import { PublicDesignPreviewFrame } from "@/components/design-system/preview-frame";
import { requireCapability } from "@/lib/admin-access";
import { publicDesignRegistry } from "@/lib/design-system/public-registry";

export const metadata = { title: "Public Design System", robots: { index: false, follow: false } };

export default async function PublicDesignSystemPage() {
  await requireCapability("manage_site");
  return <div className="admin-stack">
    <header><h2>Public Design System</h2><p>Review our existing public language before introducing another pattern. Nocturne is the active theme; cosmic is the selected homepage composition.</p></header>
    <PublicDesignPreviewFrame />
    <section className="admin-stack" aria-labelledby="design-inventory-title">
      <h2 id="design-inventory-title">Component inventory</h2>
      <p>Specimen: direct example. Composition: exercised through another example. Integration: review on its real page; a static specimen cannot verify its workflow.</p>
      <div className="design-system-table-scroll"><table className="design-system-inventory"><caption>{publicDesignRegistry.length} public component entries</caption>
        <thead><tr><th scope="col">Component</th><th scope="col">Variants and default</th><th scope="col">Use and coverage</th></tr></thead>
        <tbody>{publicDesignRegistry.map((entry) => <tr key={entry.id}>
          <th scope="row">{entry.name}<br /><code>{entry.source}</code></th>
          <td>{entry.variants.length ? entry.variants.join(", ") : "No named variants"}<br />Default: {entry.default}</td>
          <td>{entry.use}<br /><strong>{entry.coverage}</strong> · {entry.example}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}
