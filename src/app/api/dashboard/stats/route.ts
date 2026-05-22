import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/dashboard/stats - Return summary statistics
export async function GET() {
  try {
    // Total counts
    const [totalClients, totalProjects, totalTeamLeaders, totalWhatsAppUsers, totalBanks, bankLoanAggregation] =
      await Promise.all([
        db.client.count(),
        db.project.count(),
        db.teamLeader.count(),
        db.whatsAppUser.count({ where: { isRegistered: true } }),
        db.projectBank.count(),
        db.projectBank.aggregate({ _sum: { loanAmount: true } }),
      ]);

    // Project stats
    const ongoingProjects = await db.project.count({
      where: { completionPct: { lt: 100 } },
    });

    const completedProjects = await db.project.count({
      where: { completionPct: { gte: 100 } },
    });

    // Average completion percentage
    const projects = await db.project.findMany({
      select: { completionPct: true },
    });
    const avgCompletion =
      projects.length > 0
        ? Math.round(
            projects.reduce((sum, p) => sum + p.completionPct, 0) /
              projects.length
          )
        : 0;

    // Total loan amount
    const loanAggregation = await db.project.aggregate({
      _sum: {
        totalLoanAmount: true,
        termLoanAmt: true,
        ccAmt: true,
        bgAmt: true,
        lcAmt: true,
        odAmt: true,
        lapAmt: true,
        lcWcdlAmt: true,
        loanAppliedFor: true,
      },
    });

    // Projects by team leader
    const teamLeaders = await db.teamLeader.findMany({
      include: {
        _count: { select: { projects: true } },
        projects: {
          select: { completionPct: true },
        },
      },
    });

    const projectsByTeamLeader = teamLeaders.map((tl) => {
      const avgPct =
        tl.projects.length > 0
          ? Math.round(
              tl.projects.reduce((sum, p) => sum + p.completionPct, 0) /
                tl.projects.length
            )
          : 0;
      return {
        id: tl.id,
        name: tl.name,
        totalProjects: tl._count.projects,
        avgCompletion: avgPct,
      };
    });

    // Recent chat messages
    const recentMessages = await db.chatMessage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        whatsappUser: {
          select: {
            phone: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Projects by status
    const pendingProjects = await db.project.count({
      where: { completionPct: { equals: 0 } },
    });

    const inProgressProjects = await db.project.count({
      where: { completionPct: { gt: 0, lt: 100 } },
    });

    // WhatsApp users by role
    const whatsappUsersByRole = await db.whatsAppUser.groupBy({
      by: ['role'],
      where: { isRegistered: true },
      _count: { role: true },
    });

    // Sync log info
    const lastSyncLog = await db.syncLog.findFirst({
      orderBy: { syncAt: 'desc' },
    });

    const totalSyncLogs = await db.syncLog.count();

    return NextResponse.json({
      overview: {
        totalClients,
        totalProjects,
        ongoingProjects,
        completedProjects,
        pendingProjects,
        inProgressProjects,
        avgCompletion,
        totalTeamLeaders,
        totalWhatsAppUsers,
        totalBanks,
      },
      financials: {
        totalLoanAmount: loanAggregation._sum.totalLoanAmount || 0,
        totalTermLoan: loanAggregation._sum.termLoanAmt || 0,
        totalCC: loanAggregation._sum.ccAmt || 0,
        totalBG: loanAggregation._sum.bgAmt || 0,
        totalLC: loanAggregation._sum.lcAmt || 0,
        totalOD: loanAggregation._sum.odAmt || 0,
        totalLAP: loanAggregation._sum.lapAmt || 0,
        totalLCWCDL: loanAggregation._sum.lcWcdlAmt || 0,
        totalLoanAppliedFor: loanAggregation._sum.loanAppliedFor || 0,
      },
      bankStats: {
        totalBanks,
        totalBankLoanAmount: bankLoanAggregation._sum.loanAmount || 0,
      },
      syncInfo: {
        lastSyncAt: lastSyncLog?.syncAt || null,
        lastSyncStatus: lastSyncLog?.status || null,
        lastSyncRecords: lastSyncLog?.recordsSynced || 0,
        totalSyncRuns: totalSyncLogs,
      },
      projectsByTeamLeader,
      whatsappUsersByRole: whatsappUsersByRole.map((item) => ({
        role: item.role,
        count: item._count.role,
      })),
      recentMessages,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
