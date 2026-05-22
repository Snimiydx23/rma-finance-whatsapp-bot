import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Google Sheets CSV export URLs
const SHEET_BASE = 'https://docs.google.com/spreadsheets/d/1CEFEA2jnC1ziJbNhuW4bkar1tOD52ec2d1-BOk94H8o/export?format=csv';
const RAW_DATA_GID = '1404414390';
const RAW_DATA2_GID = '2032189123';
const NEW_DASH_GID = '72700042';

// NEW DASH step names matching the actual sheet columns
const NEW_DASH_STEP_NAMES = [
  'Checklist P-CL',    // Step 1
  'Checklist S-CL',    // Step 2
  'Checklist CL3',     // Step 3
  'Checklist CL4',     // Step 4
  'Checklist CL5',     // Step 5
  'Checklist CL6',     // Step 6
  'Set Prep.',         // Step 7
  'Project Report',    // Step 8
  'BN',               // Step 9
  'Search',           // Step 10
  'Valuation',        // Step 11
  'TEV',              // Step 12
  'DDR',              // Step 13
  'Query',            // Step 14
  'Sanction Letter',  // Step 15
  'Doc.',             // Step 16
  'PDC',              // Step 17
  'Disburse',         // Step 18
  'Post Disbuse. Cond.', // Step 19
];

