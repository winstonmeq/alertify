import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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



// GET: Fetch a single emergency by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const emergency = await prisma.emergency.findUnique({
      where: { id:id },
    });
    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }
    return NextResponse.json(emergency, { status: 200 });
  } catch (error) {
    console.error('Error fetching emergency:', error);
    return NextResponse.json({ error: 'Failed to fetch emergency' }, { status: 500 });
  }
}

// PUT: Update an emergency by ID (only status and verified)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  console.log(id)

  try {
    const data = await req.json();
    const { status, verified } = data;

    if (!status || !verified) {
      return NextResponse.json({ error: 'Status and verified must be boolean values' }, { status: 400 });
    }

    const response = await prisma.emergency.update({
      where: { id },
      data: {
        status,
        verified,
      },
    });
    
    const responseData = NextResponse.json(response, { status: 200 });

    return addCorsHeaders(responseData);

  } catch (error) {

    console.error('Error updating emergency:', error);

    return NextResponse.json({ error: 'Failed to update emergency' }, { status: 500 });

  }
}

// DELETE: Delete an emergency by ID
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.emergency.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Emergency deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting emergency:', error);
    return NextResponse.json({ error: 'Failed to delete emergency' }, { status: 500 });
  }
}