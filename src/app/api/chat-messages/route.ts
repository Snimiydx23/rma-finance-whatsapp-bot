import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/chat-messages - List messages (?whatsappUserId=, ?limit=50, ?offset=0)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const whatsappUserId = searchParams.get('whatsappUserId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const direction = searchParams.get('direction');

    const where: Record<string, unknown> = {};

    if (whatsappUserId) {
      where.whatsappUserId = whatsappUserId;
    }

    if (direction) {
      where.direction = direction;
    }

    const [messages, total] = await Promise.all([
      db.chatMessage.findMany({
        where,
        include: {
          whatsappUser: {
            select: {
              id: true,
              phone: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.chatMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      total,
      limit,
      offset,
      hasMore: offset + messages.length < total,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}
