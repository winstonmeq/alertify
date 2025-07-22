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
    
    if (!fcmToken || !munId || !provId) {
      return NextResponse.json({ error: 'fcmToken, munId, and provId are required' }, { status: 400 });
    }


      // Run DB validations in parallel
    const [province, municipality] = await Promise.all([
      prisma.province.findUnique({ where: { id: provId } }),
      prisma.municipality.findUnique({ where: { id: munId } }),
    ]);

    if (!province) {
      return addCorsHeaders(NextResponse.json({ error: 'Invalid provId' }, { status: 400 }));
    }

    if (!municipality) {
      return addCorsHeaders(NextResponse.json({ error: 'Invalid munId' }, { status: 400 }));
    }


 
    // Upsert device to avoid duplicate tokens
    const fcmSubscribe = await prisma.fcmmobile.create({     
      data: {
        mobUserId,
        fcmToken,
        munId, 
        provId       
      },
    });
    
    console.log('FCM Subscribe Mobile token saved:', fcmSubscribe);


    // return NextResponse.json({ message: 'FCM Mobile token saved', fcmDataMobile }, { status: 200 });


    return addCorsHeaders(NextResponse.json({ message: 'FCM Subscribe token saved', fcmSubscribe }, { status: 200 }));

  } catch (error) {

    console.error('Error saving FCM token:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  }
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mobUserId = searchParams.get('mobUserId');

    if (!mobUserId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'mobUserId is required' }, { status: 400 })
      );
    }

    // Get all provinces user has subscribed to
    const subscriptions = await prisma.fcmmobile.findMany({
      where: { mobUserId },
      select: { provId: true },
      distinct: ['provId'], // avoid duplicates
    });

    const provIds = subscriptions.map((sub) => sub.provId);

    return addCorsHeaders(
      NextResponse.json({ mobUserId, provIds }, { status: 200 })
    );
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mobUserId = searchParams.get('mobUserId');
    const provId = searchParams.get('provId');

    if (!mobUserId || !provId) {
      return addCorsHeaders(
        NextResponse.json({ error: 'mobUserId and provId are required' }, { status: 400 })
      );
    }

    const deleted = await prisma.fcmmobile.deleteMany({
      where: {
        mobUserId,
        provId,
      },
    });

    return addCorsHeaders(
      NextResponse.json({
        message: `Unsubscribed from provId: ${provId}`,
        deletedCount: deleted.count,
      }, { status: 200 })
    );
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}
