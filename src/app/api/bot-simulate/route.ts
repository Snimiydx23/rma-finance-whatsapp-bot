import { processIncomingMessage } from '@/lib/maytapi';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/bot-simulate - Simulate WhatsApp bot conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, phone } = body;

    if (!message || !phone) {
      return NextResponse.json(
        { error: 'message and phone are required' },
        { status: 400 }
      );
    }

    const response = await processIncomingMessage(phone, message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error simulating bot:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
