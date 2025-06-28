import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse} from "next/server";

const prisma = new PrismaClient();


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const province = await prisma.province.findUnique({
        where: { id },
        select: {
          id: true,
          provinceName: true,
          provinceFCMToken: true,
          hotlineNumber: true,
          pdrrmo: true,
          provlogo: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
      });
      if (!province) {
        return NextResponse.json({ error: 'Province not found' }, { status: 404 });
      }
      return NextResponse.json(province);
    }

    const provinces = await prisma.province.findMany({
      select: {
        id: true,
        provinceName: true,
        provinceFCMToken: true,
        hotlineNumber: true,
        pdrrmo: true,
        provlogo: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });
    return NextResponse.json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json({ error: 'Error fetching provinces' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newProvince = await prisma.province.create({
      data: {
        provinceName: body.provinceName,
        provinceFCMToken: body.provinceFCMToken,
        hotlineNumber: body.hotlineNumber,
        pdrrmo: body.pdrrmo,
        provlogo: body.provlogo,
        userId: body.userId,
      },
      select: {
        id: true,
        provinceName: true,
        provinceFCMToken: true,
        hotlineNumber: true,
        pdrrmo: true,
        provlogo: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });
    return NextResponse.json(newProvince, { status: 201 });
  } catch (error) {
    console.error('Error creating province:', error);
    return NextResponse.json({ error: 'Error creating province' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updatedProvince = await prisma.province.update({
      where: { id },
      data: {
        provinceName: data.provinceName,
        provinceFCMToken: data.provinceFCMToken,
        hotlineNumber: data.hotlineNumber,
        pdrrmo: data.pdrrmo,
        provlogo: data.provlogo,
        userId: data.userId,
      },
      select: {
        id: true,
        provinceName: true,
        provinceFCMToken: true,
        hotlineNumber: true,
        pdrrmo: true,
        provlogo: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });
    return NextResponse.json(updatedProvince);
  } catch (error) {
    console.error('Error updating province:', error);
    return NextResponse.json({ error: 'Error updating province' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const result = await prisma.province.delete({
      where: { id },
    });
    if (!result) {
      return NextResponse.json({ error: 'Province not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Province deleted successfully' });
  } catch (error) {
    console.error('Error deleting province:', error);
    return NextResponse.json({ error: 'Error deleting province' }, { status: 500 });
  }
}