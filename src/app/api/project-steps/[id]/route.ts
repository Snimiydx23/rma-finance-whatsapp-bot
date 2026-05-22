import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/project-steps/[id] - Update step (status, dateValue, notes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.projectStep.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Project step not found' },
        { status: 404 }
      );
    }

    const step = await db.projectStep.update({
      where: { id },
      data: {
        stepName: body.stepName,
        stepNumber: body.stepNumber,
        status: body.status,
        dateValue: body.dateValue !== undefined ? body.dateValue : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    // Recalculate project completion percentage
    const allSteps = await db.projectStep.findMany({
      where: { projectId: existing.projectId },
    });
    const doneCount = allSteps.filter(
      (s) => s.status.toLowerCase() === 'done'
    ).length;
    const completionPct = allSteps.length > 0
      ? Math.round((doneCount / allSteps.length) * 100)
      : 0;

    await db.project.update({
      where: { id: existing.projectId },
      data: { completionPct },
    });

    return NextResponse.json({ ...step, completionPct });
  } catch (error) {
    console.error('Error updating project step:', error);
    return NextResponse.json(
      { error: 'Failed to update project step' },
      { status: 500 }
    );
  }
}

// DELETE /api/project-steps/[id] - Delete step
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.projectStep.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Project step not found' },
        { status: 404 }
      );
    }

    await db.projectStep.delete({ where: { id } });

    // Recalculate project completion percentage
    const allSteps = await db.projectStep.findMany({
      where: { projectId: existing.projectId },
    });
    const doneCount = allSteps.filter(
      (s) => s.status.toLowerCase() === 'done'
    ).length;
    const completionPct = allSteps.length > 0
      ? Math.round((doneCount / allSteps.length) * 100)
      : 0;

    await db.project.update({
      where: { id: existing.projectId },
      data: { completionPct },
    });

    return NextResponse.json({ message: 'Project step deleted successfully', completionPct });
  } catch (error) {
    console.error('Error deleting project step:', error);
    return NextResponse.json(
      { error: 'Failed to delete project step' },
      { status: 500 }
    );
  }
}
