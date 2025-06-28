import { PrismaClient} from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();


export async function GET() {
  try {
    const codes = await prisma.drrCode.findMany({
      include: {
        mobuser: {
          select: { id: true, firstname: true },
        },
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drrcode, selfie, mobUserId, provId, munId } = body;

    // Validate input
    if (!drrcode || !provId || !munId) {
      return NextResponse.json({ error: 'DRR Code, Selfie, Province, and Municipality are required' }, { status: 400 });
    }
   

    const newCode = await prisma.drrCode.create({
      data: {
        drrcode,
        selfie,
        codeStatus: false,
        mobUserId,
        provId,
        munId,
      },
      include: {
        province: {
          select: { id: true, provinceName: true },
        },
        municipality: {
          select: { id: true, municipalityName: true },
        },
      },
    });
    return NextResponse.json(newCode);
  } catch (error) {
    console.error('Error creating code:', error);
    return NextResponse.json({ error: 'Error creating code' }, { status: 500 });
  }
}