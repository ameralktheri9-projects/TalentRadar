import {
  Company,
  CompanyUser,
  Agency,
  AgencyUser,
  JobRequest,
  Proposal,
  CandidateSubmission,
  Interview,
  Placement,
  Invoice,
  Rating,
  Subscription,
  AdminUser,
  CompanyStatus,
  CompanyUserRole,
  AgencyStatus,
  AgencyUserRole,
  SubscriptionTier,
  JobRequestStatus,
  ExperienceLevel,
  BudgetType,
  ProposalStatus,
  CandidateStatus,
  InterviewType,
  InterviewOutcome,
  PlacementStatus,
  InvoiceStatus,
  BillingCycle,
  UserStatus,
  IndustrySector,
  SaudiCity,
  ClientType,
  FeeType,
} from "@prisma/client";

// Re-export Prisma types
export type {
  Company,
  CompanyUser,
  Agency,
  AgencyUser,
  JobRequest,
  Proposal,
  CandidateSubmission,
  Interview,
  Placement,
  Invoice,
  Rating,
  Subscription,
  AdminUser,
};

export {
  CompanyStatus,
  CompanyUserRole,
  AgencyStatus,
  AgencyUserRole,
  SubscriptionTier,
  JobRequestStatus,
  ExperienceLevel,
  BudgetType,
  ProposalStatus,
  CandidateStatus,
  InterviewType,
  InterviewOutcome,
  PlacementStatus,
  InvoiceStatus,
  BillingCycle,
  UserStatus,
  IndustrySector,
  SaudiCity,
  ClientType,
  FeeType,
};

// Extended types with relations
export type CompanyWithUsers = Company & {
  users: CompanyUser[];
};

export type AgencyWithUsers = Agency & {
  users: AgencyUser[];
};

export type JobRequestWithDetails = JobRequest & {
  company: Company;
  creator: CompanyUser;
  proposals: Proposal[];
};

export type ProposalWithDetails = Proposal & {
  job_request: JobRequest;
  agency: Agency;
  submitter: AgencyUser;
  candidate_submissions: CandidateSubmission[];
};

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface CompanyRegistrationInput {
  name_ar: string;
  name_en: string;
  cr_number: string;
  industry_sector: IndustrySector;
  city: SaudiCity;
  saudi_employee_count: number;
  total_employee_count: number;
  contact_name: string;
  contact_email: string;
  contact_password: string;
}

export interface AgencyRegistrationInput {
  name_ar: string;
  name_en: string;
  hrsd_licence: string;
  founded_year?: number;
  team_size: number;
  sector_tags: string[];
  contact_name: string;
  contact_email: string;
  contact_password: string;
}

export interface JobRequestInput {
  title: string;
  description: string;
  sector: string;
  experience_level: ExperienceLevel;
  salary_min: number;
  salary_max: number;
  saudi_national_required: boolean;
  headcount: number;
  sla_days: number;
  budget_type: BudgetType;
  budget_value: number;
  proposal_deadline?: string;
}

// Dashboard stats
export interface CompanyDashboardStats {
  open_job_requests: number;
  total_proposals: number;
  active_placements: number;
  pending_invoices: number;
}

export interface AgencyDashboardStats {
  matched_rfps: number;
  active_proposals: number;
  total_placements: number;
  pending_commissions: number;
}

export interface AdminDashboardStats {
  pending_companies: number;
  pending_agencies: number;
  total_active_jobs: number;
  total_placements_this_month: number;
}
