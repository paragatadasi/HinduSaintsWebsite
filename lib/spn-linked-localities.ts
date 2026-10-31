import geography from '@/data/museum/spn-linked-localities.json';
import type {ExplorerSaint} from './spn-room-explorer';

const provisionalKamaal = {sourceId: 'recpyhIScDxJbDdE1', saintId: 'cms0w7hid06pu07qixhc35ehi'};
function hasProvisionalLocality(row: {sourceId: string; saintId: string | null}) {
  return row.sourceId === provisionalKamaal.sourceId && row.saintId === provisionalKamaal.saintId;
}
export function provisionalLocalityForSaint(saint: ExplorerSaint): string | null {
  return saint.observations.some(hasProvisionalLocality) ? 'Possible Khed Shivapur / Pune · identity review' : null;
}

export const localityPoints = geography.points;
export const localityLand = geography.land;
export function localitiesForSaints(saints: ExplorerSaint[], vitrine: string) {
  const sources = new Set(saints.flatMap(s => s.observations.filter(r => r.effectiveVitrine === vitrine && !hasProvisionalLocality(r)).map(r => r.sourceId)));
  return localityPoints.filter(point => point.sourceIds.some(id => sources.has(id)));
}
export function saintHasLocality(saint: ExplorerSaint, vitrine: string, placeId: string) {
  const point = localityPoints.find(p => p.id === placeId);
  return !!point && saint.observations.some(r => r.effectiveVitrine === vitrine && !hasProvisionalLocality(r) && point.sourceIds.includes(r.sourceId));
}
export function projectLocality(coordinates: number[]) {
  const [longitude, latitude] = coordinates;
  return [longitude, -180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, latitude)) * Math.PI / 360))];
}
