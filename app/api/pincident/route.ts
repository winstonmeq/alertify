import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const provId = searchParams.get("provId");
  const munId = searchParams.get("munId");
    const psId = searchParams.get("psId");

  if (!provId || !munId ) {
    return NextResponse.json({ error: "Missing provId or munId" }, { status: 400 });
  }

  try {
    const incidents = await prisma.privateReport.findMany({
      where: {
        provId: String(provId),
        munId: String(munId),
        psId: String(psId),
      },
      select: {
        id: true,
        prIncident: true,
        prdrrphone: true,
        notifyId: true,
        provId: true,
        munId: true,
      },
    });

    if (!incidents) {
      return NextResponse.json({ message: "No type of incidents created" }, { status: 404 });
    }

    return NextResponse.json(incidents);


  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Error fetching reports" }, { status: 500 });
  }
}
