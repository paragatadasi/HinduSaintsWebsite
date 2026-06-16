import { toSlug } from "./slugs";

export const STATE_PLACE_SLUGS = new Set([
  "andhra-pradesh",
  "assam",
  "bengal",
  "gujarat",
  "karnataka",
  "kerala",
  "madhya-pradesh",
  "maharashtra",
  "odisha",
  "orissa",
  "rajasthan",
  "tamil-nadu",
  "uttar-pradesh",
  "uttarakhand",
  "uttarkhand",
  "west-bengal"
]);

export const PLACE_STATE_SLUGS = new Map([
  ["akkalkot", "maharashtra"],
  ["alandi", "maharashtra"],
  ["amravati", "maharashtra"],
  ["arunachala", "tamil-nadu"],
  ["badrinath", "uttarakhand"],
  ["bangalore", "karnataka"],
  ["bhavnath", "gujarat"],
  ["burdwan", "west-bengal"],
  ["bardwan", "west-bengal"],
  ["calcutta", "west-bengal"],
  ["cuttack", "odisha"],
  ["cuttack-orissa", "odisha"],
  ["dwaraka", "gujarat"],
  ["girnar", "gujarat"],
  ["guntur", "andhra-pradesh"],
  ["haridwar", "uttarakhand"],
  ["hubli", "karnataka"],
  ["jabalpur", "madhya-pradesh"],
  ["jaipur", "rajasthan"],
  ["jodhpur", "rajasthan"],
  ["junagadh", "gujarat"],
  ["kolhapur", "maharashtra"],
  ["kopargaon", "maharashtra"],
  ["majuli-assam", "assam"],
  ["mayapur", "west-bengal"],
  ["mumbai", "maharashtra"],
  ["nagpur", "maharashtra"],
  ["narasimha-wadi", "maharashtra"],
  ["navadwip", "west-bengal"],
  ["nellore", "andhra-pradesh"],
  ["pandharpur", "maharashtra"],
  ["pune", "maharashtra"],
  ["pune-india", "maharashtra"],
  ["puri", "odisha"],
  ["puri-orissa", "odisha"],
  ["pushkar", "rajasthan"],
  ["radha-kund", "uttar-pradesh"],
  ["rajkot-virpur", "gujarat"],
  ["rishikesh", "uttarakhand"],
  ["serampur", "west-bengal"],
  ["shirdi", "maharashtra"],
  ["sri-rangam", "tamil-nadu"],
  ["thiruvananthpuram", "kerala"],
  ["varanasi", "uttar-pradesh"],
  ["vrindavan", "uttar-pradesh"],
  ["vrindavan-india", "uttar-pradesh"]
]);

export function getPlaceTaxonomySlug(nameOrSlug: string) {
  return toSlug(nameOrSlug.replace(/,\s*(india|orissa)$/i, "").trim());
}

export function getKnownPlaceScope(nameOrSlug: string): "state" | "locality" {
  return STATE_PLACE_SLUGS.has(getPlaceTaxonomySlug(nameOrSlug)) ? "state" : "locality";
}

export function getKnownStateSlug(nameOrSlug: string) {
  const slug = getPlaceTaxonomySlug(nameOrSlug);
  if (STATE_PLACE_SLUGS.has(slug)) return slug;
  return PLACE_STATE_SLUGS.get(slug);
}
