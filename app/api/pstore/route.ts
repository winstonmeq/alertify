
import { PrismaClient} from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();


export async function GET() {
  try {
    const codes = await prisma.privateStore.findMany({
      include: {
        province: {
          select: { id: true, provinceName: true },
        },
        municipality: {
          select: { id: true, municipalityName: true },
        },
      },
    });
    return NextResponse.json(codes);
  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json({ error: 'Error fetching codes' }, { status: 500 });
  }
}

