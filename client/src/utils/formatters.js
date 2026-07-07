import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatDate = (date) => format(new Date(date), 'MMM d, yyyy');
export const formatDateTime = (date) => format(new Date(date), 'MMM d, yyyy h:mm a');
export const formatTime = (date) => format(new Date(date), 'h:mm a');
export const formatRelative = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatMessageTime = (date) => {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const formatNumber = (n) => new Intl.NumberFormat('en-US').format(n);

export const getRoleLabel = (role) => ({
  org_admin: 'Organization Admin',
  hr: 'HR Manager',
  employee: 'Employee',
  intern: 'Intern',
}[role] || role);

export const getStatusColor = (status) => ({
  active: 'emerald',
  invited: 'amber',
  suspended: 'rose',
  deactivated: 'rose',
  planning: 'violet',
  on_hold: 'amber',
  completed: 'emerald',
  cancelled: 'rose',
}[status] || 'default');
