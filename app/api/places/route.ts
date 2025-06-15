import { NextResponse } from "next/server";
import { polygons } from "./polygons";


interface PolygonInfo {
  id: number;
  name: string;
}

interface LocationResponse {
  current: PolygonInfo[];
  nearby200: PolygonInfo[];
  nearby500: PolygonInfo[];
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



export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, long } = body;

    // Validate presence and type of coordinates
    if (
      lat === undefined || long === undefined ||
      lat === '' || long === ''
    ) {
      return NextResponse.json(
        { error: "Missing or empty coordinates" },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const longNum = parseFloat(long);

    if (isNaN(latNum) || isNaN(longNum)) {
      return NextResponse.json(
        { error: "Invalid coordinate format" },
        { status: 400 }
      );
    }

    const point: Point = { lat: latNum, long: longNum };

    // Function to compute centroid of polygon
    function getCentroid(points: Point[]): Point {
      const total = points.length;
      const sum = points.reduce((acc, p) => {
        acc.lat += p.lat;
        acc.long += p.long;
        return acc;
      }, { lat: 0, long: 0 });

      return {
        lat: sum.lat / total,
        long: sum.long / total
      };
    }

    // Haversine formula for distance between two points (in meters)
    function getDistance(a: Point, b: Point): number {
      const R = 6371e3; // Earth radius in meters
      const toRad = (deg: number) => (deg * Math.PI) / 180;

      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.long - a.long);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);

      const aCalc =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));

      return R * c;
    }

    // 1. Check if point is inside any polygon
    function pointInPolygon(point: Point, polygon: Point[]): boolean {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].long;
        const xj = polygon[j].lat, yj = polygon[j].long;

        const intersect =
          yi > point.long !== yj > point.long &&
          point.lat < (xj - xi) * (point.long - yi) / (yj - yi + 0.0000001) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    }

    const matchedPolygons = polygons.filter(polygon =>
      pointInPolygon(point, polygon.points)
    );

    const nearbyPolygons200 = polygons.filter(polygon =>
      getDistance(point, getCentroid(polygon.points)) <= 200
    );

    const nearbyPolygons500 = polygons.filter(polygon => {
      const dist = getDistance(point, getCentroid(polygon.points));
      return dist > 200 && dist <= 500;
    });

    const responseLoc: LocationResponse = {
      current: matchedPolygons.map((p, i) => ({
        id: i,
        name: p.name,
      })),
      nearby200: nearbyPolygons200.map((p, i) => ({
        id: i,
        name: p.name,
      })),
      nearby500: nearbyPolygons500.map((p, i) => ({
        id: i,
        name: p.name,
      })),
    };

    // if (
    //   responseLoc.current.length === 0 &&
    //   responseLoc.nearby200.length === 0 &&
    //   responseLoc.nearby500.length === 0
    // ) {
    //   responseLoc.message = "No polygon match or nearby area found.";
    // }

    const response =  NextResponse.json(responseLoc, { status: 200 });

    
    return addCorsHeaders(response);



  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Types
type Point = {
  lat: number;
  long: number;
};
