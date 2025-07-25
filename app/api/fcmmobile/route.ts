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
   
    const { fcmToken, mobUserId, munId, provId } = await request.json();
    
   if (!fcmToken || !mobUserId || !munId || !provId) {
  return NextResponse.json({ error: 'All fields (fcmToken, mobUserId, munId, provId) are required' }, { status: 400 });
}

// Deactivate old tokens for the same mobUserId
    await prisma.fcmmobile.updateMany({
      where: { mobUserId, fcmToken: { not: fcmToken } },
      data: { isActive: false },
    });

    // Upsert new token
    const fcmDataMobile = await prisma.fcmmobile.upsert({
      where: { fcmToken },
      update: { mobUserId, munId, provId, isActive: true, updatedAt: new Date() },
      create: { mobUserId, fcmToken, munId, provId, isActive: true },
    });
 
   
    
    console.log('FCM Mobile token saved:', fcmDataMobile);


    // return NextResponse.json({ message: 'FCM Mobile token saved', fcmDataMobile }, { status: 200 });


    return addCorsHeaders(NextResponse.json({ message: 'FCM token saved', fcmDataMobile }, { status: 200 }));

  } catch (error) {

    console.error('Error saving FCM token:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  }
}