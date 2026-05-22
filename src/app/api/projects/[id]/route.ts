import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/projects/[id] - Get project with client, team leader, and all steps
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        client: true,
        teamLeader: true,
        banks: true,
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify client exists if changing
    if (body.clientId) {
      const client = await db.client.findUnique({
        where: { id: body.clientId },
      });
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
    }

    // Verify team leader exists if changing
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

    const project = await db.project.update({
      where: { id },
      data: {
        clientId: body.clientId,
        projectName: body.projectName,
        proposalType: body.proposalType,
        teamLeaderId: body.teamLeaderId,
        teamEngaged: body.teamEngaged,
        setSentVia: body.setSentVia,
        termLoanAmt: body.termLoanAmt,
        ccAmt: body.ccAmt,
        bgAmt: body.bgAmt,
        lcAmt: body.lcAmt,
        odAmt: body.odAmt,
        lapAmt: body.lapAmt,
        lcWcdlAmt: body.lcWcdlAmt,
        totalLoanAmount: body.totalLoanAmount,
        loanAppliedFor: body.loanAppliedFor,
        attachmentUrl: body.attachmentUrl,
        clientJobCode: body.clientJobCode,
        mailStatus: body.mailStatus,
        completionPct: body.completionPct,
      },
      include: {
        client: { select: { clientName: true, clientCode: true } },
        teamLeader: { select: { name: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete steps first (should cascade, but be explicit)
    await db.projectStep.deleteMany({ where: { projectId: id } });

    // Delete project
    await db.project.delete({ where: { id } });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
