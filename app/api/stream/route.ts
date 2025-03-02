import { NextResponse } from "next/server";
import { MongoClient, ChangeStreamDocument } from "mongodb";

export async function GET() {
  try {
    // Directly connect using MongoDB since Prisma does NOT support change streams
    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();

    const db = client.db();
    const messenger_watch = db.collection("messenger"); // Ensure this matches your Prisma model

    const changeStream = messenger_watch.watch();

    const stream = new ReadableStream({
      start(controller) {
        changeStream.on("change", (change: ChangeStreamDocument<any>) => {
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
