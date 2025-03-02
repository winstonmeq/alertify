import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET() {
  try {
    // Directly connect using MongoDB since Prisma does NOT support change streams
    const client = new MongoClient(process.env.DATABASE_URL!);

    await client.connect();

    const db = client.db();

    const emergency_data = db.collection("emergency"); // Ensure this matches your Prisma model

    const changeStream = emergency_data.watch();

    const stream = new ReadableStream({
      start(controller) {
      
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
