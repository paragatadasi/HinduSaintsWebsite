import geography from '@/data/museum/spn-linked-localities.json';
import type {ExplorerSaint} from './spn-room-explorer';

export const localityPoints = geography.points;
export const localityLand = geography.land;
export function localitiesForSaints(saints: ExplorerSaint[], vitrine: string) {
  const sources = new Set(saints.flatMap(s => s.observations.filter(r => r.effectiveVitrine === vitrine).map(r => r.sourceId)));
  return localityPoints.filter(point => point.sourceIds.some(id => sources.has(id)));
}
export function saintHasLocality(saint: ExplorerSaint, vitrine: string, placeId: string) {
  const point = localityPoints.find(p => p.id === placeId);
  return !!point && saint.observations.some(r => r.effectiveVitrine === vitrine && point.sourceIds.includes(r.sourceId));
}
export function projectLocality(coordinates: number[]) {
  const [longitude, latitude] = coordinates;
  return [longitude, -180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, latitude)) * Math.PI / 360))];
}
