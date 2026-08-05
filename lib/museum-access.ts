import { assertCapability } from "@/lib/admin-access";
import type { Capability } from "@/lib/permissions";

export function museumMutationCapabilities(destructive = false): Capability[] {
  return destructive ? ["manage_museum", "manage_sensitive_actions"] : ["manage_museum"];
}

export async function assertMuseumMutation(destructive = false) {
  let actor;
  for (const capability of museumMutationCapabilities(destructive)) actor = await assertCapability(capability);
  return actor!;
}
