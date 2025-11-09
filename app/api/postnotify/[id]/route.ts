import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');  // Allow localhost:3000 (or specific: 'http://localhost:3000')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');  // If using cookies/auth
  return response;
}

// Handle OPTIONS preflight requests (ALREADY GOOD)
export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  return addCorsHeaders(response);
}

// GET: Fetch a single emergency by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const posts = await prisma.postnotify.findUnique({
      where: { id: id },
    });

    if (!posts) {
      const errorResponse = NextResponse.json({ error: 'Posts Data not found' }, { status: 404 });
      return addCorsHeaders(errorResponse);  // <-- ADD THIS
    }

    const successResponse = NextResponse.json(posts, { status: 200 });
    return addCorsHeaders(successResponse);  // <-- ADD THIS

  } catch (error) {
    console.error('Error fetching emergency:', error);
    const errorResponse = NextResponse.json({ error: 'Failed to fetch emergency' }, { status: 500 });
    return addCorsHeaders(errorResponse);  // <-- ADD THIS
  }
}

// PUT: Update an emergency by ID (only status and verified)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  console.log(id);

  try {
    const data = await req.json();
    const { situation, barangay } = data;

    if (!situation || !barangay) {
      const errorResponse = NextResponse.json({ error: 'no situation and barangays values' }, { status: 400 });
      return addCorsHeaders(errorResponse);  // <-- ADD THIS (for consistency)
    }

    const updateposts = await prisma.postnotify.update({
      where: { id },
      data: {
        situation,
        barangay,
      },
    });

    const responseData = NextResponse.json(updateposts, { status: 200 });
    return addCorsHeaders(responseData);  // <-- ALREADY HERE

  } catch (error) {
    console.error('Error updating emergency:', error);
    const errorResponse = NextResponse.json({ error: 'Failed to update emergency' }, { status: 500 });
    return addCorsHeaders(errorResponse);  // <-- ADD THIS
  }
}

// DELETE: Delete an emergency by ID
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.postnotify.delete({
      where: { id },
    });
    const successResponse = NextResponse.json({ message: 'posts data deleted' }, { status: 200 });
    return addCorsHeaders(successResponse);  // <-- ADD THIS (KEY FIX!)
  } catch (error) {
    console.error('Error deleting emergency:', error);
    const errorResponse = NextResponse.json({ error: 'Failed to delete emergency' }, { status: 500 });
    return addCorsHeaders(errorResponse);  // <-- ADD THIS
  }
}