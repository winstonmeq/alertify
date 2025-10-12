import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Define your verify token here

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const token = searchParams.get("token");

    if (token === VERIFY_TOKEN) {
      // Parse the JSON body from the request
      const requestBody = await request.json();

      // Extract fields from the JSON body
      const {
        mobUserId,
        emergency,
        lat,
        long,
        barangay,
        munName,
        name,
        mobile,
        munId,
        provId,
        photoURL,
      } = requestBody;

      console.log(requestBody);

      // Validate required fields
      if (
        !emergency ||
        !lat ||
        !long ||
        !barangay ||
        !name ||
        !mobile ||
        !munId ||
        !provId
      ) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      // Save data to the database using Prisma
      await prisma.emergency.create({
        data: {
          mobUserId,
          emergency,
          lat,
          long,
          barangay,
          munName,
          name,
          mobile,
          munId,
          provId,
          photoURL: photoURL || "",
          status: true,
          verified: false,
        },
      });

      return NextResponse.json(
        { message: "Emergency data saved successfully" },
        { status: 201 }
      );
    } else {
      return new NextResponse("Verification failed", { status: 403 });
    }
  } catch (error) {
    console.error("Error during saving data:", error);
    return NextResponse.json(
      { message: "Failed to save data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10); // Correct radix to 10
  const limit = 30;
  const skip = (page - 1) * limit;
  const munId = searchParams.get("munId") || undefined;
  const provId = searchParams.get("provId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    // Build where clause with proper type
    const whereClause: Prisma.EmergencyWhereInput = {
      ...(provId && { provId }),
      ...(munId && { munId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      ...(startDate &&
        !endDate && {
          createdAt: {
            gte: new Date(startDate),
          },
        }),
      ...(!startDate &&
        endDate && {
          createdAt: {
            lte: new Date(endDate),
          },
        }),
    };

    // Fetch emergency data
    const [emergency_data, totalRecords] = await Promise.all([
      prisma.emergency.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.emergency.count({ where: whereClause }),
    ]);

    const response = NextResponse.json({
      emergency_data,
      totalRecords,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
    });

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    return response;
  } catch (error) {
    console.error("Error fetching emergency data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
