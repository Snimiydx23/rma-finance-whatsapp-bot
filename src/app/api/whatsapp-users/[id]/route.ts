import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/whatsapp-users/[id] - Get user details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.whatsAppUser.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, clientName: true, clientCode: true } },
        teamLeader: { select: { id: true, name: true } },
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching WhatsApp user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp user' },
      { status: 500 }
    );
  }
}

// PUT /api/whatsapp-users/[id] - Update user (role, clientId, teamLeaderId, name)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.whatsAppUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    const user = await db.whatsAppUser.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        clientId: body.clientId !== undefined ? body.clientId : undefined,
        teamLeaderId: body.teamLeaderId !== undefined ? body.teamLeaderId : undefined,
        isRegistered: body.isRegistered,
      },
      include: {
        client: { select: { clientName: true, clientCode: true } },
        teamLeader: { select: { name: true } },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating WhatsApp user:', error);
    return NextResponse.json(
      { error: 'Failed to update WhatsApp user' },
      { status: 500 }
    );
  }
}

// DELETE /api/whatsapp-users/[id] - Delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.whatsAppUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete chat messages first
    await db.chatMessage.deleteMany({ where: { whatsappUserId: id } });

    await db.whatsAppUser.delete({ where: { id } });

    return NextResponse.json({ message: 'WhatsApp user deleted successfully' });
  } catch (error) {
    console.error('Error deleting WhatsApp user:', error);
    return NextResponse.json(
      { error: 'Failed to delete WhatsApp user' },
      { status: 500 }
    );
  }
}
