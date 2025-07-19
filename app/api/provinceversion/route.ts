import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'version.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(content);

    return NextResponse.json(json);
  } catch (error) {
    console.error('Failed to read version file:', error);
    return new NextResponse('Version file not found', { status: 404 });
  }
}