export const SLA_DAYS = 45;
export const SLA_WARNING_DAYS = 10;

export const SLA_STATUS = {
  ON_TRACK: 'on_track',
  APPROACHING: 'approaching',
  OVERDUE: 'overdue',
} as const;

export type SlaStatus = typeof SLA_STATUS[keyof typeof SLA_STATUS];

export interface SlaInfo {
  startedAt: string;
  dueDate: string;
  remainingDays: number;
  totalDays: number;
  status: SlaStatus;
}
