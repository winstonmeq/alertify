import { NextResponse } from "next/server";
import { MongoClient, ChangeStreamDocument } from "mongodb";

export async function GET(): Promise<NextResponse> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not defined");
    }

    const client = new MongoClient(databaseUrl);
    await client.connect();

    const db = client.db();
    const emergencyData = db.collection("emergency");
    const changeStream = emergencyData.watch();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        changeStream.on("change", (change: ChangeStreamDocument) => {
          if ("fullDocument" in change && change.fullDocument) {
            const data = `data: ${JSON.stringify(change.fullDocument)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
        });

        changeStream.on("error", (error: Error) => {
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
