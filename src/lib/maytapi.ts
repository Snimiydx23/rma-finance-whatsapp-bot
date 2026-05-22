import { db } from '@/lib/db';

// ─── Types ───

interface ProjectWithRelations {
  id: string;
  projectName: string;
  proposalType: string | null;
  totalLoanAmount: number;
  loanAppliedFor: number;
  completionPct: number;
  termLoanAmt: number;
  ccAmt: number;
  bgAmt: number;
  lcAmt: number;
  odAmt: number;
  lapAmt: number;
  lcWcdlAmt: number;
  teamEngaged: string | null;
  clientJobCode: string | null;
  client: { clientName: string; clientCode: string; mobileNumber: string | null } | null;
  teamLeader: { name: string } | null;
  steps: Array<{
    id: string;
    stepNumber: number;
    stepName: string;
    status: string;
    dateValue: string | null;
    notes: string | null;
  }>;
  banks: Array<{
    id: string;
    bankName: string;
    branchName: string | null;
    bankAndBranch: string | null;
    loanAmount: number;
  }>;
}

interface StepData {
  stepNumber: number;
  stepName: string;
  status: string;
  dateValue: string | null;
  notes: string | null;
}

// ─── Default step names for new projects (matching NEW DASH) ───

export const DEFAULT_STEP_NAMES = [
  'Checklist P-CL',
  'Checklist S-CL',
  'Checklist CL3',
  'Checklist CL4',
  'Checklist CL5',
  'Checklist CL6',
  'Set Prep.',
  'Project Report',
  'BN',
  'Search',
  'Valuation',
  'TEV',
  'DDR',
  'Query',
  'Sanction Letter',
  'Doc.',
  'PDC',
  'Disburse',
  'Post Disbuse. Cond.',
];

// ─── Get active Maytapi config from DB ───

export async function getMaytapiConfig() {
  const config = await db.maytapiConfig.findFirst({
    where: { isActive: true },
  });
  return config;
}

