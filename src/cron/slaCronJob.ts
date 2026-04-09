import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { getRemainingWorkingDays, getSlaStatus, calculateDueDate } from '../services/slaService.js';
import { SLA_STATUS } from '../constants/slaConstants.js';
import * as notificationService from '../services/notificationService.js';
import { sendSlaApproachingEmail, sendSlaOverdueEmail } from '../services/emailService.js';
import { format } from 'date-fns';

async function getHrUsers(): Promise<Array<{ id: number; email: string; name: string | null }>> {
  const users = await prisma.user.findMany({
    where: {
      role: {
        roleName: { in: ['HR Manager', 'admin'] },
      },
      trash: null,
    },
    select: { id: true, email: true, name: true },
  });
  return users;
}

async function fetchJobTitle(jobTitleId: number): Promise<string> {
  const jobTitle = await prisma.jobTitle.findFirst({
    where: { id: jobTitleId },
    select: { name: true },
  });
  return jobTitle?.name || 'Unknown Position';
}

async function checkSlaDeadlines(): Promise<void> {
  console.log('[SLA Cron] Starting daily SLA check...');

  try {
    const requests = await prisma.employeeRequest.findMany({
      where: {
        statusEmployeeRequest: 6,
        recruitmentStartedAt: { not: null },
        isDeleted: 0,
      },
      select: {
        id: true,
        code: true,
        codeRecruitment: true,
        jobTitleId: true,
        recruitmentStartedAt: true,
      },
    });

    console.log(`[SLA Cron] Found ${requests.length} active recruitments to check`);

    const hrUsers = await getHrUsers();

    for (const request of requests) {
      const startDate = request.recruitmentStartedAt!;
      const remainingDays = getRemainingWorkingDays(startDate);
      const status = getSlaStatus(remainingDays);
      const dueDate = calculateDueDate(startDate);
      const dueDateFormatted = format(dueDate, 'MMMM d, yyyy');
      const requestCode = request.codeRecruitment || request.code;

      if (status === SLA_STATUS.APPROACHING) {
        const alreadySent = await notificationService.hasNotificationForReference(
          'employee_request', request.id, 'sla_approaching'
        );
        if (!alreadySent) {
          const jobTitle = await fetchJobTitle(request.jobTitleId);

          for (const user of hrUsers) {
            await notificationService.createNotification({
              userId: user.id,
              type: 'sla_approaching',
              title: `SLA Approaching - ${requestCode}`,
              message: `${requestCode} for ${jobTitle} has ${remainingDays} working days remaining before the SLA deadline of ${dueDateFormatted}.`,
              referenceType: 'employee_request',
              referenceId: request.id,
            });

            await sendSlaApproachingEmail({
              recipientEmail: user.email,
              recipientName: user.name || 'HR Team',
              requestCode,
              jobTitle,
              remainingDays,
              dueDate: dueDateFormatted,
            });
          }

          console.log(`[SLA Cron] Sent approaching notifications for ${requestCode}`);
        }
      }

      if (status === SLA_STATUS.OVERDUE) {
        const alreadySent = await notificationService.hasNotificationForReference(
          'employee_request', request.id, 'sla_overdue'
        );
        if (!alreadySent) {
          const jobTitle = await fetchJobTitle(request.jobTitleId);
          const overdueDays = Math.abs(remainingDays);

          for (const user of hrUsers) {
            await notificationService.createNotification({
              userId: user.id,
              type: 'sla_overdue',
              title: `SLA Overdue - ${requestCode}`,
              message: `${requestCode} for ${jobTitle} has exceeded the 45 working-day SLA by ${overdueDays} days. Due date was ${dueDateFormatted}. Recruitment can still proceed.`,
              referenceType: 'employee_request',
              referenceId: request.id,
            });

            await sendSlaOverdueEmail({
              recipientEmail: user.email,
              recipientName: user.name || 'HR Team',
              requestCode,
              jobTitle,
              overdueDays,
              dueDate: dueDateFormatted,
            });
          }

          console.log(`[SLA Cron] Sent overdue notifications for ${requestCode}`);
        }
      }
    }

    console.log('[SLA Cron] Daily SLA check completed');
  } catch (error) {
    console.error('[SLA Cron] Error during SLA check:', error);
  }
}

export function startSlaCronJob(): void {
  cron.schedule('0 1 * * 1-5', () => {
    checkSlaDeadlines();
  });

  console.log('[SLA Cron] Scheduled daily SLA check (Mon-Fri 08:00 WIB)');
}
