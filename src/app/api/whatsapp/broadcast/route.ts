import { sendWhatsAppMessage } from '@/lib/maytapi';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/whatsapp/broadcast - Send a message to all registered users or filtered by role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      isRegistered: true,
    };

    // Filter by role if provided
    if (body.role) {
      where.role = body.role;
    }

    const users = await db.whatsAppUser.findMany({
      where,
      select: { id: true, phone: true, name: true, role: true },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No registered users found matching the criteria' },
        { status: 404 }
      );
    }

    const results = await Promise.allSettled(
      users.map(async (user) => {
        const sent = await sendWhatsAppMessage(user.phone, body.message);

        // Log outgoing message
        await db.chatMessage.create({
          data: {
            whatsappUserId: user.id,
            direction: 'outgoing',
            messageText: body.message,
            messageType: 'text',
            payload: JSON.stringify({ broadcast: true, broadcastRole: body.role || 'all' }),
          },
        });

        return { phone: user.phone, name: user.name, sent };
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      totalUsers: users.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        phone: users[i].phone,
        name: users[i].name,
        status: r.status === 'fulfilled' ? 'sent' : 'failed',
      })),
    });
  } catch (error) {
    console.error('Error broadcasting WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast WhatsApp message' },
      { status: 500 }
    );
  }
}
