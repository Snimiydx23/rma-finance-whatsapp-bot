import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/maytapi-config - Get current config
export async function GET() {
  try {
    const configs = await db.maytapiConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Return the active config, or the most recent one
    const activeConfig = configs.find((c) => c.isActive) || configs[0] || null;

    return NextResponse.json(activeConfig);
  } catch (error) {
    console.error('Error fetching Maytapi config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Maytapi config' },
      { status: 500 }
    );
  }
}

// POST /api/maytapi-config - Create or update config (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.apiKey || !body.productId) {
      return NextResponse.json(
        { error: 'apiKey and productId are required' },
        { status: 400 }
      );
    }

    // Deactivate all existing configs if this one is active
    if (body.isActive !== false) {
      await db.maytapiConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // Check if config with same productId exists
    const existing = await db.maytapiConfig.findFirst({
      where: { productId: body.productId },
    });

    let config;

    if (existing) {
      // Update existing config
      config = await db.maytapiConfig.update({
        where: { id: existing.id },
        data: {
          apiKey: body.apiKey,
          phoneId: body.phoneId || existing.phoneId,
          webhookUrl: body.webhookUrl || existing.webhookUrl,
          isActive: body.isActive !== false,
          phoneNumber: body.phoneNumber || existing.phoneNumber,
        },
      });
    } else {
      // Create new config
      config = await db.maytapiConfig.create({
        data: {
          apiKey: body.apiKey,
          productId: body.productId,
          phoneId: body.phoneId || null,
          webhookUrl: body.webhookUrl || null,
          isActive: body.isActive !== false,
          phoneNumber: body.phoneNumber || null,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error creating/updating Maytapi config:', error);
    return NextResponse.json(
      { error: 'Failed to create/update Maytapi config' },
      { status: 500 }
    );
  }
}
