import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt"; // ✅ Import bcrypt

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
    const { mobile, newPassword } = requestBody;

    if (!mobile || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the user by mobile number
    const user = await prisma.mobuser.findFirst({
      where: { mobile },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Hash the new password before updating
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.mobuser.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    if (!updatedUser) {
      return NextResponse.json({ message: "Failed to reset password" }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during password reset:", error);
    return NextResponse.json({ message: "Failed to reset password" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
