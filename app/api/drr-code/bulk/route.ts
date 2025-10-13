import { PrismaClient} from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

interface DrrCode {
  drrcode: string;
    mobUserId?: string;
  provId: string;   
    munId: string;

}

export async function POST(req: NextRequest) {
  try {
    const { codes } = await req.json();
    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty codes array' }, { status: 400 });
    }

    // Validate each code
    for (const code of codes) {
      if (!code.drrcode || !code.provId || !code.munId) {
        return NextResponse.json({ error: 'DRR Code, Selfie, Province, and Municipality are required for each code' }, { status: 400 });
      }
      
    }

    const createdCodes = await prisma.drrCode.createMany({
      data: codes.map((code: DrrCode) => ({
        drrcode: code.drrcode,
        codeStatus: false,
        mobUserId: code.mobUserId,
        provId: code.provId,
        munId: code.munId,
      }))
    });

    return NextResponse.json({ count: createdCodes.count }, { status: 201 });
  } catch (error) {
    console.error('Error creating bulk codes:', error);
    return NextResponse.json({ error: 'Error creating bulk codes' }, { status: 500 });
  }
}