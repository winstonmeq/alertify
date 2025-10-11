import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

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
    const { firstname, lastname, drrcode, barangay, mobile, password, munId, provId } =
      requestBody;

    // 1️⃣ Check if code exists and is unclaimed
    const existingCode = await prisma.drrCode.findFirst({
      where: { drrcode, provId, munId },
    });

    if (!existingCode) {
      return NextResponse.json({ error: "DRR Code not found" }, { status: 404 });
    }

    if (existingCode.mobUserId) {
      return NextResponse.json({ error: "DRR Code already claimed" }, { status: 400 });
    }

    if (!firstname || !lastname || !barangay || !password || !munId || !provId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2️⃣ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Create the mobile user
    const savedData = await prisma.mobuser.create({
      data: {
        firstname,
        lastname,
        barangay,
        mobile,
        password: hashedPassword,
        munId,
        provId,
      },
    });

    // 4️⃣ Update DRR code with the new mobUserId
    await prisma.drrCode.update({
      where: { drrcode },
      data: {
        mobUserId: savedData.id, // ✅ link the created user
        codeStatus: true,
        selfie: "",
      },
    });

    return NextResponse.json(
      { message: "Mobile user saved successfully", mobUserId: savedData.id },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error during saving data:", error);
    return NextResponse.json({ message: "Failed to save data" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
