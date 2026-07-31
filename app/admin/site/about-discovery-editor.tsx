"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ABOUT_DISCOVERY_ITEM_LIMIT } from "@/lib/site-content";

type DiscoveryItem = {
  title: string;
  body: string;
  href: string;
  icon: "sparkles" | "book" | "map" | "flame";
};

export function AboutDiscoveryEditor({ items: initialItems }: { items: DiscoveryItem[] }) {
  const nextKey = useRef(initialItems.length);
  const [items, setItems] = useState(() => initialItems.map((item, index) => ({ ...item, key: `discovery-${index}` })));

  return (
    <div className="form-stack">
      <div className="review-list">
        {items.map((item, index) => (
          <div className="review-row" key={item.key}>
            <div className="section-heading">
              <div className="eyebrow">Discovery card {index + 1}</div>
              {items.length > 1 ? (
                <button className="admin-form-button admin-form-button--low-priority" type="button" onClick={() => setItems((current) => current.filter((candidate) => candidate.key !== item.key))}>
                  <Trash2 size={16} aria-hidden="true" /> Remove
                </button>
              ) : null}
            </div>
            <div className="field-grid field-grid--identity-line">
              <label>Title<input name="aboutDiscoveryItemTitle" maxLength={80} required type="text" defaultValue={item.title} /></label>
              <label>
                Icon
                <select name="aboutDiscoveryItemIcon" defaultValue={item.icon}>
                  <option value="sparkles">Sparkles</option>
                  <option value="book">Book</option>
                  <option value="map">Map</option>
                  <option value="flame">Flame</option>
                </select>
              </label>
            </div>
            <label>Description<textarea name="aboutDiscoveryItemBody" maxLength={300} required defaultValue={item.body} /></label>
            <label>Destination<input name="aboutDiscoveryItemHref" maxLength={500} required type="text" defaultValue={item.href} /></label>
          </div>
        ))}
      </div>
      <div className="review-actions">
        <button className="admin-form-button admin-form-button--secondary" disabled={items.length >= ABOUT_DISCOVERY_ITEM_LIMIT} type="button" onClick={() => {
          const key = nextKey.current++;
          setItems((current) => [...current, { title: "", body: "", href: "/", icon: "sparkles", key: `discovery-${key}` }]);
        }}>
          <Plus size={16} aria-hidden="true" /> Add discovery card
        </button>
      </div>
    </div>
  );
}
