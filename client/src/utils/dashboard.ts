export type DashboardRole = 'buyer' | 'seller';

export function getDefaultDashboardPath(role?: DashboardRole) {
  return role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer';
}
