import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
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

    const stream = new ReadableStream({
      start(controller) {
        const keepAliveInterval = setInterval(() => {
          controller.enqueue(': keep-alive\n\n');
        }, 30000); // Send keep-alive message every 30 seconds

        changeStream.on('change', (change) => {
          controller.enqueue(`data: ${JSON.stringify(change)}\n\n`);
        });

        changeStream.on('error', (error) => {
          clearInterval(keepAliveInterval);
          controller.error(error);
        });

        changeStream.on('end', () => {
          clearInterval(keepAliveInterval);
          controller.close();
        });
      },
      cancel() {
        changeStream.close();
      }
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