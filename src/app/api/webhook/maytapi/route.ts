import { db } from '@/lib/db';
import { sendWhatsAppMessage, processIncomingMessage } from '@/lib/maytapi';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/webhook/maytapi - Maytapi Webhook Handler
// Receives incoming WhatsApp messages from Maytapi
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Extract data from Maytapi webhook payload
    const message = payload.message;
    const phoneId = payload.phone_id;
    const productId = payload.product_id;

    if (!message || !message.from_number) {
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing message or from_number' },
        { status: 400 }
      );
    }

    const senderPhone = message.from_number;
    const messageText = message.text || '';
    const messageType = message.type || 'text';

    // Only process text messages
    if (messageType !== 'text' || !messageText.trim()) {
      return NextResponse.json({ status: 'ignored', reason: 'non-text message' });
    }

    // Find or create WhatsAppUser
    let user = await db.whatsAppUser.findUnique({
      where: { phone: senderPhone },
    });

    // Log incoming message
    if (user) {
      await db.chatMessage.create({
        data: {
          whatsappUserId: user.id,
          direction: 'incoming',
          messageText,
          messageType: 'text',
          payload: JSON.stringify({ phoneId, productId, rawType: messageType }),
        },
      });
    } else {
      // Create a temporary unregistered user to log the message
      user = await db.whatsAppUser.create({
        data: {
          phone: senderPhone,
          isRegistered: false,
          role: 'client',
        },
      });

      await db.chatMessage.create({
        data: {
          whatsappUserId: user.id,
          direction: 'incoming',
          messageText,
          messageType: 'text',
          payload: JSON.stringify({ phoneId, productId, rawType: messageType }),
        },
      });
    }

    // Process the message using bot logic
    const responseText = await processIncomingMessage(senderPhone, messageText);

    // Send response via Maytapi
    const sent = await sendWhatsAppMessage(senderPhone, responseText);

    // Log outgoing message
    await db.chatMessage.create({
      data: {
        whatsappUserId: user.id,
        direction: 'outgoing',
        messageText: responseText,
        messageType: 'text',
        payload: JSON.stringify({ sent, autoReply: true }),
      },
    });

    return NextResponse.json({
      status: 'processed',
      senderPhone,
      responseSent: sent,
    });
  } catch (error) {
    console.error('Error processing Maytapi webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
