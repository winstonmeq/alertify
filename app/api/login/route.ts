import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

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
    const { mobile, password } = requestBody;

    if (!mobile || !password) {
      return NextResponse.json({ error: "Mobile and password are required" }, { status: 400 });
    }

    const user = await prisma.mobuser.findUnique({
      where: { mobile }, 
      include: { 
        municipality: true, 
        drrcode: true 
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          barangay: user.barangay,
          mobile: user.mobile,
          munId: user.munId,
          provId: user.provId,
          hotlineNumber: user.municipality.hotlineNumber,
          munName: user.municipality.municipalityName,
          drrcode: user.drrcode,

        },
        
        
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
