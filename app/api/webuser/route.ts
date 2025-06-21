import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
import { PrismaClient } from "@prisma/client";

// import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();


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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received login request:', body); // For debugging

    // Validate request body
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.webuser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        wname: true,
        password: true,
        municipality: true,
        province: true,
      }
    });


    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   return NextResponse.json({ error: 'bcrypt Invalid credentials' }, { status: 401 });
    // }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, wname: user.wname
        
         },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

   const response =  NextResponse.json(
      { 
        data: {
        token, user: { id: user.id, email: user.email, 
        wname: user.wname, munId:user.municipality.id, provId: user.province.id,
       lat:user.municipality.lat, long:user.municipality.long, zoom:user.municipality.zoom
      }


        }
      
      
      }
     
    );

    return addCorsHeaders(response);



  } catch (error) {
    console.error('Error in POST /api/webuser:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}