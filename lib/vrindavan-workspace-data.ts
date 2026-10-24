import {cache} from "react";
import {readVrindavanMuseumInventory} from "./vrindavan-museum-inventory";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
// Request-local deduplication for the authenticated layout and section page.
// Callers must check access_museum and view_full_saint_catalog before calling.
export const getVrindavanInventoryData=cache(()=>readVrindavanMuseumInventory());
export const getVrindavanWorkspaceData=cache(()=>readVrindavanWorkingData(undefined,getVrindavanInventoryData()));
