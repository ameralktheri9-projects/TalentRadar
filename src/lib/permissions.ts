// Role-based permissions for company and agency users (Sprint 6)

export const COMPANY_PERMISSIONS = {
  ADMIN: [
    "job_request:create", "job_request:close", "job_request:view",
    "proposal:accept", "proposal:reject", "proposal:view",
    "invoice:view", "invoice:pay",
    "team:invite", "team:remove",
    "candidate:view", "candidate:shortlist",
    "interview:schedule", "interview:view",
    "placement:view",
  ],
  TA_LEAD: [
    "job_request:create", "job_request:close", "job_request:view",
    "proposal:accept", "proposal:reject", "proposal:view",
    "candidate:shortlist", "candidate:view",
    "interview:schedule", "interview:view",
    "placement:view",
  ],
  BU_MANAGER: [
    "job_request:view",
    "proposal:view",
    "candidate:view",
    "interview:view",
    "placement:view",
  ],
  // Legacy role that maps to ADMIN permissions
  HR_MANAGER: [
    "job_request:create", "job_request:close", "job_request:view",
    "proposal:accept", "proposal:reject", "proposal:view",
    "invoice:view", "invoice:pay",
    "team:invite", "team:remove",
    "candidate:view", "candidate:shortlist",
    "interview:schedule", "interview:view",
    "placement:view",
  ],
} as const;

export const AGENCY_PERMISSIONS = {
  OWNER: [
    "proposal:submit", "proposal:withdraw", "proposal:view",
    "candidate:manage", "candidate:view",
    "commission:view",
    "invoice:view",
    "team:invite", "team:remove",
    "profile:edit",
    "subscription:manage",
  ],
  RECRUITER: [
    "proposal:submit", "proposal:withdraw", "proposal:view",
    "candidate:manage", "candidate:view",
    "profile:edit",
  ],
  FINANCE: [
    "commission:view",
    "invoice:view",
    "proposal:view",
  ],
} as const;

type CompanyRole = keyof typeof COMPANY_PERMISSIONS;
type AgencyRole = keyof typeof AGENCY_PERMISSIONS;

export function canCompany(role: string, action: string): boolean {
  const perms = COMPANY_PERMISSIONS[role as CompanyRole];
  return perms ? (perms as readonly string[]).includes(action) : false;
}

export function canAgency(role: string, action: string): boolean {
  const perms = AGENCY_PERMISSIONS[role as AgencyRole];
  return perms ? (perms as readonly string[]).includes(action) : false;
}

// Generic can() — detects type from role string prefix convention
export function can(userType: "COMPANY" | "AGENCY", role: string, action: string): boolean {
  if (userType === "COMPANY") return canCompany(role, action);
  if (userType === "AGENCY") return canAgency(role, action);
  return false;
}
