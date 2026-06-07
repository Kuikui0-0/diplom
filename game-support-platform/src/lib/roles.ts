const roleLabels: Record<string, string> = {
  user: 'Пользователь',
  developer: 'Разработчик',
  admin: 'Администратор',
};

export function getRoleLabel(role: string): string {
  return roleLabels[role] || role;
}