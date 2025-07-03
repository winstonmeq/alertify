import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  return addCorsHeaders(response);
}



export async function POST(request: NextRequest) {
  try {
   
    const { fcmToken, webUserId, munId } = await request.json();
    
    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

 
    // Upsert device to avoid duplicate tokens
    const device = await prisma.fcmweb.upsert({
      where: { fcmToken },
      update: {webUserId, munId, updatedAt: new Date() },
      create: {
        webUserId,
        fcmToken,
        munId,        
      },
    });

    return addCorsHeaders(NextResponse.json({ message: 'FCM token saved', device }, { status: 200 }));

  } catch (error) {

    console.error('Error saving FCM token:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  }
}