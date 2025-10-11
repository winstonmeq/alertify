
import { PrismaClient} from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();


export async function GET(request: NextRequest) {

    const { searchParams } = request.nextUrl;
  const provId = searchParams.get("provId");
  const munId = searchParams.get("munId");

  if (!provId || !munId) {
    return NextResponse.json({ error: "Missing provId or munId" }, { status: 400 });
  }

  try {
    const store = await prisma.privateStore.findMany({
      where: {
        provId: String(provId),
      },
      select: {
        id: true,
        privateName: true,
        privateDes: true,
        privatePhone: true,
        pimageurl: true,
        provId: true,
        munId: true,
      },
    });
    return NextResponse.json(store);
  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json({ error: 'Error fetching codes' }, { status: 500 });
  }
}

