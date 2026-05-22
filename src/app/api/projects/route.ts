import { db } from '@/lib/db';
import { DEFAULT_STEP_NAMES } from '@/lib/maytapi';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects - List all projects with client name and team leader name
// Supports query params: ?clientId=, ?teamLeaderId=, ?search=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const teamLeaderId = searchParams.get('teamLeaderId');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (teamLeaderId) {
      where.teamLeaderId = teamLeaderId;
    }

    if (search) {
      where.OR = [
        { projectName: { contains: search } },
        { client: { clientName: { contains: search } } },
        { client: { clientCode: { contains: search } } },
        { proposalType: { contains: search } },
      ];
    }

    const projects = await db.project.findMany({
      where,
      include: {
        client: { select: { id: true, clientName: true, clientCode: true } },
        teamLeader: { select: { id: true, name: true } },
        banks: true,
        steps: { orderBy: { stepNumber: 'asc' } },
        _count: { select: { steps: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project (also create default 12 ProjectStep entries)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.clientId || !body.projectName) {
      return NextResponse.json(
        { error: 'clientId and projectName are required' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await db.client.findUnique({
      where: { id: body.clientId },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify team leader exists if provided
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

    const project = await db.project.create({
      data: {
        clientId: body.clientId,
        projectName: body.projectName,
        proposalType: body.proposalType || null,
        teamLeaderId: body.teamLeaderId || null,
        teamEngaged: body.teamEngaged || null,
        setSentVia: body.setSentVia || null,
        termLoanAmt: body.termLoanAmt ?? 0,
        ccAmt: body.ccAmt ?? 0,
        bgAmt: body.bgAmt ?? 0,
        lcAmt: body.lcAmt ?? 0,
        odAmt: body.odAmt ?? 0,
        lapAmt: body.lapAmt ?? 0,
        lcWcdlAmt: body.lcWcdlAmt ?? 0,
        totalLoanAmount: body.totalLoanAmount ?? 0,
        loanAppliedFor: body.loanAppliedFor ?? 0,
        attachmentUrl: body.attachmentUrl || null,
        clientJobCode: body.clientJobCode || null,
        mailStatus: body.mailStatus || null,
        completionPct: body.completionPct ?? 0,
      },
    });

    // Create default 12 ProjectStep entries
    const stepNames = body.stepNames || DEFAULT_STEP_NAMES;
    const stepsData = stepNames.map((stepName: string, index: number) => ({
      projectId: project.id,
      stepNumber: index + 1,
      stepName,
      status: 'pending',
    }));

    await db.projectStep.createMany({ data: stepsData });

    // Fetch the created project with steps
    const projectWithSteps = await db.project.findUnique({
      where: { id: project.id },
      include: {
        client: { select: { clientName: true, clientCode: true } },
        teamLeader: { select: { name: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    return NextResponse.json(projectWithSteps, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
