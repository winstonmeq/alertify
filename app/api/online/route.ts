// app/api/online/route.ts
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
  mobUserId: string;
  munId: string;
  provId: string;
  photoURL: string;
  createdAt?: Date;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

async function sendFcmNotification(data: Emergency, fcmToken: string) {
  const { emergency, name } = data;
  try {
    await admin.messaging().send({
      notification: {
        title: 'Emergency Reported!',
        body: `${name} reported a ${emergency} incident!`,
      },
      token: fcmToken,
    });
    return true;
  } catch (error) {
    console.error('Failed to send FCM notification:', error);
    return error;
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (token !== VERIFY_TOKEN) {
    return new NextResponse('Verification failed', { status: 403 });
  }

  try {
    const requestBody = await request.json();

    console.log('Request body:', requestBody);

    const { emergency, lat, mobUserId, long, barangay, munName, name, mobile, munId, provId, photoURL } = requestBody;

    if (!emergency || !lat || !long || !barangay || !name || !mobile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get location data
    let externalData: PlacesResponse;
    try {
      externalData = await getLocationData(lat, long);
    } catch (error) {
      console.error('Location validation failed:', error);
      return NextResponse.json({ error: 'Failed to validate coordinates' }, { status: 400 });
    }

    // Process location data

    const filtered = externalData.current?.filter((item) => item.polType !== 'mun') || [];

    const locationIncident = filtered.length > 0 ? filtered.map((item) => item.name).join(', ') : 'Unknown Location';

    // const fcmTopic = filtered.length > 0 ? filtered.map((item) => item.name).join(', ') : 'default_topic';

    console.log('LocationIncident:', locationIncident);

    //process to get nearby200
    const filtered200 = externalData.nearby200?.filter((item) => item.polType === 'lot' || item.polType === 'bldg') || [];
    const nearby200 = filtered200.length > 0 ? filtered200.map((item) => item.name).join(', ') : 'none';


  // const getMunIdFunction = await prisma.municipality.findMany({
  //   where: {municipalityName: fcmTopic}
  // })


//  const getMunId = getMunIdFunction.length > 0 ? getMunIdFunction.map((item) => item.id).join(', ') : munId;

//  console.log("getMunId result",getMunId, fcmTopic)

    // Save to database
    const savedData = await prisma.emergency.create({
      data: {
        mobUserId,
        emergency,
        lat,
        long,
        barangay: locationIncident,
        nearby200: nearby200,
        munName,
        name,
        mobile,
        munId,
        provId,
        status: true,
        verified: false,
        photoURL,
      },
    });



    const getToken = await prisma.fcmweb.findMany({
    where: {munId: munId}
  })

  console.log('getToken result:', getToken);

    if (getToken.length === 0) {
      console.warn('No FCM tokens found for the specified munId:', munId);
      return NextResponse.json({ error: 'No FCM tokens found for the specified municipality' }, { status: 404 });
    }



    // Send FCM notifications for all tokens
const notificationResults = [];
for (const token of getToken) {
  if (token.fcmToken) {
    const result = await sendFcmNotification(savedData, token.fcmToken);
    if (result instanceof Error) {
      console.warn(`Notification failed for token ${token.fcmToken}:`, result);
      notificationResults.push({ token: token.fcmToken, status: 'failed', error: result.message });
    } else {
      console.log(`FCM notification sent successfully for token ${token.fcmToken}`);
      notificationResults.push({ token: token.fcmToken, status: 'success' });
    }
  } else {
    console.warn('Invalid or missing FCM token in record:', token);
    notificationResults.push({ token: 'unknown', status: 'failed', error: 'Missing FCM token' });
  }
}


    return NextResponse.json({ message: 'Emergency data saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error during saving data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

// Clean up Prisma on server shutdown
// process.on('SIGTERM', async () => {
//   await prisma.$disconnect();
// });