// ─── Send WhatsApp message via Maytapi API ───

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  try {
    const config = await getMaytapiConfig();
    if (!config) {
      console.error('No active Maytapi config found');
      return false;
    }

    if (!config.phoneId) {
      console.error('No phone ID configured in Maytapi config');
      return false;
    }

    const url = `https://api.maytapi.com/api/${config.productId}/${config.phoneId}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-maytapi-key': config.apiKey,
      },
      body: JSON.stringify({
        to_number: phone,
        type: 'text',
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Maytapi send error:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// ─── Format project info for WhatsApp message ───

export function formatProjectInfo(project: ProjectWithRelations): string {
  const clientName = project.client?.clientName ?? 'Unknown Client';
  const teamLeader = project.teamLeader?.name ?? 'Unassigned';
  const statusEmoji = project.completionPct >= 100 ? '✅' : project.completionPct > 0 ? '🔄' : '⏳';

  let msg = `${statusEmoji} *${project.projectName}*\n`;
  msg += `📋 Client: ${clientName}\n`;
  if (project.proposalType) msg += `📄 Type: ${project.proposalType}\n`;
  msg += `👤 Team Leader: ${teamLeader}\n`;
  if (project.teamEngaged) msg += `👥 Team: ${project.teamEngaged}\n`;
  msg += `💰 Total Loan: ₹${project.totalLoanAmount.toLocaleString('en-IN')} Cr\n`;
  if (project.loanAppliedFor > 0 && project.loanAppliedFor !== project.totalLoanAmount) {
    msg += `📝 Applied For: ₹${project.loanAppliedFor.toLocaleString('en-IN')} Cr\n`;
  }
  msg += `📊 Completion: ${project.completionPct.toFixed(0)}%\n`;

  return msg;
}

// ─── Format project steps for WhatsApp message ───

export function formatProjectSteps(steps: StepData[], projectName: string): string {
  if (!steps || steps.length === 0) {
    return `No steps found for *${projectName}*`;
  }

  const statusEmojis: Record<string, string> = {
    done: '✅',
    in_process: '🔄',
    pending: '⏳',
    na: '➖',
  };

  let msg = `📋 *Steps for ${projectName}:*\n\n`;

  // Group steps into sections matching NEW DASH
  const checklistSteps = steps.filter(s => s.stepName.toLowerCase().includes('checklist'));
  const processingSteps = steps.filter(s =>
    !s.stepName.toLowerCase().includes('checklist') &&
    !['Doc.', 'PDC', 'Disburse', 'Post Disbuse. Cond.'].includes(s.stepName)
  );
  const disbursementSteps = steps.filter(s =>
    ['Doc.', 'PDC', 'Disburse', 'Post Disbuse. Cond.'].includes(s.stepName)
  );

  if (checklistSteps.length > 0) {
    msg += `📝 *Checklist:*\n`;
    checklistSteps.forEach((step) => {
      const emoji = statusEmojis[step.status.toLowerCase()] || '❓';
      const dateStr = step.dateValue ? ` (${step.dateValue})` : '';
      msg += `${emoji} ${step.stepName}${dateStr}\n`;
    });
    msg += '\n';
  }

  if (processingSteps.length > 0) {
    msg += `⚙️ *Processing:*\n`;
    processingSteps.forEach((step) => {
      const emoji = statusEmojis[step.status.toLowerCase()] || '❓';
      const dateStr = step.dateValue ? ` (${step.dateValue})` : '';
      msg += `${emoji} ${step.stepName}${dateStr}\n`;
    });
    msg += '\n';
  }

  if (disbursementSteps.length > 0) {
    msg += `🏦 *Disbursement:*\n`;
    disbursementSteps.forEach((step) => {
      const emoji = statusEmojis[step.status.toLowerCase()] || '❓';
      const dateStr = step.dateValue ? ` (${step.dateValue})` : '';
      msg += `${emoji} ${step.stepName}${dateStr}\n`;
    });
    msg += '\n';
  }

  const doneCount = steps.filter((s) => s.status.toLowerCase() === 'done').length;
  const naCount = steps.filter((s) => s.status.toLowerCase() === 'na').length;
  const totalApplicable = steps.length - naCount;
  const pct = totalApplicable > 0 ? Math.round((doneCount / totalApplicable) * 100) : 0;
  msg += `📊 Progress: ${doneCount}/${totalApplicable} steps done (${pct}%)`;

  return msg;
}

// ─── Format bank details for WhatsApp message ───

export function formatBankDetails(banks: ProjectWithRelations['banks'], projectName: string): string {
  if (!banks || banks.length === 0) {
    return `No bank details found for *${projectName}*`;
  }

  let msg = `🏦 *Bank Details for ${projectName}:*\n\n`;
  banks.forEach((bank, index) => {
    msg += `${index + 1}. *${bank.bankAndBranch || bank.bankName}*\n`;
    if (bank.branchName && !bank.bankAndBranch) msg += `   Branch: ${bank.branchName}\n`;
    msg += `   Amount: ₹${bank.loanAmount.toLocaleString('en-IN')} Cr\n\n`;
  });

  return msg;
}

// ─── Format the main menu ───

export function formatMenuMessage(): string {
  return (
    `🏗️ *RMA Finance - Main Menu*\n\n` +
    `Reply with:\n` +
    `1️⃣ *My Projects* - View your assigned projects\n` +
    `2️⃣ *Project Steps* - View step-wise progress\n` +
    `3️⃣ *Bank Details* - View bank-wise information\n` +
    `4️⃣ *Financial* - View financial details\n` +
    `5️⃣ *Help* - Show this menu\n\n` +
    `You can also type:\n` +
    `"my projects", "steps", "banks", "financial", or "help"`
  );
}

// ─── Format welcome/registration message ───

export function formatWelcomeMessage(): string {
  return (
    `👋 *Welcome to RMA Finance WhatsApp Bot!*\n\n` +
    `We don't recognize your number yet. To get started, please register:\n\n` +
    `📝 Reply in this format:\n` +
    `*REGISTER <name> <role>*\n\n` +
    `Roles: *client* or *team_leader*\n\n` +
    `Examples:\n` +
    `REGISTER Rahul client\n` +
    `REGISTER Priya team_leader\n\n` +
    `Once registered, you can access your project information anytime! 🚀`
  );
}

// ─── User session state (in-memory for tracking multi-step conversations) ───
const userSessions = new Map<string, { state: string; projectIndex?: number; timestamp: number }>();

function getUserSession(phone: string) {
  const session = userSessions.get(phone);
  if (session && Date.now() - session.timestamp > 300000) { // 5 min timeout
    userSessions.delete(phone);
    return null;
  }
  return session;
}

function setUserSession(phone: string, state: string, projectIndex?: number) {
  userSessions.set(phone, { state, projectIndex, timestamp: Date.now() });
}

// ─── Process incoming message (main bot logic) ───

