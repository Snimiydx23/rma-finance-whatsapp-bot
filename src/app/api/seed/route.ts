import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/seed - Clear all data and re-sync from Google Sheets
export async function POST() {
  try {
    // Clear existing data in correct order (respecting foreign keys)
    await db.chatMessage.deleteMany();
    await db.projectStep.deleteMany();
    await db.projectBank.deleteMany();
    await db.project.deleteMany();
    await db.whatsAppUser.deleteMany();
    await db.maytapiConfig.deleteMany();
    await db.syncLog.deleteMany();
    await db.client.deleteMany();
    await db.teamLeader.deleteMany();

    // Create Maytapi config placeholder
    await db.maytapiConfig.create({
      data: {
        apiKey: 'demo-api-key-placeholder',
        productId: 'demo-product-id',
        phoneId: 'demo-phone-id',
        webhookUrl: '/api/webhook/maytapi',
        isActive: true,
        phoneNumber: '919000000000',
      },
    });

    // Trigger Google Sheets sync via internal API call
    // Use VERCEL_URL or NEXT_PUBLIC_APP_URL for production, fallback to localhost for dev
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const syncResponse = await fetch(`${baseUrl}/api/data-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheets: ['raw_data', 'raw_data2', 'new_dash'] }),
    });

    const syncResult = await syncResponse.json();

    // Get counts after sync
    const clientCount = await db.client.count();
    const projectCount = await db.project.count();
    const teamLeaderCount = await db.teamLeader.count();
    const bankCount = await db.projectBank.count();

    return NextResponse.json({
      message: 'Database reset and synced from Google Sheets',
      summary: {
        clients: clientCount,
        projects: projectCount,
        teamLeaders: teamLeaderCount,
        banks: bankCount,
        syncResult,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
