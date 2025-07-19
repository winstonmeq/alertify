import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const province = searchParams.get('province');

  if (!province) {
    return new NextResponse('Province name is required', { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', `${province}.json`);
    const fileContents = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContents);

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error(`Error reading JSON for ${province}:`, error);
    return new NextResponse('Province JSON not found', { status: 404 });
  }
}