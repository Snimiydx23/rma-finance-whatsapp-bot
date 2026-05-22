import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/clients/[id] - Get client by ID with projects
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await db.client.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            teamLeader: { select: { id: true, name: true } },
            _count: { select: { steps: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { projects: true, whatsappUsers: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // If clientCode is being changed, check for duplicates
    if (body.clientCode && body.clientCode !== existing.clientCode) {
      const duplicate = await db.client.findUnique({
        where: { clientCode: body.clientCode },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'A client with this clientCode already exists' },
          { status: 409 }
        );
      }
    }

    const client = await db.client.update({
      where: { id },
      data: {
        clientCode: body.clientCode,
        clientName: body.clientName,
        mobileNumber: body.mobileNumber,
        email: body.email,
        concernedPerson: body.concernedPerson,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Delete will cascade if set up, but we should check for related records
    const projectCount = await db.project.count({ where: { clientId: id } });
    if (projectCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete client: has ${projectCount} associated projects. Delete projects first.` },
        { status: 409 }
      );
    }

    await db.client.delete({ where: { id } });

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
