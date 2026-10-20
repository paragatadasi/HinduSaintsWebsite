import {createHash} from "node:crypto";
import research from "@/data/research/saints-key-localities-2026-10-19-v4.json";
import {keyLocalityBundleSchema} from "@/lib/key-locality-domain";
export const keyLocalityResearch=keyLocalityBundleSchema.parse(research);
export const keyLocalityResearchHash=createHash("sha256").update(JSON.stringify(research)).digest("hex");
