
import { PrismaClient } from '@prisma/client';
import { NextResponse, NextRequest } from 'next/server';

const prisma = new PrismaClient();

const VERIFY_TOKEN = "mySecretAlertifyToken2025"; // Define your verify token here


export async function POST(request: Request) {

    const { searchParams } = new URL(request.url);

  try {

    const token = searchParams.get("token");


      if (token === VERIFY_TOKEN) {
        

    // Parse the JSON body from the request
    const requestBody = await request.json();

    // Extract fields from the JSON body
    const { emergency, lat, long, purok, barangay, name, mobile, position } = requestBody;

    console.log(requestBody);

  // Validate required fields
  if (!emergency || !lat || !long || !purok || !barangay || !name || !position || !mobile) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Save data to the database using Prisma
  await prisma.emergency.create({
    data: {
      emergency,
      lat,
      long,
      purok,
      barangay,
      name,
      mobile,
      position,
    },
  });

  return NextResponse.json({ message: 'Emergency data saved successfully' }, { status: 201 });




        
      } else {
        return new NextResponse("Verification failed", { status: 403 });
      }



  


  } catch (error) {
    console.error('Error during saving data:', error);
    return NextResponse.json({ message: 'Failed to save data' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const emergency_data = await prisma.emergency.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalRecords = await prisma.emergency.count();

    const response = NextResponse.json({ emergency_data, totalRecords });

    // Add CORS headers
    // response.headers.set('Access-Control-Allow-Origin', '*');
    // response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error("Error fetching emergency data:", error);
    return NextResponse.error();
  }
}