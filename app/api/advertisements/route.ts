import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Input validation schemas using Zod
const createAdSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  sponsor: z.string().min(1, 'Sponsor is required'),
  location: z.string().min(1, 'Location is required'),
  imageURL: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')), // New field
  provId: z.string().optional(),
});

const updateAdSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  sponsor: z.string().min(1, 'Sponsor is required').optional(),
  location: z.string().min(1, 'Location is required').optional(),
  imageURL: z.string().url().optional().or(z.literal('')).optional(),
  facebookUrl: z.string().url().optional().or(z.literal('')).optional(), // New field
  provId: z.string().optional(),
});

// GET /api/advertisements?provId=[provId]
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provId = searchParams.get('provId');

    const advertisements = await prisma.advertisement.findMany({
      where: {
        provId: provId ? provId : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      advertisement_data: advertisements,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisements' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/advertisements
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createAdSchema.parse(body);

    const advertisement = await prisma.advertisement.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        sponsor: validatedData.sponsor,
        location: validatedData.location,
        imageURL: validatedData.imageURL,
        facebookUrl: validatedData.facebookUrl, // Include new field
        provId: validatedData.provId,
      },
    });

    return NextResponse.json({
      advertisement_data: advertisement,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to create advertisement' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/advertisements/[id]
export async function PUT(request: Request) {
  try {
    const { pathname, searchParams } = new URL(request.url);
    const id = pathname.split('/').pop(); // Extract ID from URL

    if (!id) {
      return NextResponse.json(
        { error: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateAdSchema.parse(body);

    const existingAd = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!existingAd) {
      return NextResponse.json(
        { error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    const advertisement = await prisma.advertisement.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        sponsor: validatedData.sponsor,
        location: validatedData.location,
        imageURL: validatedData.imageURL,
        facebookUrl: validatedData.facebookUrl,
        provId: validatedData.provId,
      },
    });

    return NextResponse.json({
      advertisement_data: advertisement,
    }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to update advertisement' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/advertisements/[id]
export async function DELETE(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    const id = pathname.split('/').pop(); // Extract ID from URL

    if (!id) {
      return NextResponse.json(
        { error: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    const existingAd = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!existingAd) {
      return NextResponse.json(
        { error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    await prisma.advertisement.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Advertisement deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to delete advertisement' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}