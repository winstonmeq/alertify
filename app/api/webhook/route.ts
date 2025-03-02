import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust the import path according to your structure

const VERIFY_TOKEN = "mySecretVerifyToken123";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    return new NextResponse(challenge ?? "", { status: 200 });
  } else {
    return new NextResponse("Verification failed", { status: 403 });
  }
}

interface WebhookEvent {
  sender: { id: string };
  message?: { text: string };
}

interface WebhookEntry {
  messaging: WebhookEvent[];
}

interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: WebhookBody = await req.json();
    // console.log("Received webhook event:", body);

    if (body.object === "page") {
      for (const entry of body.entry) {
        const webhookEvent = entry.messaging[0];
        const messageText = webhookEvent.message?.text;
        const senderId = webhookEvent.sender.id;

        if (messageText && senderId) {
          // Save to database
          await prisma.messenger.create({
            data: {
              emergency_m: messageText,
              name_m: senderId,
              lat_m:"",
              long_m:"",
              purok_m:"",
              barangay_m:"",
              position_m:"",
              mobile_m:""
            },
          });

          console.log("this is Message from user:", messageText);

          console.log("Sender PSID:", senderId);
        }
      }
    }

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("ERROR_PROCESSING", { status: 500 });
  }
}