// Helper: fetch CSV from Google Sheets
async function fetchSheetCSV(gid: string): Promise<string> {
  const url = `${SHEET_BASE}&gid=${gid}`;
  const response = await fetch(url, {
    next: { revalidate: 0 },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet (gid=${gid}): ${response.status}`);
  }
  return response.text();
}

// Helper: parse CSV into rows (simple parser)
function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++; // skip \n
      } else {
        currentCell += char;
      }
    }
  }
  // Last cell/row
  currentRow.push(currentCell.trim());
  if (currentRow.some(c => c.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

// Helper: parse float from string
function parseFloat2(val: string): number {
  if (!val || val.trim() === '' || val.trim() === 'N') return 0;
  const cleaned = val.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Helper: determine step status from NEW DASH cell value
function parseStepStatus(val: string): { status: string; dateValue: string | null } {
  if (!val || val.trim() === '' || val.trim() === 'N') {
    return { status: 'pending', dateValue: null };
  }
  const v = val.trim();
  // "Done" or "DONE" = done
  if (v.toLowerCase() === 'done') {
    return { status: 'done', dateValue: null };
  }
  // "NA" = not applicable
  if (v.toLowerCase() === 'na') {
    return { status: 'na', dateValue: null };
  }
  // "In Process" or "In Progress" = in_process
  if (v.toLowerCase().includes('in process') || v.toLowerCase().includes('in progress')) {
    return { status: 'in_process', dateValue: null };
  }
  // Date-like values like "16/10", "01/12" = in_process (date when step was done/started)
  if (/^\d{1,2}\/\d{1,2}$/.test(v)) {
    return { status: 'done', dateValue: v };
  }
  // Any other non-empty value
  return { status: 'in_process', dateValue: v };
}

// ─── Sync RAW DATA ───
async function syncRawData(): Promise<{ clients: number; projects: number; errors: string[] }> {
  const result = { clients: 0, projects: 0, errors: [] as string[] };

  try {
    const csv = await fetchSheetCSV(RAW_DATA_GID);
    const rows = parseCSV(csv);

    if (rows.length < 2) {
      result.errors.push('RAW DATA: No data rows found');
      return result;
    }

    // Headers from first row
    // Timestamp,Client Name,Project Name,Proposal Type,Concerned Person,Team Leader,Team Engaged,
    // Term Loan Amt (Cr),CC Amt (Cr),BG Amt (Cr),LC Amt (Cr),OD Amt (Cr),LAP Amt (Cr),
    // Sublimit of CC (LC/BG/WCDL) Amt (Cr),Attachment URL,Client Job Code,Mail Status,Mobile Number,Total Loan Amount

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;

      const clientName = row[1]?.trim();
      const projectName = row[2]?.trim();
      const proposalType = row[3]?.trim();
      const concernedPerson = row[4]?.trim();
      const teamLeaderName = row[5]?.trim();
      const teamEngaged = row[6]?.trim();
      const termLoanAmt = parseFloat2(row[7]);
      const ccAmt = parseFloat2(row[8]);
      const bgAmt = parseFloat2(row[9]);
      const lcAmt = parseFloat2(row[10]);
      const odAmt = parseFloat2(row[11]);
      const lapAmt = parseFloat2(row[12]);
      const lcWcdlAmt = parseFloat2(row[13]);
      const attachmentUrl = row[14]?.trim();
      const clientJobCode = row[15]?.trim();
      const mailStatus = row[16]?.trim();
      const mobileNumber = row[17]?.trim();
      const totalLoanAmount = parseFloat2(row[18] || row[19]);

      if (!clientName || !projectName) continue;

      // Create or find team leader
      let teamLeaderId: string | null = null;
      if (teamLeaderName) {
        const existingTL = await db.teamLeader.findFirst({
          where: { name: teamLeaderName },
        });
        if (existingTL) {
          teamLeaderId = existingTL.id;
        } else {
          const newTL = await db.teamLeader.create({
            data: { name: teamLeaderName, mobileNumber: null },
          });
          teamLeaderId = newTL.id;
        }
      }

      // Create or find client by clientJobCode or name+mobile
      let clientId: string | null = null;
      if (clientJobCode) {
        const existingClient = await db.client.findFirst({
          where: { clientCode: clientJobCode },
        });
        if (existingClient) {
          // Update mobile number if available
          if (mobileNumber && !existingClient.mobileNumber) {
            await db.client.update({
              where: { id: existingClient.id },
              data: {
                mobileNumber,
                concernedPerson: concernedPerson || existingClient.concernedPerson,
              },
            });
          }
          clientId = existingClient.id;
        }
      }

      if (!clientId) {
        // Try to find by name
        const existingByName = await db.client.findFirst({
          where: { clientName },
        });
        if (existingByName) {
          if (mobileNumber && !existingByName.mobileNumber) {
            await db.client.update({
              where: { id: existingByName.id },
              data: { mobileNumber },
            });
          }
          clientId = existingByName.id;
        } else {
          // Create new client
          const newClient = await db.client.create({
            data: {
              clientCode: clientJobCode || `CLIENT-${Date.now()}-${i}`,
              clientName,
              mobileNumber: mobileNumber || null,
              concernedPerson: concernedPerson || null,
            },
          });
          clientId = newClient.id;
          result.clients++;
        }
      }

      // Check if project already exists
      const existingProject = await db.project.findFirst({
        where: {
          clientId,
          projectName,
          clientJobCode: clientJobCode || undefined,
        },
      });

      if (existingProject) {
        // Update existing project with latest financial data
        await db.project.update({
          where: { id: existingProject.id },
          data: {
            proposalType: proposalType || existingProject.proposalType,
            teamLeaderId: teamLeaderId || existingProject.teamLeaderId,
            teamEngaged: teamEngaged || existingProject.teamEngaged,
            termLoanAmt,
            ccAmt,
            bgAmt,
            lcAmt,
            odAmt,
            lapAmt,
            lcWcdlAmt,
            totalLoanAmount: totalLoanAmount || (termLoanAmt + ccAmt + bgAmt + lcAmt + odAmt + lapAmt + lcWcdlAmt),
            attachmentUrl: attachmentUrl || existingProject.attachmentUrl,
            mailStatus: mailStatus || existingProject.mailStatus,
          },
        });
        continue;
      }

      // Create new project with default steps
      const stepsData = NEW_DASH_STEP_NAMES.map((stepName, index) => ({
        stepNumber: index + 1,
        stepName,
        status: 'pending' as const,
      }));

      await db.project.create({
        data: {
          clientId,
          projectName,
          proposalType: proposalType || null,
          teamLeaderId,
          teamEngaged: teamEngaged || null,
          termLoanAmt,
          ccAmt,
          bgAmt,
          lcAmt,
          odAmt,
          lapAmt,
          lcWcdlAmt,
          totalLoanAmount: totalLoanAmount || (termLoanAmt + ccAmt + bgAmt + lcAmt + odAmt + lapAmt + lcWcdlAmt),
          attachmentUrl: attachmentUrl || null,
          clientJobCode: clientJobCode || null,
          mailStatus: mailStatus || null,
          steps: { create: stepsData },
        },
      });

      result.projects++;
    }
  } catch (error) {
    result.errors.push(`RAW DATA: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// ─── Sync RAW DATA2 (Bank Details) ───
async function syncRawData2(): Promise<{ banks: number; errors: string[] }> {
  const result = { banks: 0, errors: [] as string[] };

  try {
    const csv = await fetchSheetCSV(RAW_DATA2_GID);
    const rows = parseCSV(csv);

    if (rows.length < 2) {
      result.errors.push('RAW DATA2: No data rows found');
      return result;
    }

    // Headers: Timestamp,Client Job Code,Bank Name,Branch Name,Bank Relationship Manager,
    // Total Loan Amount,Attachment,Client Name,Project Name,Bank Name and Branch Name

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;

      const clientJobCode = row[1]?.trim();
      const bankName = row[2]?.trim();
      const branchName = row[3]?.trim();
      const bankRelationshipMgr = row[4]?.trim();
      const loanAmount = parseFloat2(row[5]);
      const attachment = row[6]?.trim();
      const clientName = row[7]?.trim();
      const projectName = row[8]?.trim();
      const bankAndBranch = row[9]?.trim();

      if (!bankName) continue;

      // Find project by clientJobCode or clientName+projectName
      let projectId: string | null = null;

      if (clientJobCode) {
        const project = await db.project.findFirst({
          where: { clientJobCode },
        });
        if (project) projectId = project.id;
      }

      if (!projectId && clientName) {
        const client = await db.client.findFirst({
          where: { clientName },
        });
        if (client && projectName) {
          const project = await db.project.findFirst({
            where: { clientId: client.id, projectName },
          });
          if (project) projectId = project.id;
        }
      }

      if (!projectId) continue;

      // Check if bank entry already exists
      const existingBank = await db.projectBank.findFirst({
        where: {
          projectId,
          bankName,
          branchName: branchName || null,
        },
      });

      if (existingBank) {
        await db.projectBank.update({
          where: { id: existingBank.id },
          data: {
            bankRelationshipMgr: bankRelationshipMgr || existingBank.bankRelationshipMgr,
            loanAmount: loanAmount || existingBank.loanAmount,
            attachment: attachment || existingBank.attachment,
            bankAndBranch: bankAndBranch || existingBank.bankAndBranch,
          },
        });
        continue;
      }

      await db.projectBank.create({
        data: {
          projectId,
          bankName,
          branchName: branchName || null,
          bankRelationshipMgr: bankRelationshipMgr || null,
          loanAmount,
          attachment: attachment || null,
          bankAndBranch: bankAndBranch || null,
        },
      });

      result.banks++;
    }
  } catch (error) {
    result.errors.push(`RAW DATA2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// ─── Sync NEW DASH (Project Steps & Completion) ───
async function syncNewDash(): Promise<{ updated: number; errors: string[] }> {
  const result = { updated: 0, errors: [] as string[] };

  try {
    const csv = await fetchSheetCSV(NEW_DASH_GID);
    const rows = parseCSV(csv);

    if (rows.length < 6) {
      result.errors.push('NEW DASH: No data rows found');
      return result;
    }

    // The NEW DASH sheet has a complex header structure:
    // Row 1: Summary stats
    // Row 2-4: Empty/Summary
    // Row 5 (index 4): Column headers
    // Row 6+ (index 5+): Data rows

    // Find the header row (contains "S. No." or "CLIENT CODE")
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      if (rows[i].some(cell => cell.includes('CLIENT CODE') || cell.includes('S. No'))) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      result.errors.push('NEW DASH: Could not find header row');
      return result;
    }

    // Data starts after header row
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;

      // Columns based on the actual NEW DASH structure:
      // 0: S. No.
      // 1: CLIENT CODE
      // 2: CLIENT NAME
      // 3: BANK NAME & BRANCH NAME
      // 4: PROJECT NAME
      // 5: TOTAL LOAN AMOUNT
      // 6: LOAN APPLIED FOR
      // 7: SET SENT VIA
      // 8: TEAM LEADER
      // 9-14: Step 1-6 (Checklist P-CL, S-CL, CL3, CL4, CL5, CL6)
      // 15: Set Prep. (Step 7)
      // 16: Project Report (Step 8)
      // 17: BN (Step 9)
      // 18: Search (Step 10)
      // 19: Valuation (Step 11)
      // 20: TEV (Step 12)
      // 21: DDR (Step 13)
      // 22: Query (Step 14)
      // 23: Sanction Letter (Step 15)
      // 24: Doc. (Step 16)
      // 25: PDC (Step 17)
      // 26: Disburse (Step 18)
      // 27: Post Disbuse. Cond. (Step 19)
      // 28: % COMPLETE

      const clientCode = row[1]?.trim();
      const clientName = row[2]?.trim();
      const bankAndBranch = row[3]?.trim();
      const projectName = row[4]?.trim();
      const totalLoanAmount = parseFloat2(row[5]);
      const loanAppliedFor = parseFloat2(row[6]);
      const setSentVia = row[7]?.trim();
      const teamLeaderName = row[8]?.trim();
      const completionPctStr = row[28]?.trim();
      const completionPct = parseFloat2(completionPctStr.replace('%', ''));

      if (!clientCode && !clientName) continue;

      // Find the project by clientJobCode
      let project = clientCode ? await db.project.findFirst({
        where: { clientJobCode: clientCode },
        include: { steps: true },
      }) : null;

      // If not found by code, try by client name + project name
      if (!project && clientName) {
        const client = await db.client.findFirst({
          where: { clientName },
        });
        if (client) {
          project = await db.project.findFirst({
            where: { clientId: client.id },
            include: { steps: true },
          });
        }
      }

      if (!project) continue;

      // Update project-level data
      await db.project.update({
        where: { id: project.id },
        data: {
          totalLoanAmount: totalLoanAmount || project.totalLoanAmount,
          loanAppliedFor: loanAppliedFor || project.loanAppliedFor,
          setSentVia: setSentVia || project.setSentVia,
          completionPct: completionPct || project.completionPct,
        },
      });

      // Update steps
      // Step columns start at index 9 (Step 1 = P-CL) through index 27 (Step 19 = Post Disbuse. Cond.)
      const stepColumnStart = 9;
      const stepColumnEnd = 27;

      for (let stepIdx = 0; stepIdx < NEW_DASH_STEP_NAMES.length; stepIdx++) {
        const colIdx = stepColumnStart + stepIdx;
        if (colIdx > stepColumnEnd) break;

        const cellValue = row[colIdx]?.trim() || '';
        const { status, dateValue } = parseStepStatus(cellValue);

        // Find existing step
        const existingStep = project.steps.find(s => s.stepNumber === stepIdx + 1);

        if (existingStep) {
          await db.projectStep.update({
            where: { id: existingStep.id },
            data: {
              stepName: NEW_DASH_STEP_NAMES[stepIdx],
              status,
              dateValue: dateValue || existingStep.dateValue,
            },
          });
        } else {
          // Create missing step
          await db.projectStep.create({
            data: {
              projectId: project.id,
              stepNumber: stepIdx + 1,
              stepName: NEW_DASH_STEP_NAMES[stepIdx],
              status,
              dateValue,
            },
          });
        }
      }

      // Also update or create bank entry if bank info is available
      if (bankAndBranch) {
        const existingBank = await db.projectBank.findFirst({
          where: {
            projectId: project.id,
            bankAndBranch,
          },
        });

        if (!existingBank) {
          // Parse bank name and branch from combined string
          const parts = bankAndBranch.split(' – ');
          const bName = parts[0]?.trim() || bankAndBranch;
          const bBranch = parts[1]?.trim() || null;

          await db.projectBank.create({
            data: {
              projectId: project.id,
              bankName: bName,
              branchName: bBranch,
              bankAndBranch,
              loanAmount: loanAppliedFor || totalLoanAmount,
            },
          });
        }
      }

      // Update team leader data
      if (teamLeaderName) {
        const tl = await db.teamLeader.findFirst({
          where: { name: teamLeaderName },
        });
        if (tl && project.teamLeaderId !== tl.id) {
          await db.project.update({
            where: { id: project.id },
            data: { teamLeaderId: tl.id },
          });
        }
      }

      result.updated++;
    }

    // Update team leader stats
    const allTeamLeaders = await db.teamLeader.findMany();
    for (const tl of allTeamLeaders) {
      const tlProjects = await db.project.findMany({
        where: { teamLeaderId: tl.id },
      });
      const avgCompletion = tlProjects.length > 0
        ? tlProjects.reduce((sum, p) => sum + p.completionPct, 0) / tlProjects.length
        : 0;

      await db.teamLeader.update({
        where: { id: tl.id },
        data: {
          totalProjectsInHand: tlProjects.length,
          workCompletionPct: Math.round(avgCompletion * 100) / 100,
        },
      });
    }
  } catch (error) {
    result.errors.push(`NEW DASH: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// ─── Main Sync Endpoint ───
// POST /api/data-import - Sync data from Google Sheets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sheets } = body; // Optional: specify which sheets to sync ['raw_data', 'raw_data2', 'new_dash']

    const syncResults = {
      rawData: { clients: 0, projects: 0, errors: [] as string[] },
      rawData2: { banks: 0, errors: [] as string[] },
      newDash: { updated: 0, errors: [] as string[] },
    };

    const sheetsToSync = sheets || ['raw_data', 'raw_data2', 'new_dash'];

    // Sync RAW DATA first (creates clients and projects)
    if (sheetsToSync.includes('raw_data')) {
      syncResults.rawData = await syncRawData();
    }

    // Sync RAW DATA2 (adds bank details to projects)
    if (sheetsToSync.includes('raw_data2')) {
      syncResults.rawData2 = await syncRawData2();
    }

    // Sync NEW DASH (updates project steps and completion)
    if (sheetsToSync.includes('new_dash')) {
      syncResults.newDash = await syncNewDash();
    }

    // Log the sync
    const totalSynced = syncResults.rawData.clients + syncResults.rawData.projects +
      syncResults.rawData2.banks + syncResults.newDash.updated;
    const totalErrors = [...syncResults.rawData.errors, ...syncResults.rawData2.errors, ...syncResults.newDash.errors];

    await db.syncLog.create({
      data: {
        sheetName: sheetsToSync.join(', '),
        status: totalErrors.length === 0 ? 'success' : 'partial',
        recordsSynced: totalSynced,
        errors: totalErrors.length > 0 ? totalErrors.join('; ') : null,
      },
    });

    return NextResponse.json({
      success: true,
      results: syncResults,
      summary: {
        totalSynced,
        errors: totalErrors,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error syncing Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to sync Google Sheets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/data-import - Get sync history
export async function GET() {
  try {
    const logs = await db.syncLog.findMany({
      orderBy: { syncAt: 'desc' },
      take: 10,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync logs' },
      { status: 500 }
    );
  }
}
