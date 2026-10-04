import {cache} from "react";
import {readVrindavanWorkingData} from "./vrindavan-working-data";
// Request-local deduplication for the authenticated layout and section page.
// Callers must check access_museum and view_full_saint_catalog before calling.
export const getVrindavanWorkspaceData=cache(()=>readVrindavanWorkingData());
