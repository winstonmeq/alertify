// import { PrismaClient } from "@prisma/client";
// import { NextResponse, NextRequest } from "next/server";
// import admin from "firebase-admin";
// import { z } from "zod";

// const prisma = new PrismaClient();
// const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mySecretAlertifyToken2025";

// const EmergencySchema = z.object({ ... }); // As defined above

// async function sendFcmNotification(data: Emergency) {
//   const { position, emergency, barangay, provId } = data;
//   const tokens = await prisma.userToken.findMany({
//     where: { provId },
//     select: { token: true },
//   });

//   if (!tokens.length) return;

//   const message = {
//     notification: {
//       title: "Incident Report!",
//       body: `${position} reported a ${emergency} emergency in ${barangay}.`,
//     },
//     tokens: tokens.map((t) => t.token),
//   };

//   try {
//     const response = await admin.messaging().sendEachForMulticast(message);
//     if (response.failureCount > 0) {
//       // Handle failed tokens
//     }
//     console.log(`Sent to ${response.successCount} users`);
//   } catch (error) {
//     console.error("FCM error:", error);
//   }
// }

// export async function POST(request: Request) {
//   const token = new URL(request.url).searchParams.get("token");
//   if (token !== VERIFY_TOKEN) {
//     return new NextResponse("Verification failed", { status: 403 });
//   }

//   const requestBody = await request.json();
//   const parsed = EmergencySchema.safeParse(requestBody);
//   if (!parsed.success) {
//     return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
//   }

//   const data = parsed.data;
//   const savedData = await prisma.postnotify.create({ data: { ...data, verified: true } });
//   sendFcmNotification(savedData).catch(console.error);
//   return NextResponse.json({ message: "Postnotify data saved" }, { status: 201 });
// }

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
//   const limit = Math.min(100, parseInt(searchParams.get("limit") || "30", 10));
//   const skip = (page - 1) * limit;
//   const provId = searchParams.get("provId") || undefined;

//   const emergency_data = await prisma.postnotify.findMany({
//     where: { provId },
//     skip,
//     take: limit,
//     orderBy: { createdAt: "desc" },
//   });

//   const totalRecords = await prisma.postnotify.count({ where: { provId } });
//   return NextResponse.json({ emergency_data, totalRecords });
// }