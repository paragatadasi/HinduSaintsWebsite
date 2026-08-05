"use client";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

type EntityType = "saint" | "tradition" | "place" | "instagram_item";
type PresenceUser = { id: string; label: string; mode: string };
export function AdminPresence({ entityType, entityId }: { entityType: EntityType; entityId: string }) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  useEffect(() => {
    let active = true;
    const run = async () => { const response = await fetch("/api/admin/presence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entityType, entityId, mode: document.activeElement?.closest("form") ? "editing" : "viewing" }) }); if (!response.ok || !active) return; const list = await fetch(`/api/admin/presence?entityType=${entityType}&entityId=${entityId}`); if (list.ok && active) setUsers((await list.json()).users); };
    void run(); const timer = window.setInterval(run, 30_000); return () => { active = false; window.clearInterval(timer); };
  }, [entityId, entityType]);
  return <div className="review-meta" aria-label="Active collaborators">{users.map((user) => <StatusBadge key={user.id} label={`${user.label} · ${user.mode}`} />)}</div>;
}
