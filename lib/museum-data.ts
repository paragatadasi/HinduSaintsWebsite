import { cache } from "react";
import { requireCapability } from "@/lib/admin-access";
import { readMuseumData } from "@/lib/museum-working-data";

// Request-scoped caching only. Later requests always read current canonical data.
export const getMuseumData = cache(async () => {
  await requireCapability("access_museum");
  return readMuseumData();
});
