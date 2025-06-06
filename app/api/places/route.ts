import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { polygons } from './polygons';

const prisma = new PrismaClient();

interface Point {
  lat: number;
  long: number;
}

interface EmergencyResponse {
  message: string;
  matchedPolygons?: string[];
  status: string;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const { lat, long } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].long;
    const xj = polygon[j].lat;
    const yj = polygon[j].long;

    const intersect =
      (yi > long) !== (yj > long) &&
      lat < ((xj - xi) * (long - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export async function POST(request: NextRequest) {

  try {

    // Parse and validate request body
    const requestBody = await request.json();
    const { lat, long } = requestBody;

    if (!lat || !long) {
      return NextResponse.json(
        { error: "Missing required coordinates" },
        { status: 400 }
      );
    }

    if (isNaN(lat) || isNaN(long)) {
      return NextResponse.json(
        { error: "Invalid coordinate format" },
        { status: 400 }
      );
    }

    const point: Point = { lat: Number(lat), long: Number(long) };
    
    // Find matching polygons
    const matchedPolygons = polygons.filter(poly => 
      isPointInPolygon(point, poly.points)
    );

    // Prepare response
    const response: EmergencyResponse = {
      message: "Success",
      status: matchedPolygons.length > 0 
        ? matchedPolygons.map(poly => poly.name).join(', ')
        : 'unknown location',
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error("Error processing emergency location:", error);
    return NextResponse.json(
      { message: "Failed to process location data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}