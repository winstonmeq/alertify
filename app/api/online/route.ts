import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getLocationData, PlacesResponse } from '../places/utils';

const prisma = new PrismaClient();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

interface Emergency {
  id?: string;
  emergency: string;
  lat: string;
  long: string;
  barangay: string;
  munName: string;
  name: string;
  mobile: string;
  verified: string;
  mobUserId: string;
  munId: string;
  provId: string;
  photoURL: string;
  createdAt?: Date;
}

//Initialize Firebase Admin (uncomment if needed)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}


//code optimize to handle large number of tokens
async function sendFcmNotification(data: Emergency, tokens: string[]) {

  const { emergency, name } = data;
  if (tokens.length === 0) return [];
  try {
    const response = await admin.messaging().sendEachForMulticast({
      notification: {
        title: 'Emergency Reported!',
        body: `${name} reported a ${emergency} incident!`,
      },
     android: {
        notification: {
          sound: 'alarm', // Custom sound for Android
          channelId: 'emergency_channel', // Match the channel ID in Flutter app
        },
      },
      data: {
        title: 'Emergency Reported!',
        body: `${name} reported a ${emergency} incident!`,
      },
      tokens,
    });
    return response.responses.map((res, i) => ({
      token: tokens[i],
      status: res.success ? 'success' : 'failed',
      error: res.error?.message,
    }));
  } catch (error) {
    console.error('Failed to send FCM notifications:', error);
    return tokens.map((token) => ({
      token,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }));
  }

}




// Main POST handler for emergency reports
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token !== VERIFY_TOKEN) {
    return new NextResponse('Verification failed', { status: 403 });
  }

  try {
    const requestBody = await request.json();
    const { emergency, lat, mobUserId, long, barangay, munName, name, mobile, verified, munId, provId, photoURL } = requestBody;

    if (!emergency || !lat || !long || !barangay || !name || !mobile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    //get location data from external service it is assumed that getLocationData is defined in places/utils.ts
    let externalData: PlacesResponse;
    try {
      externalData = await getLocationData(lat, long);
    } catch (error) {
      console.error('Location validation failed:', error);
      return NextResponse.json({ error: 'Failed to validate coordinates' }, { status: 400 });
    }


    //filter and format location data
    const filtered = externalData.current?.filter((item) => item.polType !== 'mun') || [];
    const locationIncident = filtered.length > 0 ? filtered.map((item) => item.name).join(', ') : 'Unknown Location';
    const filtered200 = externalData.nearby200?.filter((item) => item.polType === 'lot' || item.polType === 'bldg') || [];
    const nearby200 = filtered200.length > 0 ? filtered200.map((item) => item.name).join(', ') : 'none';

    // Save to database
    const savedData = await prisma.emergency.create({
      data: {
        mobUserId,
        emergency,
        lat,
        long,
        barangay: locationIncident,
        nearby200,
        munName,
        name,
        mobile,
        munId,
        provId,
        status: "true",
        verified: verified,
        photoURL,
      },
    });





    // Retrieve FCM tokens
    const getToken = await prisma.fcmweb.findMany({
      where: { munId},
      select: { fcmToken: true },
    });

  
    // If no tokens found, log and return early
    if (getToken.length === 0) {
      console.warn('No FCM tokens found for munId:', munId);
      return NextResponse.json({ message: 'Emergency data saved, no notifications sent' }, { status: 201 });
    }



    //bago nga config para mag handle large number of tokens
    // Send FCM notifications using multicast
    const tokens = getToken.filter((t) => t.fcmToken).map((t) => t.fcmToken);
    if (tokens.length > 0 && verified === true) {
      const chunkSize = 500; // Firebase multicast limit
      const tokenChunks = [];
      for (let i = 0; i < tokens.length; i += chunkSize) {
        tokenChunks.push(tokens.slice(i, i + chunkSize));
      }

      // Send notifications in chunks
      const notificationPromises = tokenChunks.map((chunk) => sendFcmNotification(savedData, chunk));
      const notificationResults = await Promise.all(notificationPromises);
      const flattenedResults = notificationResults.flat();

      const failedCount = flattenedResults.filter((r) => r.status === 'failed').length;
      if (failedCount > 0) {
        console.warn(`${failedCount} FCM notifications failed for munId: ${munId}`);
      }
    }

    return NextResponse.json({ message: 'Emergency data saved successfully' }, { status: 201 });


  } catch (error) {

    console.error('Error during processing:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    
  }
}

// Clean up Prisma on server shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
});