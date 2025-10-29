import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt"; // ✅ Import bcrypt

const prisma = new PrismaClient();
const VERIFY_TOKEN = "mySecretAlertifyToken2025";



// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  return addCorsHeaders(response);
}



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
        drrcode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Compare the password with hashed version
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
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


// ✅ FIND MOBILE ENDPOINT
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get("mobile");
  const token = searchParams.get("token");

  if (token !== VERIFY_TOKEN) {
    return new NextResponse("Verification failed", { status: 403 });
  }

  if (!mobile) {
    return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
  }

  try {
    const user = await prisma.mobuser.findUnique({
      where: { mobile },
      select: {
        id: true,
       
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Mobile not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error("Error fetching mobile:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}