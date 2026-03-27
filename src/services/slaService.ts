import { SLA_DAYS, SLA_WARNING_DAYS, SLA_STATUS, type SlaInfo, type SlaStatus } from '../constants/slaConstants.js';

function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function calculateDueDate(startDate: Date): Date {
  const date = new Date(startDate);
  let count = 0;

  while (count < SLA_DAYS) {
    date.setDate(date.getDate() + 1);
    if (isWorkingDay(date)) {
      count++;
    }
  }

  date.setHours(23, 59, 59, 999);
  return date;
}

export function countWorkingDaysBetween(fromDate: Date, toDate: Date): number {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  let count = 0;

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    if (isWorkingDay(current)) {
      count++;
    }
  }

  return count;
}

export function getRemainingWorkingDays(startDate: Date): number {
  const dueDate = calculateDueDate(startDate);
  const now = new Date();

  const dueDateNormalized = new Date(dueDate);
  dueDateNormalized.setHours(0, 0, 0, 0);

  const nowNormalized = new Date(now);
  nowNormalized.setHours(0, 0, 0, 0);

  if (nowNormalized <= dueDateNormalized) {
    return countWorkingDaysBetween(nowNormalized, dueDateNormalized);
  } else {
    return -countWorkingDaysBetween(dueDateNormalized, nowNormalized);
  }
}

export function getSlaStatus(remainingDays: number): SlaStatus {
  if (remainingDays <= 0) return SLA_STATUS.OVERDUE;
  if (remainingDays <= SLA_WARNING_DAYS) return SLA_STATUS.APPROACHING;
  return SLA_STATUS.ON_TRACK;
}

export function getSlaInfo(startDate: Date | null): SlaInfo | null {
  if (!startDate) return null;

  const dueDate = calculateDueDate(startDate);
  const remainingDays = getRemainingWorkingDays(startDate);
  const status = getSlaStatus(remainingDays);

  return {
    startedAt: startDate.toISOString(),
    dueDate: dueDate.toISOString(),
    remainingDays,
    totalDays: SLA_DAYS,
    status,
  };
}
