import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Changed to Promise
) {
  const { id } = await params; // Await params

  try {
    const polygon = await prisma.polygon.findUnique({
      where: { id },
      include: { 
        points: true,
        municipality: true,
        province: true
       },
    });

    if (!polygon) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(polygon);
  } catch (error) {
    console.error('[GET_POLYGON_BY_ID]', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Changed to Promise
) {
  const { id } = await params; // Await params
  const { name, munId, provId, points } = await request.json();

  try {
    await prisma.point.deleteMany({ where: { polygonId: id } });
    const polygon = await prisma.polygon.update({
      where: { id },
      data: {
        name,
        munId,
        provId,
        points: { create: points.map((p: { lat: number; long: number }) => ({ lat: p.lat, long: p.long })) },
      },
    });
    return NextResponse.json(polygon);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update polygon' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Changed to Promise
) {
  const { id } = await params; // Await params

  try {
    await prisma.point.deleteMany({ where: { polygonId: id } });
    await prisma.polygon.delete({ where: { id } });
    return NextResponse.json({ message: 'Polygon deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete polygon' }, { status: 500 });
  }
}