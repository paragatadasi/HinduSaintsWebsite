"use client";

import { useState } from "react";

export function PublicDesignPreviewFrame() {
  const [width, setWidth] = useState("wide");
  return (
    <section className="admin-stack" aria-label="Public component preview">
      <div className="design-system-toolbar">
        <label htmlFor="design-preview-width">Preview width</label>
        <select id="design-preview-width" value={width} onChange={(event) => setWidth(event.target.value)}>
          <option value="wide">Available width</option>
          <option value="tablet">Tablet · 768px</option>
          <option value="phone">Phone · 390px</option>
        </select>
        <a href="/design-system-preview" target="_blank" rel="noopener noreferrer">Open full preview</a>
      </div>
      <p>Examples use production components and invented content. Links and forms inside the specimen collection do not navigate or submit. The public header and footer retain their normal behavior.</p>
      <div className="design-system-frame-viewport">
        <iframe className={`design-system-frame design-system-frame--${width}`} src="/design-system-preview" title="Public design system component specimens" />
      </div>
    </section>
  );
}
