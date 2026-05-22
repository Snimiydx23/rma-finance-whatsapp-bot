import { NextRequest, NextResponse } from 'next/server';

// POST /api/google-sync - Trigger Google Sheets sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Use VERCEL_URL or NEXT_PUBLIC_APP_URL for production, fallback to localhost for dev
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const syncResponse = await fetch(`${baseUrl}/api/data-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheets: body.sheets || ['raw_data', 'raw_data2', 'new_dash'],
      }),
    });

    const result = await syncResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error triggering Google Sheets sync:', error);
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    );
  }
}

// GET /api/google-sync - Get sync history
export async function GET() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/data-import`);
    const logs = await response.json();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json([]);
  }
}