export async function processIncomingMessage(
  phone: string,
  messageText: string
): Promise<string> {
  const text = messageText.trim().toLowerCase();

  // Check if user exists
  let user = await db.whatsAppUser.findUnique({
    where: { phone },
    include: {
      client: { include: { projects: { include: { teamLeader: true, steps: true, banks: true } } } },
      teamLeader: { include: { projects: { include: { client: true, steps: true, banks: true } } } },
    },
  });

  // ─── Registration flow ───
  if (!user || !user.isRegistered) {
    // Check if they're trying to register
    if (text.startsWith('register')) {
      const parts = messageText.trim().split(/\s+/);
      if (parts.length >= 3) {
        const name = parts[1];
        const role = parts[2].toLowerCase();

        if (!['client', 'team_leader'].includes(role)) {
          return '❌ Invalid role. Please use *client* or *team_leader*.\n\nExample: REGISTER Rahul client';
        }

        // Try to match with existing client or team leader by mobile number
        // Normalize phone number for matching
        const normalizedPhone = phone.replace(/^91/, '').replace(/^0/, '');
        const phoneVariants = [phone, `91${normalizedPhone}`, normalizedPhone, `0${normalizedPhone}`];

        let clientId: string | null = null;
        let teamLeaderId: string | null = null;

        if (role === 'client') {
          const matchedClient = await db.client.findFirst({
            where: {
              OR: phoneVariants.map(p => ({ mobileNumber: p })),
            },
          });
          if (matchedClient) {
            clientId = matchedClient.id;
          }
        } else if (role === 'team_leader') {
          const matchedTL = await db.teamLeader.findFirst({
            where: {
              OR: phoneVariants.map(p => ({ mobileNumber: p })),
            },
          });
          if (matchedTL) {
            teamLeaderId = matchedTL.id;
          }
        }

        // Create or update WhatsAppUser
        if (user) {
          user = await db.whatsAppUser.update({
            where: { id: user.id },
            data: {
              name,
              role,
              clientId,
              teamLeaderId,
              isRegistered: true,
              registeredAt: new Date(),
            },
            include: {
              client: { include: { projects: { include: { teamLeader: true, steps: true, banks: true } } } },
              teamLeader: { include: { projects: { include: { client: true, steps: true, banks: true } } } },
            },
          });
        } else {
          user = await db.whatsAppUser.create({
            data: {
              phone,
              name,
              role,
              clientId,
              teamLeaderId,
              isRegistered: true,
              registeredAt: new Date(),
            },
            include: {
              client: { include: { projects: { include: { teamLeader: true, steps: true, banks: true } } } },
              teamLeader: { include: { projects: { include: { client: true, steps: true, banks: true } } } },
            },
          });
        }

        const matchInfo =
          role === 'client' && clientId
            ? '\n✅ Linked to your client profile!'
            : role === 'team_leader' && teamLeaderId
              ? '\n✅ Linked to your team leader profile!'
              : '\n⚠️ No matching profile found. Please contact admin to link your account.';

        return (
          `✅ *Registration Successful!*\n\n` +
          `👤 Name: ${name}\n` +
          `🏷️ Role: ${role === 'client' ? 'Client' : 'Team Leader'}\n` +
          matchInfo +
          `\n\n` +
          formatMenuMessage()
        );
      } else {
        return (
          `❌ Invalid format. Please use:\n*REGISTER <name> <role>*\n\n` +
          `Example: REGISTER Rahul client`
        );
      }
    }

    // Not registered and not trying to register
    return formatWelcomeMessage();
  }

  // ─── Registered user - process menu commands ───

  // Get user's projects based on role
  const userProjects: ProjectWithRelations[] =
    user.role === 'client' && user.client
      ? (user.client.projects as unknown as ProjectWithRelations[])
      : user.role === 'team_leader' && user.teamLeader
        ? (user.teamLeader.projects as unknown as ProjectWithRelations[])
        : [];

  // Check for session state (multi-step conversations)
  const session = getUserSession(phone);

  // Handle project selection from steps menu
  if (session?.state === 'selecting_project_steps') {
    const idx = parseInt(text) - 1;
    if (idx >= 0 && idx < userProjects.length) {
      setUserSession(phone, 'idle');
      return formatProjectSteps(userProjects[idx].steps, userProjects[idx].projectName);
    } else {
      setUserSession(phone, 'idle');
      return `❌ Invalid project number. Please try again.\n\n${formatMenuMessage()}`;
    }
  }

  // Handle project selection from bank details menu
  if (session?.state === 'selecting_project_banks') {
    const idx = parseInt(text) - 1;
    if (idx >= 0 && idx < userProjects.length) {
      setUserSession(phone, 'idle');
      return formatBankDetails(userProjects[idx].banks, userProjects[idx].projectName);
    } else {
      setUserSession(phone, 'idle');
      return `❌ Invalid project number. Please try again.\n\n${formatMenuMessage()}`;
    }
  }

  // Handle "1" or "my projects"
  if (text === '1' || text === 'my projects' || text === 'my project' || text === 'projects') {
    if (userProjects.length === 0) {
      return `📂 No projects assigned to you yet. Please contact admin.`;
    }

    let msg = `📋 *Your Projects (${userProjects.length}):*\n\n`;
    userProjects.forEach((project, index) => {
      msg += `*${index + 1}.* ${formatProjectInfo(project)}\n`;
    });
    msg += `\n💡 Reply "2" to view step-wise progress\nReply "3" for bank details`;
    return msg;
  }

  // Handle "2" or "project steps"
  if (text === '2' || text === 'project steps' || text === 'steps') {
    if (userProjects.length === 0) {
      return `📂 No projects assigned to you yet. Please contact admin.`;
    }

    if (userProjects.length === 1) {
      const project = userProjects[0];
      return formatProjectSteps(project.steps, project.projectName);
    }

    // Multiple projects - ask which one
    setUserSession(phone, 'selecting_project_steps');
    let msg = `📋 *Which project's steps?* Reply with the number:\n\n`;
    userProjects.forEach((project, index) => {
      const statusEmoji = project.completionPct >= 100 ? '✅' : project.completionPct > 0 ? '🔄' : '⏳';
      msg += `${index + 1}. ${statusEmoji} ${project.projectName} (${project.completionPct.toFixed(0)}%)\n`;
    });
    msg += `\n⏰ Reply within 5 minutes`;
    return msg;
  }

  // Handle "3" or "banks"
  if (text === '3' || text === 'banks' || text === 'bank details' || text === 'bank') {
    if (userProjects.length === 0) {
      return `📂 No projects assigned to you yet. Please contact admin.`;
    }

    if (userProjects.length === 1) {
      const project = userProjects[0];
      return formatBankDetails(project.banks, project.projectName);
    }

    // Multiple projects - ask which one
    setUserSession(phone, 'selecting_project_banks');
    let msg = `🏦 *Which project's bank details?* Reply with the number:\n\n`;
    userProjects.forEach((project, index) => {
      const statusEmoji = project.completionPct >= 100 ? '✅' : project.completionPct > 0 ? '🔄' : '⏳';
      msg += `${index + 1}. ${statusEmoji} ${project.projectName} (${project.banks.length} banks)\n`;
    });
    msg += `\n⏰ Reply within 5 minutes`;
    return msg;
  }

  // Handle "4" or "financial"
  if (text === '4' || text === 'financial' || text === 'finance' || text === 'amount') {
    if (userProjects.length === 0) {
      return `📂 No projects assigned to you yet. Please contact admin.`;
    }

    let totalAmount = 0;
    let msg = `💰 *Financial Details:*\n\n`;
    userProjects.forEach((project) => {
      const clientName = project.client?.clientName ?? 'Unknown';
      msg += `📊 *${project.projectName}* (${clientName})\n`;
      if (project.termLoanAmt > 0) msg += `  🏠 Term Loan: ₹${project.termLoanAmt.toLocaleString('en-IN')} Cr\n`;
      if (project.ccAmt > 0) msg += `  💵 CC: ₹${project.ccAmt.toLocaleString('en-IN')} Cr\n`;
      if (project.bgAmt > 0) msg += `  📑 BG: ₹${project.bgAmt.toLocaleString('en-IN')} Cr\n`;
      if (project.lcAmt > 0) msg += `  📜 LC: ₹${project.lcAmt.toLocaleString('en-IN')} Cr\n`;
      if (project.odAmt > 0) msg += `  🔄 OD: ₹${project.odAmt.toLocaleString('en-IN')} Cr\n`;
      if (project.lapAmt > 0) msg += `  🏘️ LAP: ₹${project.lapAmt.toLocaleString('en-IN')} Cr\n`;
      if (project.lcWcdlAmt > 0) msg += `  📋 LC/WCDL: ₹${project.lcWcdlAmt.toLocaleString('en-IN')} Cr\n`;
      msg += `  *Total: ₹${project.totalLoanAmount.toLocaleString('en-IN')} Cr*\n\n`;
      totalAmount += project.totalLoanAmount;
    });

    if (userProjects.length > 1) {
      msg += `━━━━━━━━━━━━━━━\n`;
      msg += `📊 *Grand Total: ₹${totalAmount.toLocaleString('en-IN')} Cr*`;
    }

    return msg;
  }

  // Handle "5" or "help"
  if (text === '5' || text === 'help' || text === 'menu' || text === 'hi' || text === 'hello') {
    setUserSession(phone, 'idle');
    return formatMenuMessage();
  }

  // Default response
  return (
    `🤔 I didn't understand that.\n\n` + formatMenuMessage()
  );
}
