// app/api/places/utils.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Point {
  lat: number;
  long: number;
}

interface GeoPolygon {
  id: string;
  name: string;
  polType: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  } | null;
}

export interface PolygonInfo {
  polType: string;
  name: string;
}

export interface PlacesResponse {
  current: PolygonInfo[];
  nearby200: PolygonInfo[];
  nearby500: PolygonInfo[];
}

// Custom sorting function for polType order
const polTypeOrder = ['bldg', 'lot', 'road', 'bar', 'mun'];
const getPolTypeIndex = (polType: string): number => {
  const index = polTypeOrder.indexOf(polType.toLowerCase());
  return index === -1 ? polTypeOrder.length : index;
};


function getEdgeDistance(polygonA: Point[], polygonB: Point[]): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  let minDist = Infinity;

  for (const a of polygonA) {
    for (const b of polygonB) {
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.long - a.long);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);

      const aCalc =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
      const d = R * c;

      if (d < minDist) minDist = d;
    }
  }

  return minDist;
}


export async function getLocationData(lat: string, long: string): Promise<PlacesResponse> {
  try {
    // Validate coordinates
    const latNum = parseFloat(lat);
    const longNum = parseFloat(long);
    if (isNaN(latNum) || isNaN(longNum) || latNum < -90 || latNum > 90 || longNum < -180 || longNum > 180) {
      throw new Error('Invalid coordinates');
    }

    const point: Point = { lat: latNum, long: longNum };

    // Fetch polygons from Prisma
    const rawPolygons = await prisma.geoPolygon.findMany();
    const polygons: GeoPolygon[] = rawPolygons.map((p) => ({
      id: p.id,
      name: p.name,
      polType: p.polType ?? '',
      geometry: p.geometry
        ? typeof p.geometry === 'string'
          ? JSON.parse(p.geometry)
          : (p.geometry as { type: string; coordinates: number[][][] })
        : null,
    }));

    // Format polygons
    const formattedPolygons = polygons
      .filter((p): p is GeoPolygon & { geometry: NonNullable<GeoPolygon['geometry']> } => {
        if (!p.geometry || p.geometry.type !== 'Polygon' || !Array.isArray(p.geometry.coordinates)) {
          console.warn(`Skipping polygon "${p.name}" (ID: ${p.id}) due to invalid geometry`);
          return false;
        }
        return true;
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        polType: p.polType,
        points: p.geometry.coordinates[0].map((coord: number[]) => ({
          lat: coord[1],
          long: coord[0],
        })),
      }));

    // Point-in-polygon check
    function pointInPolygon(point: Point, polygon: Point[]): boolean {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat;
        const yi = polygon[i].long;
        const xj = polygon[j].lat;
        const yj = polygon[j].long;

        const intersect =
          yi > point.long !== yj > point.long &&
          point.lat < (xj - xi) * (point.long - yi) / (yj - yi + 0.0000001) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    }

    const matchedPolygons = formattedPolygons.filter((polygon) => pointInPolygon(point, polygon.points));



    // Nearby polygons
    const nearbyPolygons200 = formattedPolygons.filter((polygon) => {
      const dist = getEdgeDistance([{ lat: point.lat, long: point.long }], polygon.points);
      return dist > 10 && dist <= 199 && (polygon.polType === 'bldg' || polygon.polType === 'lot');
    });

    const nearbyPolygons500 = formattedPolygons.filter((polygon) => {
      const dist = getEdgeDistance([{ lat: point.lat, long: point.long }], polygon.points);
      return dist > 200 && dist <= 500 && (polygon.polType === 'bldg' || polygon.polType === 'lot');
    });







    // Sort by polType
    const current = matchedPolygons
      .map((p) => ({
        polType: p.polType,
        name: p.name,
      }))
      .sort((a, b) => getPolTypeIndex(a.polType) - getPolTypeIndex(b.polType));

    // If you want to return only the matched polygons as per PlacesResponse

    const final = {current: current, nearby200:nearbyPolygons200, nearby500:nearbyPolygons500}

    return ( final );





  } catch (error) {
    console.error('Error fetching location data:', error);
    throw new Error('Failed to fetch location data');
  } finally {
    await prisma.$disconnect();
  }
}