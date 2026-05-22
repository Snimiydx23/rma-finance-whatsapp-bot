import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/project-steps - List steps for a project (?projectId=)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const steps = await db.projectStep.findMany({
      where: { projectId },
      orderBy: { stepNumber: 'asc' },
    });

    return NextResponse.json(steps);
  } catch (error) {
    console.error('Error fetching project steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project steps' },
      { status: 500 }
    );
  }
}

// POST /api/project-steps - Create or update a step
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.projectId || !body.stepName) {
      return NextResponse.json(
        { error: 'projectId and stepName are required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: body.projectId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // If stepNumber and projectId match an existing step, update it
    if (body.stepNumber) {
      const existingStep = await db.projectStep.findFirst({
        where: {
          projectId: body.projectId,
          stepNumber: body.stepNumber,
        },
      });

      if (existingStep) {
        const updated = await db.projectStep.update({
          where: { id: existingStep.id },
          data: {
            stepName: body.stepName,
            status: body.status || existingStep.status,
            dateValue: body.dateValue !== undefined ? body.dateValue : existingStep.dateValue,
            notes: body.notes !== undefined ? body.notes : existingStep.notes,
          },
        });
        return NextResponse.json(updated);
      }
    }

    // Create new step
    const step = await db.projectStep.create({
      data: {
        projectId: body.projectId,
        stepNumber: body.stepNumber || 1,
        stepName: body.stepName,
        status: body.status || 'pending',
        dateValue: body.dateValue || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating project step:', error);
    return NextResponse.json(
      { error: 'Failed to create/update project step' },
      { status: 500 }
    );
  }
}
