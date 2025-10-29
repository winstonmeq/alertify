// app/api/places/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getLocationData, PolygonInfo } from './utils';

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

interface LocationResponse {
  current: PolygonInfo[];
  nearby200: PolygonInfo[];
  nearby500: PolygonInfo[];
}

const polTypeOrder = ['bldg', 'lot', 'road', 'bar', 'mun'];
const getPolTypeIndex = (polType: string): number => {
  const index = polTypeOrder.indexOf(polType.toLowerCase());
  return index === -1 ? polTypeOrder.length : index;
};

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  return addCorsHeaders(response);
}


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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const long = searchParams.get('long');

  if (!lat || !long) {
    return addCorsHeaders(NextResponse.json({ error: 'Missing coordinates' }, { status: 400 }));
  }

  try {
    // Get core location data
    const coreData = await getLocationData(lat, long);

    // Fetch polygons for nearby calculations
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

    const latNum = parseFloat(lat);
    const longNum = parseFloat(long);
    const point: Point = { lat: latNum, long: longNum };

    // Nearby polygons
    const nearbyPolygons200 = formattedPolygons.filter((polygon) => {
      const dist = getEdgeDistance([{ lat: point.lat, long: point.long }], polygon.points);
      return dist > 10 && dist <= 199 && (polygon.polType === 'bldg' || polygon.polType === 'lot');
    });

    const nearbyPolygons500 = formattedPolygons.filter((polygon) => {
      const dist = getEdgeDistance([{ lat: point.lat, long: point.long }], polygon.points);
      return dist > 200 && dist <= 500 && (polygon.polType === 'bldg' || polygon.polType === 'lot');
    });

    // Sort polygons
    const sortByPolType = (polygons: { polType: string; name: string }[]) =>
      polygons.sort((a, b) => getPolTypeIndex(a.polType) - getPolTypeIndex(b.polType));

    const responseLoc: LocationResponse = {
      current: coreData.current,
      nearby200: sortByPolType(nearbyPolygons200.map((p) => ({ polType: p.polType, name: p.name }))),
      nearby500: sortByPolType(nearbyPolygons500.map((p) => ({ polType: p.polType, name: p.name }))),
    };

    const response = NextResponse.json(responseLoc, { status: 200 });
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error('Error processing request:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Server error', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}