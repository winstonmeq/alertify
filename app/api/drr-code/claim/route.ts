import { PrismaClient} from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();


export async function PUT(req: NextRequest) {
  try {
    const { drrcode, mobUserId } = await req.json();

    // Validate input
    if (!drrcode || !mobUserId) {
      return NextResponse.json({ error: 'DRR Code and Mobile User ID are required' }, { status: 400 });
    }
  

    // Check if code exists and is unclaimed
    const existingCode = await prisma.drrCode.findUnique({
      where: { drrcode },
    });
    if (!existingCode) {
      return NextResponse.json({ error: 'DRR Code not found' }, { status: 404 });
    }
    if (existingCode.mobUserId) {
      return NextResponse.json({ error: 'DRR Code already claimed' }, { status: 400 });
    }

    const updatedCode = await prisma.drrCode.update({
      where: { drrcode },
      data: {
        mobUserId,
        codeStatus: true,
      },
     
    });

    return NextResponse.json(updatedCode);
  } catch (error) {
    console.error('Error claiming code:', error);
    return NextResponse.json({ error: 'Error claiming code' }, { status: 500 });
  }
}