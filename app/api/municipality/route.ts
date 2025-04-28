

import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse} from "next/server";

const prisma = new PrismaClient();


export async function GET(request: NextRequest) {

    const { searchParams } = new URL(request.url);




  try {

    const provId = searchParams.get("provId") || undefined; 


    const municipality_data = await prisma.municipality.findMany({
        where: {
            provId: provId,
        },
     
      orderBy: {
        createdAt: "desc",
      },
    });


    const response = NextResponse.json({municipality_data,  });

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
