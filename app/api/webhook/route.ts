import { NextResponse } from "next/server";

const VERIFY_TOKEN = "mySecretVerifyToken123"; // Define your verify token here

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
  const body: WebhookBody = await req.json();
  console.log("Received webhook event:", body);

  if (body.object === "page") {
    body.entry.forEach((entry) => {
      const webhookEvent = entry.messaging[0];
      console.log("Message from user:", webhookEvent.message?.text);
      console.log("Sender PSID:", webhookEvent.sender.id);
    });
  }

  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
