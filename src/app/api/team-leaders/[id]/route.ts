import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/team-leaders/[id] - Get team leader with their projects
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const teamLeader = await db.teamLeader.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            client: { select: { id: true, clientName: true, clientCode: true } },
            _count: { select: { steps: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { projects: true, whatsappUsers: true },
        },
      },
    });

    if (!teamLeader) {
      return NextResponse.json(
        { error: 'Team Leader not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(teamLeader);
  } catch (error) {
    console.error('Error fetching team leader:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team leader' },
      { status: 500 }
    );
  }
}

// PUT /api/team-leaders/[id] - Update team leader
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.teamLeader.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Team Leader not found' },
        { status: 404 }
      );
    }

    const teamLeader = await db.teamLeader.update({
      where: { id },
      data: {
        name: body.name,
        mobileNumber: body.mobileNumber,
        totalProjectsInHand: body.totalProjectsInHand,
        workCompletionPct: body.workCompletionPct,
      },
    });

    return NextResponse.json(teamLeader);
  } catch (error) {
    console.error('Error updating team leader:', error);
    return NextResponse.json(
      { error: 'Failed to update team leader' },
      { status: 500 }
    );
  }
}

// DELETE /api/team-leaders/[id] - Delete team leader
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.teamLeader.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Team Leader not found' },
        { status: 404 }
      );
    }

    const projectCount = await db.project.count({ where: { teamLeaderId: id } });
    if (projectCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete team leader: has ${projectCount} associated projects. Reassign projects first.` },
        { status: 409 }
      );
    }

    await db.teamLeader.delete({ where: { id } });

    return NextResponse.json({ message: 'Team Leader deleted successfully' });
  } catch (error) {
    console.error('Error deleting team leader:', error);
    return NextResponse.json(
      { error: 'Failed to delete team leader' },
      { status: 500 }
    );
  }
}
