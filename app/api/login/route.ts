import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const VERIFY_TOKEN = "mySecretAlertifyToken2025";

// ✅ Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

// ✅ Handle OPTIONS preflight requests
export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  return addCorsHeaders(response);
}

// ✅ POST: Login endpoint
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== VERIFY_TOKEN) {
    const response = new NextResponse("Verification failed", { status: 403 });
    return addCorsHeaders(response);
  }

  try {
    const requestBody = await request.json();
    const { mobile, password } = requestBody;

    if (!mobile || !password) {
      const response = NextResponse.json({ error: "Mobile and password are required" }, { status: 400 });
      return addCorsHeaders(response);
    }

    const user = await prisma.mobuser.findUnique({
      where: { mobile },
      include: {
        municipality: true,
        drrcode: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ error: "User not found" }, { status: 404 });
      return addCorsHeaders(response);
    }

    // ✅ Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const response = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      return addCorsHeaders(response);
    }

    const response = NextResponse.json(
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
          munName: user.municipality.municipalityName,
          hotlineNumber: user.municipality.hotlineNumber,
          latOrig: user.municipality.lat,
          longOrig: user.municipality.long,
          drrcode: user.drrcode,
        },
      },
      { status: 200 }
    );

    return addCorsHeaders(response);
  } catch (error) {
    console.error("Login error:", error);
    const response = NextResponse.json({ message: "Internal server error" }, { status: 500 });
    return addCorsHeaders(response);
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ GET: Find mobile endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get("mobile");
  const token = searchParams.get("token");

  if (token !== VERIFY_TOKEN) {
    const response = new NextResponse("Verification failed", { status: 403 });
    return addCorsHeaders(response);
  }

  if (!mobile) {
    const response = NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    return addCorsHeaders(response);
  }

  try {
    const user = await prisma.mobuser.findUnique({
      where: { mobile },
      select: {
        id: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ message: "Mobile not found" }, { status: 404 });
      return addCorsHeaders(response);
    }

    const response = NextResponse.json({ user }, { status: 200 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error("Error fetching mobile:", error);
    const response = NextResponse.json({ message: "Internal server error" }, { status: 500 });
    return addCorsHeaders(response);
  } finally {
    await prisma.$disconnect();
  }
}
