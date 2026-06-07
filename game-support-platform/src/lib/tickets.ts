// src/lib/tickets.ts

export const TICKET_STATUS_MAP: Record<string, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

export const TICKET_TYPE_MAP: Record<string, string> = {
  bug: 'Баг',
  feature: 'Фича',
  question: 'Вопрос',
};

export const TICKET_PRIORITY_MAP: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export function getTicketStatusLabel(status: string): string {
  return TICKET_STATUS_MAP[status] || status;
}

export function getTicketTypeLabel(type: string): string {
  return TICKET_TYPE_MAP[type] || type;
}

export function getTicketPriorityLabel(priority: string): string {
  return TICKET_PRIORITY_MAP[priority] || priority;
}