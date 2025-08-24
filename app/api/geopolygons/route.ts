import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const polygons = await prisma.geoPolygon.findMany();
    return NextResponse.json(polygons, { status: 200 });
  } catch (error) {
    console.error('Error fetching polygons:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch polygons', details: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, provId, munId, polType, geometry } = await req.json();
    
    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing name' }, { status: 400 });
    }
    if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) {
      return NextResponse.json({ error: 'Invalid GeoJSON: Must be a Polygon with coordinates array' }, { status: 400 });
    }
    if (!geometry.coordinates[0] || geometry.coordinates[0].length < 4) {
      return NextResponse.json({ error: 'Invalid Polygon: Must have at least 4 coordinates forming a closed ring' }, { status: 400 });
    }

    const polygon = await prisma.geoPolygon.create({
      data: {
        name,
        provId, 
        munId,
        polType,
        geometry,
      },
    });
    return NextResponse.json(polygon, { status: 201 });
  } catch (error) {
    console.error('Error creating polygon:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to create polygon', details: errorMessage }, { status: 500 });
  }
}