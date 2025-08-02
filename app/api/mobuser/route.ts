import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt"; // ✅ import bcrypt

const prisma = new PrismaClient();
const VERIFY_TOKEN = "mySecretAlertifyToken2025";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== VERIFY_TOKEN) {
    return new NextResponse("Verification failed", { status: 403 });
  }

  try {
    const requestBody = await request.json();
    const { firstname, lastname, barangay, mobile, password, munId, provId } =
      requestBody;

    if (!firstname || !lastname || !barangay || !password || !munId || !provId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

    const savedData = await prisma.mobuser.create({
      data: {
        firstname,
        lastname,
        barangay,
        mobile,
        password: hashedPassword, // ✅ store hashed password
        munId,
        provId,
      },
    });

    if (savedData === null) {
      return NextResponse.json({ message: "Failed to save data" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "mobile user saved successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during saving data:", error);
    return NextResponse.json({ message: "Failed to save data" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
