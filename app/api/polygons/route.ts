import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

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

export async function POST(request: Request) {
  const { name, munId, provId, points } = await request.json();
  try {
    console.log(name, munId, provId, points);

    const polygon = await prisma.polygon.create({
      data: {
        name,
        munId,
        provId,
        points: { create: points.map((p: { lat: number; long: number }) => ({ lat: p.lat, long: p.long })) },
      },
    });
    const response = NextResponse.json(polygon, { status: 201 });
    return addCorsHeaders(response);
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to create polygon' }, { status: 500 });
    console.log(error)
    return addCorsHeaders(response);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const munId = searchParams.get("munId") || undefined;
  const provId = searchParams.get("provId") || undefined;

  try {
    const responseData = await prisma.polygon.findMany({
      where: {
        ...(provId && { provId }),
        ...(munId && { munId }),
      },
      include: {
        province: true,
        municipality: true,
        points: true,
      },
    });

    const response = NextResponse.json(responseData);

    return addCorsHeaders(response);
    
  } catch (error) {
    const response = NextResponse.json({ error: 'Failed to fetch polygons' }, { status: 500 });
    console.log(error)
    return addCorsHeaders(response);
  }
}