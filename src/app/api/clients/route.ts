import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/clients - List all clients with their projects count
export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = clients.map((client) => ({
      id: client.id,
      clientCode: client.clientCode,
      clientName: client.clientName,
      mobileNumber: client.mobileNumber,
      email: client.email,
      concernedPerson: client.concernedPerson,
      projectsCount: client._count.projects,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientCode, clientName, mobileNumber, email, concernedPerson } = body;

    if (!clientCode || !clientName) {
      return NextResponse.json(
        { error: 'clientCode and clientName are required' },
        { status: 400 }
      );
    }

    // Check for duplicate clientCode
    const existing = await db.client.findUnique({
      where: { clientCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A client with this clientCode already exists' },
        { status: 409 }
      );
    }

    const client = await db.client.create({
      data: {
        clientCode,
        clientName,
        mobileNumber: mobileNumber || null,
        email: email || null,
        concernedPerson: concernedPerson || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
