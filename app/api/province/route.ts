import { PrismaClient } from "@prisma/client";
import { NextResponse} from "next/server";

const prisma = new PrismaClient();


export async function GET() {


  try {
    const province_data = await prisma.province.findMany({
     
      orderBy: {
        createdAt: "desc",
      },
    });


    const response = NextResponse.json({province_data,  });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error("Error fetching emergency data:", error);
    return NextResponse.error();
  }
}
