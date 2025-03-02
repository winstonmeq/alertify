import { NextResponse } from "next/server";
import { MongoClient, ChangeStreamDocument } from "mongodb";

// Define an interface for your message document structure
interface MessageDocument {
  _id: string;
  content: string;
  // Add other fields that exist in your messenger collection
  createdAt?: Date;
  updatedAt?: Date;
  // [key: string]: any; // If there are additional dynamic fields
}

export async function GET() {
  try {
    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();

    const db = client.db();
    const messenger_watch = db.collection("messenger");

    // Specify the type in ChangeStreamDocument
    const changeStream = messenger_watch.watch();

    const stream = new ReadableStream({
      start(controller) {
        changeStream.on("change", (change: ChangeStreamDocument<MessageDocument>) => {
          if ("fullDocument" in change && change.fullDocument) {
            controller.enqueue(`data: ${JSON.stringify(change.fullDocument)}\n\n`);
          }
        });

        changeStream.on("error", (error) => {
          console.error("Change Stream Error:", error);
          controller.close();
        });
      },
      cancel() {
        changeStream.close();
        client.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
    
  } catch (error) {
    console.error("Error in /api/stream:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}