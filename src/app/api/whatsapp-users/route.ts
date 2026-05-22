import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/whatsapp-users - List all registered WhatsApp users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const registered = searchParams.get('registered');

    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role;
    }

    if (registered !== null && registered !== undefined) {
      where.isRegistered = registered === 'true';
    }

    const users = await db.whatsAppUser.findMany({
      where,
      include: {
        client: { select: { id: true, clientName: true, clientCode: true } },
        teamLeader: { select: { id: true, name: true } },
        _count: { select: { chatMessages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching WhatsApp users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp users' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp-users - Register a new WhatsApp user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.phone) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.whatsAppUser.findUnique({
      where: { phone: body.phone },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A WhatsApp user with this phone number already exists' },
        { status: 409 }
      );
    }

    // Validate clientId if provided
    if (body.clientId) {
      const client = await db.client.findUnique({
        where: { id: body.clientId },
      });
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // Validate teamLeaderId if provided
    if (body.teamLeaderId) {
      const teamLeader = await db.teamLeader.findUnique({
        where: { id: body.teamLeaderId },
      });
      if (!teamLeader) {
        return NextResponse.json(
          { error: 'Team Leader not found' },
          { status: 404 }
        );
      }
    }

    const user = await db.whatsAppUser.create({
      data: {
        phone: body.phone,
        name: body.name || null,
        role: body.role || 'client',
        clientId: body.clientId || null,
        teamLeaderId: body.teamLeaderId || null,
        isRegistered: body.isRegistered ?? true,
        registeredAt: body.isRegistered !== false ? new Date() : null,
      },
      include: {
        client: { select: { clientName: true, clientCode: true } },
        teamLeader: { select: { name: true } },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating WhatsApp user:', error);
    return NextResponse.json(
      { error: 'Failed to create WhatsApp user' },
      { status: 500 }
    );
  }
}
