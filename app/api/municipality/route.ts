import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse} from "next/server";

const prisma = new PrismaClient();



export async function GET(req: NextRequest) {

  try {
  
    const { searchParams } = new URL(req.url);
    const provId = searchParams.get('provId');

    if (provId) {
      const municipality = await prisma.municipality.findMany({
        where: { provId, mdrrmo: 'LGU' },
        select: {
          id: true,
          municipalityName: true,
          municipalityFCMToken: true,
          hotlineNumber: true,
          lat: true,
          long: true,
          zoom: true,
          mdrrmo: true,
          barangays: true,
          munlogo: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          provId: true,
        },
      });
      if (!municipality) {
        return NextResponse.json({ error: 'Municipality not found' }, { status: 404 });
      }
      return NextResponse.json(municipality);
    }

    // const municipalities = await prisma.municipality.findMany({
    //   select: {
    //     id: true,
    //     municipalityName: true,
    //     municipalityFCMToken: true,
    //     hotlineNumber: true,
    //     lat: true,
    //     long: true,
    //     zoom: true,
    //     mdrrmo: true,
    //     barangays: true,
    //     munlogo: true,
    //     createdAt: true,
    //     updatedAt: true,
    //     userId: true,
    //     provId: true,
    //   },
    // });
    return NextResponse.json(['No provId provided'], { status: 400 });
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    return NextResponse.json({ error: 'Error fetching municipalities' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newMunicipality = await prisma.municipality.create({
      data: {
        municipalityName: body.municipalityName,
        municipalityFCMToken: body.municipalityFCMToken,
        hotlineNumber: body.hotlineNumber,
        lat: body.lat,
        long: body.long,
        zoom: body.zoom,
        mdrrmo: body.mdrrmo,
        barangays: body.barangays,
        munlogo: body.munlogo,
        userId: body.userId,
        provId: body.provId,
      },
      select: {
        id: true,
        municipalityName: true,
        municipalityFCMToken: true,
        hotlineNumber: true,
        lat: true,
        long: true,
        zoom: true,
        mdrrmo: true,
        barangays: true,
        munlogo: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        provId: true,
      },
    });
    return NextResponse.json(newMunicipality, { status: 201 });
  } catch (error) {
    console.error('Error creating municipality:', error);
    return NextResponse.json({ error: 'Error creating municipality' }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updatedMunicipality = await prisma.municipality.update({
      where: { id },
      data: {
        municipalityName: data.municipalityName,
        municipalityFCMToken: data.municipalityFCMToken,
        hotlineNumber: data.hotlineNumber,
        lat: data.lat,
        long: data.long,
        zoom: data.zoom,
        mdrrmo: data.mdrrmo,
        barangays: data.barangays,
        munlogo: data.munlogo,
        userId: data.userId,
        provId: data.provId,
      },
      select: {
        id: true,
        municipalityName: true,
        municipalityFCMToken: true,
        hotlineNumber: true,
        lat: true,
        long: true,
        zoom: true,
        mdrrmo: true,
        barangays: true,
        munlogo: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        provId: true,
      },
    });
    return NextResponse.json(updatedMunicipality);
  } catch (error) {
    console.error('Error updating municipality:', error);
    return NextResponse.json({ error: 'Error updating municipality' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const result = await prisma.municipality.delete({
      where: { id },
    });
    if (!result) {
      return NextResponse.json({ error: 'Municipality not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Municipality deleted successfully' });
  } catch (error) {
    console.error('Error deleting municipality:', error);
    return NextResponse.json({ error: 'Error deleting municipality' }, { status: 500 });
  }
}