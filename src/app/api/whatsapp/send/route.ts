import { sendWhatsAppMessage } from '@/lib/maytapi';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/whatsapp/send - Send a WhatsApp message via Maytapi API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.phone || !body.message) {
      return NextResponse.json(
        { error: 'phone and message are required' },
        { status: 400 }
      );
    }

    // Send message via Maytapi
    const sent = await sendWhatsAppMessage(body.phone, body.message);

    // Log outgoing message if we can find the user
    const user = await db.whatsAppUser.findUnique({
      where: { phone: body.phone },
    });

    if (user) {
      await db.chatMessage.create({
        data: {
          whatsappUserId: user.id,
          direction: 'outgoing',
          messageText: body.message,
          messageType: body.messageType || 'text',
          payload: JSON.stringify({ manualSend: true }),
        },
      });
    }

    if (sent) {
      return NextResponse.json({ status: 'sent', phone: body.phone });
    } else {
      return NextResponse.json(
        { error: 'Failed to send message via Maytapi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
