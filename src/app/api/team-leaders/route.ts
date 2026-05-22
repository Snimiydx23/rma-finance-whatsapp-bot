import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/team-leaders - List all team leaders
export async function GET() {
  try {
    const teamLeaders = await db.teamLeader.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = teamLeaders.map((tl) => ({
      id: tl.id,
      name: tl.name,
      mobileNumber: tl.mobileNumber,
      totalProjectsInHand: tl.totalProjectsInHand,
      workCompletionPct: tl.workCompletionPct,
      projectsCount: tl._count.projects,
      createdAt: tl.createdAt,
      updatedAt: tl.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching team leaders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team leaders' },
      { status: 500 }
    );
  }
}

// POST /api/team-leaders - Create team leader
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const teamLeader = await db.teamLeader.create({
      data: {
        name: body.name,
        mobileNumber: body.mobileNumber || null,
        totalProjectsInHand: body.totalProjectsInHand ?? 0,
        workCompletionPct: body.workCompletionPct ?? 0,
      },
    });

    return NextResponse.json(teamLeader, { status: 201 });
  } catch (error) {
    console.error('Error creating team leader:', error);
    return NextResponse.json(
      { error: 'Failed to create team leader' },
      { status: 500 }
    );
  }
}
