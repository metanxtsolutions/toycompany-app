export type AdminRole = "SUPPORT" | "MANAGER" | "SUPER_ADMIN";

const ELEVATED: AdminRole[] = ["MANAGER", "SUPER_ADMIN"];

export function isStaff(role: string | undefined): role is AdminRole {
  return role === "SUPPORT" || role === "MANAGER" || role === "SUPER_ADMIN";
}

export function canManageCatalog(role: string | undefined) {
  return ELEVATED.includes(role as AdminRole);
}

export function canManageCoupons(role: string | undefined) {
  return ELEVATED.includes(role as AdminRole);
}

export function canManageBanners(role: string | undefined) {
  return ELEVATED.includes(role as AdminRole);
}

export function canRefund(role: string | undefined) {
  return ELEVATED.includes(role as AdminRole);
}

export function canBlockCustomers(role: string | undefined) {
  return ELEVATED.includes(role as AdminRole);
}

export function canUpdateOrderStatus(role: string | undefined) {
  return isStaff(role);
}

export function canModerateReviews(role: string | undefined) {
  return ELEVATED.includes(role as AdminRole);
}

export function canReplyToReviews(role: string | undefined) {
  return isStaff(role);
}

export function canViewAnalytics(role: string | undefined) {
  return ELEVATED.includes(role as AdminRole);
}
