import data from "@/data/museum/layouts/spn-layout-2026-10-23.json";
import {layoutValidationErrors,type MuseumRoomLayout} from "./museum-room-layout";
// Import only from protected server routes; send the schematic to authorized clients.
export const spnMuseumLayout: MuseumRoomLayout = data as MuseumRoomLayout;
const errors=layoutValidationErrors(spnMuseumLayout);
if(errors.length)throw new Error(`Invalid SPN layout: ${errors.join("; ")}`);
