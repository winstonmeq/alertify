import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import admin from "firebase-admin";
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import asyncBatch from 'async-batch';

// Initialize Prisma and other configurations
const prisma = new PrismaClient();
const VERIFY_TOKEN = "mySecretAlertifyToken2025";

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

// Firebase initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE2_PROJECT_ID,
      privateKey: process.env.FIREBASE2_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE2_CLIENT_EMAIL,
    }),
  });
}

// Function to set CORS headers
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS request for preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCorsHeaders(response);
}

async function sendFcmNotification(name: string, emergency: string, fcmMobileToken: string): Promise<void> {
  try {
    // Validate FCM token format
    if (!fcmMobileToken || typeof fcmMobileToken !== 'string' || fcmMobileToken.length < 10) {
      throw new Error('Invalid FCM token');
    }

    const message = {
      notification: {
        title: "Incident Report!",
        body: `${name} reported a ${emergency} incident!`,
      },
      token: fcmMobileToken,
      data: {
        emergencyType: emergency,
        timestamp: new Date().toISOString(),
      },
    };

    await admin.messaging().send(message);
    console.log("FCM notification sent successfully to:", fcmMobileToken);
  } catch (error) {
    console.error("Failed to send FCM notification:", {
      token: fcmMobileToken,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function POST(request: Request) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    await rateLimiter.consume(clientIp);

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (token !== VERIFY_TOKEN) {
      const response = new NextResponse("Verification failed", { status: 403 });
      return setCorsHeaders(response);
    }

    const requestBody = await request.json();
    const { emergency, lat, long, barangay, munName, name, verified, mobile, photoURL, situation, webUserId, munId, provId } = requestBody;

    // Validate required fields
    if (!emergency || !lat || !long || !barangay || !name || !mobile || !provId) {
      const response = NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      return setCorsHeaders(response);
    }

    // Save data to database
    const savedData = await prisma.postnotify.create({
      data: { 
        emergency, 
        lat, 
        long, 
        barangay, 
        munName, 
        name, 
        mobile, 
        verified, 
        photoURL, 
        situation, 
        munId, 
        provId, 
        webUserId 
      },
    });

    // Fetch active FCM tokens
    const fcmTokens = await prisma.fcmmobile.findMany({
      where: { 
        provId: provId, 
        isActive: true 
      },
      select: { 
        fcmToken: true,
        id: true // Include ID for tracking
      },
    });

    if (fcmTokens.length === 0) {
      console.warn('No active FCM tokens found for provId:', provId);
      const response = NextResponse.json({ 
        message: "Data saved but no FCM tokens found",
        data: savedData 
      }, { status: 201 });
      return setCorsHeaders(response);
    }

    // Batch send notifications with enhanced error handling
    const notificationResults = await asyncBatch(
      fcmTokens.filter(token => token.fcmToken),
      async (token) => {
        try {
          await sendFcmNotification(name, emergency, token.fcmToken);
          return { tokenId: token.id, status: 'success' };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Check for specific FCM errors that indicate invalid tokens
          if (errorMessage.includes('registration-token-not-registered') || 
              errorMessage.includes('invalid-argument')) {
            // Mark token as inactive in database
            await prisma.fcmmobile.update({
              where: { id: token.id },
              data: { isActive: false }
            });
          }
          return { tokenId: token.id, status: 'failed', error: errorMessage };
        }
      },
      10 // Process 10 notifications concurrently
    );

    // Log notification results
    const failedNotifications = notificationResults.filter(result => result.status === 'failed');
    if (failedNotifications.length > 0) {
      console.warn('Some notifications failed:', {
        failedCount: failedNotifications.length,
        details: failedNotifications
      });
    }

    const response = NextResponse.json({ 
      message: "Postnotify data saved successfully",
      data: savedData,
      notificationStats: {
        totalSent: notificationResults.length,
        successful: notificationResults.filter(r => r.status === 'success').length,
        failed: failedNotifications.length
      }
    }, { status: 201 });
    return setCorsHeaders(response);

  } catch (error) {
    console.error("Error processing request:", {
      error: error instanceof Error ? error.message : String(error),
      clientIp
    });

    if (error instanceof RateLimiterRes) {
      const response = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      return setCorsHeaders(response);
    }

    const response = NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    return setCorsHeaders(response);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 30);
  const limit = 30;
  const skip = (page - 1) * limit;
  const munId = searchParams.get("munId") || undefined;
  const provId = searchParams.get("provId") || undefined;

  try {
    const emergency_data = await prisma.postnotify.findMany({
      where: {
        ...(provId && { provId }),
        ...(munId && { munId }),
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalRecords = await prisma.postnotify.count({
      where: {
        ...(provId && { provId }),
        ...(munId && { munId }),
      }
    });

    const response = NextResponse.json({ emergency_data, totalRecords });
    return setCorsHeaders(response);
  } catch (error) {
    console.error("Error fetching emergency data:", error);
    const response = NextResponse.json({ error: "Error fetching emergency data" }, { status: 500 });
    return setCorsHeaders(response);
  }
}