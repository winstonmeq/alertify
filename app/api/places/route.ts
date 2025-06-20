import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PolygonInfo {
  polType: string;
  name: string;
}

interface LocationResponse {
  current: PolygonInfo[];
  nearby200: PolygonInfo[];
  nearby500: PolygonInfo[];
}

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

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  return addCorsHeaders(response);
}

// Custom sorting function for polType order
const polTypeOrder = ['bldg', 'lot', 'road', 'bar', 'mun'];
const getPolTypeIndex = (polType: string): number => {
  const index = polTypeOrder.indexOf(polType.toLowerCase());
  return index === -1 ? polTypeOrder.length : index; // Unknown types go to the end
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, long } = body;

    // Validate presence and type of coordinates
    if (lat === undefined || long === undefined || lat === '' || long === '') {
      return NextResponse.json({ error: 'Missing or empty coordinates' }, { status: 400 });
    }

    const latNum = parseFloat(lat);
    const longNum = parseFloat(long);

    if (isNaN(latNum) || isNaN(longNum)) {
      return NextResponse.json({ error: 'Invalid coordinate format' }, { status: 400 });
    }

    const point: Point = { lat: latNum, long: longNum };

    // Fetch polygons from MongoDB
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

    // Map to the expected format: { id, name, points: Point[] }
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

    // // Function to compute centroid of polygon
    // function getCentroid(points: Point[]): Point {
    //   const total = points.length;
    //   const sum = points.reduce(
    //     (acc, p) => {
    //       acc.lat += p.lat;
    //       acc.long += p.long;
    //       return acc;
    //     },
    //     { lat: 0, long: 0 }
    //   );

    //   return {
    //     lat: sum.lat / total,
    //     long: sum.long / total,
    //   };
    // }

    // // Haversine formula for distance between two polygons (based on centroids)
    // function getDistance(polygonA: Point[], polygonB: Point[]): number {
    //   const R = 6371e3; // Earth radius in meters
    //   const toRad = (deg: number) => (deg * Math.PI) / 180;

    //   // Get centroids of both polygons
    //   const centroidA = getCentroid(polygonA);
    //   const centroidB = getCentroid(polygonB);

    //   const dLat = toRad(centroidB.lat - centroidA.lat);
    //   const dLon = toRad(centroidB.long - centroidA.long);
    //   const lat1 = toRad(centroidA.lat);
    //   const lat2 = toRad(centroidB.lat);

    //   const aCalc =
    //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //     Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //   const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));

    //   return R * c;
    // }



    // Computes minimum edge-to-edge distance between two polygons
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



    // Check if point is inside any polygon
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

    const matchedPolygons = formattedPolygons.filter((polygon) =>
      pointInPolygon(point, polygon.points)
    );

    const nearbyPolygons200 = formattedPolygons.filter((polygon) => {
      const dist = getEdgeDistance([{ lat: point.lat, long: point.long }], polygon.points);
      return dist > 10 && dist <= 199 && (polygon.polType === 'bldg' || polygon.polType === 'lot');
    });

    const nearbyPolygons500 = formattedPolygons.filter((polygon) => {
      const dist = getEdgeDistance([{ lat: point.lat, long: point.long }], polygon.points);
      return dist > 200 && dist <= 500 && (polygon.polType === 'bldg' || polygon.polType === 'lot');
    });

    // Sort polygons by polType order
    const sortByPolType = (polygons: { polType: string; name: string }[]) =>
      polygons.sort((a, b) => getPolTypeIndex(a.polType) - getPolTypeIndex(b.polType));

    const responseLoc: LocationResponse = {
      current: sortByPolType(
        matchedPolygons.map((p) => ({
          polType: p.polType,
          name: p.name,
        }))
      ),
      nearby200: sortByPolType(
        nearbyPolygons200.map((p) => ({
          polType: p.polType,
          name: p.name,
        }))
      ),
      nearby500: sortByPolType(
        nearbyPolygons500.map((p) => ({
          polType: p.polType,
          name: p.name,
        }))
      ),
    };

    const response = NextResponse.json(responseLoc, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}