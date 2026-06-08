import { toSlug } from "@/lib/slugs";

type Coordinate = {
  latitude: number;
  longitude: number;
};

const INDIA_BOUNDS = {
  minLatitude: 6,
  maxLatitude: 37.6,
  minLongitude: 68,
  maxLongitude: 98
};

const PLACE_COORDINATES: Record<string, Coordinate> = {
  "akkalkot": { latitude: 17.525, longitude: 76.206 },
  "alandi": { latitude: 18.677, longitude: 73.898 },
  "amravati": { latitude: 20.932, longitude: 77.752 },
  "andhra-pradesh": { latitude: 15.912, longitude: 79.74 },
  "arunachala": { latitude: 12.225, longitude: 79.074 },
  "assam": { latitude: 26.2, longitude: 92.937 },
  "badrinath": { latitude: 30.744, longitude: 79.493 },
  "bangalore": { latitude: 12.971, longitude: 77.594 },
  "bengal": { latitude: 23.685, longitude: 87.855 },
  "bhavnath": { latitude: 21.522, longitude: 70.52 },
  "burdwan": { latitude: 23.232, longitude: 87.861 },
  "bardwan": { latitude: 23.232, longitude: 87.861 },
  "calcutta": { latitude: 22.572, longitude: 88.364 },
  "cuttack": { latitude: 20.462, longitude: 85.883 },
  "cuttack-orissa": { latitude: 20.462, longitude: 85.883 },
  "dwaraka": { latitude: 22.244, longitude: 68.969 },
  "girnar": { latitude: 21.522, longitude: 70.522 },
  "gujarat": { latitude: 22.258, longitude: 71.192 },
  "guntur": { latitude: 16.306, longitude: 80.436 },
  "haridwar": { latitude: 29.946, longitude: 78.164 },
  "hubli": { latitude: 15.365, longitude: 75.124 },
  "jabalpur": { latitude: 23.181, longitude: 79.986 },
  "jaipur": { latitude: 26.912, longitude: 75.787 },
  "jodhpur": { latitude: 26.238, longitude: 73.024 },
  "junagadh": { latitude: 21.522, longitude: 70.457 },
  "karnataka": { latitude: 15.317, longitude: 75.713 },
  "kerala": { latitude: 10.85, longitude: 76.271 },
  "kolhapur": { latitude: 16.705, longitude: 74.243 },
  "kopargaon": { latitude: 19.883, longitude: 74.477 },
  "madhya-pradesh": { latitude: 22.974, longitude: 78.657 },
  "maharashtra": { latitude: 19.751, longitude: 75.714 },
  "majuli-assam": { latitude: 26.949, longitude: 94.222 },
  "mayapur": { latitude: 23.424, longitude: 88.389 },
  "mumbai": { latitude: 19.076, longitude: 72.878 },
  "nagpur": { latitude: 21.146, longitude: 79.088 },
  "narasimha-wadi": { latitude: 16.683, longitude: 74.587 },
  "navadwip": { latitude: 23.407, longitude: 88.367 },
  "nellore": { latitude: 14.443, longitude: 79.986 },
  "pandharpur": { latitude: 17.674, longitude: 75.323 },
  "pune": { latitude: 18.52, longitude: 73.856 },
  "pune-india": { latitude: 18.52, longitude: 73.856 },
  "puri": { latitude: 19.813, longitude: 85.831 },
  "puri-orissa": { latitude: 19.813, longitude: 85.831 },
  "puri-navadwip": { latitude: 21.61, longitude: 87.1 },
  "pushkar": { latitude: 26.489, longitude: 74.551 },
  "radha-kund": { latitude: 27.524, longitude: 77.492 },
  "rajkot-virpur": { latitude: 22.068, longitude: 70.798 },
  "rajasthan": { latitude: 27.024, longitude: 74.217 },
  "rishikesh": { latitude: 30.086, longitude: 78.267 },
  "serampur": { latitude: 22.752, longitude: 88.342 },
  "shirdi": { latitude: 19.766, longitude: 74.477 },
  "sri-rangam": { latitude: 10.862, longitude: 78.692 },
  "tamil-nadu": { latitude: 11.127, longitude: 78.657 },
  "thiruvananthpuram": { latitude: 8.524, longitude: 76.936 },
  "uttar-pradesh": { latitude: 26.846, longitude: 80.946 },
  "uttarakhand": { latitude: 30.066, longitude: 79.019 },
  "uttarkhand": { latitude: 30.066, longitude: 79.019 },
  "varanasi": { latitude: 25.318, longitude: 82.974 },
  "vrindavan": { latitude: 27.565, longitude: 77.659 },
  "vrindavan-india": { latitude: 27.565, longitude: 77.659 },
  "west-bengal": { latitude: 22.987, longitude: 87.855 }
};

export function getPlaceCoordinate(name: string, latitude?: number | null, longitude?: number | null) {
  if (latitude != null && longitude != null && isInIndia(latitude, longitude)) {
    return { latitude, longitude };
  }

  const slug = toSlug(name);
  const coordinate = PLACE_COORDINATES[slug];
  return coordinate && isInIndia(coordinate.latitude, coordinate.longitude) ? coordinate : null;
}

export function isInIndia(latitude: number, longitude: number) {
  return (
    latitude >= INDIA_BOUNDS.minLatitude
    && latitude <= INDIA_BOUNDS.maxLatitude
    && longitude >= INDIA_BOUNDS.minLongitude
    && longitude <= INDIA_BOUNDS.maxLongitude
  );
}
