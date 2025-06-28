import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch a single polygon by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params; // Await params


  try {
    const polygon = await prisma.geoPolygon.findUnique({
      where: { id },
    });
    if (!polygon) {
      return NextResponse.json({ error: 'Polygon not found' }, { status: 404 });
    }
    return NextResponse.json(polygon, { status: 200 });
  } catch (error) {
    console.error('Error fetching polygon:', error);
    return NextResponse.json({ error: 'Failed to fetch polygon' }, { status: 500 });
  }
}

// PUT: Update a polygon by ID
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params; // Await params


  try {
    const { name, polType, geometry } = await req.json();
    
    // Validate input
    if (!name || !geometry || geometry.type !== 'Polygon' || !geometry.coordinates) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const polygon = await prisma.geoPolygon.update({
      where: { id },
      data: {
        name,
        polType,
        geometry,
      },
    });
    return NextResponse.json(polygon, { status: 200 });
  } catch (error) {
    console.error('Error updating polygon:', error);
    return NextResponse.json({ error: 'Failed to update polygon' }, { status: 500 });
  }
}

// DELETE: Delete a polygon by ID
export async function DELETE(req: NextRequest, { params }: { params:Promise<{ id: string }> }) {

         const { id } = await params; // Await params

  try {
    await prisma.geoPolygon.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Polygon deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting polygon:', error);
    return NextResponse.json({ error: 'Failed to delete polygon' }, { status: 500 });
  }
}