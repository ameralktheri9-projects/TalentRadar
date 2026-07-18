export const dynamic = "force-dynamic";

// Required V2 environment variables:
// SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
// OPENAI_API_KEY, OPENAI_MODEL (defaults to gpt-4o)
// CRON_SECRET (for /api/cron/* endpoints)
// NEXT_PUBLIC_APP_URL (e.g. https://talent-radar-gamma.vercel.app)
// NEXTAUTH_SECRET, NEXTAUTH_URL
// DATABASE_URL (Neon PostgreSQL connection string)
// Optional (features degrade gracefully without them):
//   HYPERPAY_ACCESS_TOKEN, HYPERPAY_BASE_URL, HYPERPAY_ENTITY_ID_CARD, HYPERPAY_WEBHOOK_SECRET
//   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
const SECRET = process.env.SETUP_SECRET || "talenthunt-setup-2026";

// Each entry is a single statement — Prisma cannot run multiple at once
const ENUMS = [
  `DO $$ BEGIN CREATE TYPE "IndustrySector" AS ENUM ('TECHNOLOGY','HEALTHCARE','FINANCE','EDUCATION','RETAIL','MANUFACTURING','CONSTRUCTION','ENERGY','LOGISTICS','HOSPITALITY','MEDIA','GOVERNMENT','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "SaudiCity" AS ENUM ('RIYADH','JEDDAH','MECCA','MEDINA','DAMMAM','KHOBAR','DHAHRAN','TABUK','ABHA','TAIF','NAJRAN','JIZAN','HAIL','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "CompanyStatus" AS ENUM ('PENDING','ACTIVE','SUSPENDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "CompanyUserRole" AS ENUM ('HR_MANAGER','TA_LEAD','BU_MANAGER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','INVITED','DEACTIVATED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "ClientType" AS ENUM ('ENTERPRISE','SME','STARTUP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "SubscriptionTier" AS ENUM ('FREE','BASIC','PRO','ELITE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "AgencyStatus" AS ENUM ('PENDING','ACTIVE','SUSPENDED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "AgencyUserRole" AS ENUM ('OWNER','RECRUITER','FINANCE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "ExperienceLevel" AS ENUM ('JUNIOR','MID','SENIOR','DIRECTOR','C_SUITE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "BudgetType" AS ENUM ('PERCENTAGE_OF_SALARY','FLAT_FEE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "JobRequestStatus" AS ENUM ('DRAFT','OPEN','CLOSED','FILLED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "FeeType" AS ENUM ('PERCENTAGE','FLAT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED','SHORTLISTED','ACCEPTED','REJECTED','WITHDRAWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "CandidateStatus" AS ENUM ('SUBMITTED','VIEWED','SHORTLISTED','INTERVIEW_SCHEDULED','OFFER_MADE','HIRED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "InterviewType" AS ENUM ('PHONE','VIDEO','ONSITE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "InterviewOutcome" AS ENUM ('PENDING','PASSED','FAILED','NO_SHOW','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "PlacementStatus" AS ENUM ('OFFER_MADE','ACCEPTED','DECLINED','STARTED','GUARANTEE_BREACH','REPLACED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT','ISSUED','PAID','DISPUTED','REFUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY','ANNUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE','CANCELLED','EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "Company" ("id" TEXT NOT NULL,"name_ar" TEXT NOT NULL,"name_en" TEXT NOT NULL,"cr_number" TEXT NOT NULL,"cr_verified" BOOLEAN NOT NULL DEFAULT false,"industry_sector" "IndustrySector" NOT NULL,"city" "SaudiCity" NOT NULL,"saudi_employee_count" INTEGER NOT NULL DEFAULT 0,"total_employee_count" INTEGER NOT NULL DEFAULT 0,"status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Company_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "CompanyUser" ("id" TEXT NOT NULL,"company_id" TEXT NOT NULL,"full_name" TEXT NOT NULL,"email" TEXT NOT NULL,"password_hash" TEXT NOT NULL,"role" "CompanyUserRole" NOT NULL,"is_primary" BOOLEAN NOT NULL DEFAULT false,"status" "UserStatus" NOT NULL DEFAULT 'INVITED',CONSTRAINT "CompanyUser_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Agency" ("id" TEXT NOT NULL,"name_ar" TEXT NOT NULL,"name_en" TEXT NOT NULL,"hrsd_licence" TEXT NOT NULL,"hrsd_verified" BOOLEAN NOT NULL DEFAULT false,"founded_year" INTEGER,"team_size" INTEGER NOT NULL DEFAULT 1,"sector_tags" TEXT[],"client_types" "ClientType"[],"subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',"rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,"total_placements" INTEGER NOT NULL DEFAULT 0,"avg_time_to_fill_days" DOUBLE PRECISION NOT NULL DEFAULT 0,"fill_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,"response_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,"status" "AgencyStatus" NOT NULL DEFAULT 'PENDING',"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Agency_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "AgencyUser" ("id" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"full_name" TEXT NOT NULL,"email" TEXT NOT NULL,"password_hash" TEXT NOT NULL,"role" "AgencyUserRole" NOT NULL,"status" "UserStatus" NOT NULL DEFAULT 'INVITED',CONSTRAINT "AgencyUser_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "JobRequest" ("id" TEXT NOT NULL,"company_id" TEXT NOT NULL,"created_by" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT NOT NULL,"sector" TEXT NOT NULL,"experience_level" "ExperienceLevel" NOT NULL,"salary_min" INTEGER NOT NULL,"salary_max" INTEGER NOT NULL,"saudi_national_required" BOOLEAN NOT NULL DEFAULT false,"headcount" INTEGER NOT NULL DEFAULT 1,"sla_days" INTEGER NOT NULL DEFAULT 30,"budget_type" "BudgetType" NOT NULL,"budget_value" DOUBLE PRECISION NOT NULL,"status" "JobRequestStatus" NOT NULL DEFAULT 'DRAFT',"proposal_deadline" TIMESTAMP(3),"opened_at" TIMESTAMP(3),"closed_at" TIMESTAMP(3),"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "JobRequest_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Proposal" ("id" TEXT NOT NULL,"job_request_id" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"submitted_by" TEXT NOT NULL,"candidate_count_available" INTEGER NOT NULL DEFAULT 0,"fee_type" "FeeType" NOT NULL,"fee_value" DOUBLE PRECISION NOT NULL,"timeline_days" INTEGER NOT NULL,"guarantee_days" INTEGER NOT NULL DEFAULT 90,"notes" TEXT,"status" "ProposalStatus" NOT NULL DEFAULT 'SUBMITTED',"submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"responded_at" TIMESTAMP(3),CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "CandidateSubmission" ("id" TEXT NOT NULL,"proposal_id" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"anon_summary" TEXT,"full_name" TEXT NOT NULL,"email" TEXT NOT NULL,"phone" TEXT,"cv_url" TEXT,"current_title" TEXT,"years_experience" INTEGER NOT NULL DEFAULT 0,"nationality" TEXT,"is_saudi" BOOLEAN NOT NULL DEFAULT false,"current_salary" INTEGER,"expected_salary" INTEGER,"status" "CandidateStatus" NOT NULL DEFAULT 'SUBMITTED',"consent_given" BOOLEAN NOT NULL DEFAULT false,"consent_at" TIMESTAMP(3),"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CandidateSubmission_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Interview" ("id" TEXT NOT NULL,"candidate_submission_id" TEXT NOT NULL,"scheduled_by" TEXT NOT NULL,"interview_type" "InterviewType" NOT NULL,"scheduled_at" TIMESTAMP(3) NOT NULL,"calendar_event_id" TEXT,"outcome" "InterviewOutcome" NOT NULL DEFAULT 'PENDING',"feedback" TEXT,"feedback_submitted_at" TIMESTAMP(3),"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Interview_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Placement" ("id" TEXT NOT NULL,"candidate_submission_id" TEXT NOT NULL,"company_id" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"offer_amount" INTEGER NOT NULL,"offer_made_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"offer_accepted_at" TIMESTAMP(3),"start_date" TIMESTAMP(3),"guarantee_end_date" TIMESTAMP(3),"status" "PlacementStatus" NOT NULL DEFAULT 'OFFER_MADE',CONSTRAINT "Placement_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Invoice" ("id" TEXT NOT NULL,"placement_id" TEXT NOT NULL,"company_id" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"gross_amount" DOUBLE PRECISION NOT NULL,"platform_cut" DOUBLE PRECISION NOT NULL,"agency_payout" DOUBLE PRECISION NOT NULL,"vat_amount" DOUBLE PRECISION NOT NULL,"total_amount" DOUBLE PRECISION NOT NULL,"status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',"due_date" TIMESTAMP(3),"paid_at" TIMESTAMP(3),"payment_ref" TEXT,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Rating" ("id" TEXT NOT NULL,"placement_id" TEXT NOT NULL,"rated_by" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"score_speed" INTEGER NOT NULL,"score_quality" INTEGER NOT NULL,"score_professionalism" INTEGER NOT NULL,"score_outcome" INTEGER NOT NULL,"overall_score" DOUBLE PRECISION NOT NULL,"comment" TEXT,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Rating_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Subscription" ("id" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"tier" "SubscriptionTier" NOT NULL,"billing_cycle" "BillingCycle" NOT NULL,"price_sar" DOUBLE PRECISION NOT NULL,"started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"renews_at" TIMESTAMP(3),"status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "AdminUser" ("id" TEXT NOT NULL,"full_name" TEXT NOT NULL,"email" TEXT NOT NULL,"password_hash" TEXT NOT NULL,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Company_cr_number_key" ON "Company"("cr_number")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CompanyUser_email_key" ON "CompanyUser"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Agency_hrsd_licence_key" ON "Agency"("hrsd_licence")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AgencyUser_email_key" ON "AgencyUser"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Placement_candidate_submission_id_key" ON "Placement"("candidate_submission_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_placement_id_key" ON "Invoice"("placement_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Rating_placement_id_key" ON "Rating"("placement_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email")`,
];

const FOREIGN_KEYS = [
  `ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "AgencyUser" ADD CONSTRAINT "AgencyUser_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "CompanyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_job_request_id_fkey" FOREIGN KEY ("job_request_id") REFERENCES "JobRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "AgencyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "CandidateSubmission" ADD CONSTRAINT "CandidateSubmission_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "CandidateSubmission" ADD CONSTRAINT "CandidateSubmission_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Interview" ADD CONSTRAINT "Interview_candidate_submission_id_fkey" FOREIGN KEY ("candidate_submission_id") REFERENCES "CandidateSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Interview" ADD CONSTRAINT "Interview_scheduled_by_fkey" FOREIGN KEY ("scheduled_by") REFERENCES "CompanyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Placement" ADD CONSTRAINT "Placement_candidate_submission_id_fkey" FOREIGN KEY ("candidate_submission_id") REFERENCES "CandidateSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Placement" ADD CONSTRAINT "Placement_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Placement" ADD CONSTRAINT "Placement_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Rating" ADD CONSTRAINT "Rating_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rated_by_fkey" FOREIGN KEY ("rated_by") REFERENCES "CompanyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Rating" ADD CONSTRAINT "Rating_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
];

const V2_ENUMS = [
  `DO $$ BEGIN CREATE TYPE "AgencyTier" AS ENUM ('FREE','BASIC','PRO','ELITE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "CompanyTier" AS ENUM ('FREE','BASIC','PRO','ENTERPRISE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "SubStatus" AS ENUM ('ACTIVE','CANCELLED','PAST_DUE','TRIALING'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "AppStatus" AS ENUM ('SUBMITTED','UNDER_REVIEW','INTERVIEW_INVITED','REJECTED','OFFER_MADE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

const V2_ALTER_COLUMNS = [
  `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "publicSlug" TEXT`,
  `ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "bio" TEXT`,
  `ALTER TABLE "JobRequest" ADD COLUMN IF NOT EXISTS "sla_alert_sent_at" TIMESTAMP(3)`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "zatcaUUID" TEXT`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "zatcaQrCode" TEXT`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "installmentPlan" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "installmentCount" INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "installmentsPaid" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "escrowHeldAt" TIMESTAMP(3)`,
  `ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "escrowReleasedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "guaranteeExpiresAt" TIMESTAMP(3)`,
  `ALTER TABLE "CandidateSubmission" ADD COLUMN IF NOT EXISTS "linkedCandidateId" TEXT`,
];

const V2_TABLES = [
  `CREATE TABLE IF NOT EXISTS "CandidateUser" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"password_hash" TEXT NOT NULL,"full_name" TEXT NOT NULL,"phone" TEXT,"email_verified" BOOLEAN NOT NULL DEFAULT false,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CandidateUser_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CandidateUser_email_key" ON "CandidateUser"("email")`,
  `CREATE TABLE IF NOT EXISTS "OtpToken" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"token" TEXT NOT NULL,"expires_at" TIMESTAMP(3) NOT NULL,"used" BOOLEAN NOT NULL DEFAULT false,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "PasswordResetToken" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"token" TEXT NOT NULL,"expires_at" TIMESTAMP(3) NOT NULL,"used" BOOLEAN NOT NULL DEFAULT false,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "OrgInvite" ("id" TEXT NOT NULL,"org_type" TEXT NOT NULL,"org_id" TEXT NOT NULL,"email" TEXT NOT NULL,"role" TEXT NOT NULL,"token" TEXT NOT NULL,"expires_at" TIMESTAMP(3) NOT NULL,"accepted_at" TIMESTAMP(3),"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "OrgInvite_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "OrgInvite_token_key" ON "OrgInvite"("token")`,
  `CREATE TABLE IF NOT EXISTS "AgencySubscription" ("id" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"tier" "AgencyTier" NOT NULL DEFAULT 'FREE',"status" "SubStatus" NOT NULL DEFAULT 'ACTIVE',"current_period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"current_period_end" TIMESTAMP(3),"proposals_used_this_month" INTEGER NOT NULL DEFAULT 0,"hyperpay_subscription_id" TEXT,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AgencySubscription_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "CompanySubscription" ("id" TEXT NOT NULL,"company_id" TEXT NOT NULL,"tier" "CompanyTier" NOT NULL DEFAULT 'FREE',"status" "SubStatus" NOT NULL DEFAULT 'ACTIVE',"current_period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"current_period_end" TIMESTAMP(3),"job_requests_used_this_month" INTEGER NOT NULL DEFAULT 0,"hyperpay_subscription_id" TEXT,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "SubscriptionEvent" ("id" TEXT NOT NULL,"entity_type" TEXT NOT NULL,"entity_id" TEXT NOT NULL,"event_type" TEXT NOT NULL,"payload" JSONB,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Notification" ("id" TEXT NOT NULL,"user_type" TEXT NOT NULL,"user_id" TEXT NOT NULL,"type" TEXT NOT NULL,"title" TEXT NOT NULL,"body" TEXT NOT NULL,"link" TEXT,"read" BOOLEAN NOT NULL DEFAULT false,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "MessageThread" ("id" TEXT NOT NULL,"proposal_id" TEXT,"participants" TEXT[],"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Message" ("id" TEXT NOT NULL,"thread_id" TEXT NOT NULL,"sender_type" TEXT NOT NULL,"sender_id" TEXT NOT NULL,"body" TEXT NOT NULL,"attachments" TEXT[],"read_at" TIMESTAMP(3),"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Message_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "MatchScore" ("id" TEXT NOT NULL,"job_request_id" TEXT NOT NULL,"agency_id" TEXT NOT NULL,"score" DOUBLE PRECISION NOT NULL,"breakdown" JSONB,"computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "MatchScore_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MatchScore_job_request_id_agency_id_key" ON "MatchScore"("job_request_id","agency_id")`,
  `CREATE TABLE IF NOT EXISTS "EscrowTransaction" ("id" TEXT NOT NULL,"placement_id" TEXT NOT NULL,"type" TEXT NOT NULL,"amount" DOUBLE PRECISION NOT NULL,"reference" TEXT,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Candidate" ("id" TEXT NOT NULL,"candidate_user_id" TEXT NOT NULL,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Candidate_candidate_user_id_key" ON "Candidate"("candidate_user_id")`,
  `CREATE TABLE IF NOT EXISTS "CandidateProfile" ("id" TEXT NOT NULL,"candidate_id" TEXT NOT NULL,"headline" TEXT,"summary" TEXT,"city" "SaudiCity","years_experience" INTEGER NOT NULL DEFAULT 0,"is_saudi" BOOLEAN NOT NULL DEFAULT false,"cv_url" TEXT,"avatar_url" TEXT,"salary_expectation_min" INTEGER,"salary_expectation_max" INTEGER,"available_from" TIMESTAMP(3),"sectors" TEXT[],"updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CandidateProfile_candidate_id_key" ON "CandidateProfile"("candidate_id")`,
  `CREATE TABLE IF NOT EXISTS "WorkExperience" ("id" TEXT NOT NULL,"candidate_id" TEXT NOT NULL,"title" TEXT NOT NULL,"company" TEXT NOT NULL,"start_date" TIMESTAMP(3) NOT NULL,"end_date" TIMESTAMP(3),"is_current" BOOLEAN NOT NULL DEFAULT false,"description" TEXT,CONSTRAINT "WorkExperience_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Education" ("id" TEXT NOT NULL,"candidate_id" TEXT NOT NULL,"degree" TEXT NOT NULL,"institution" TEXT NOT NULL,"field" TEXT,"graduation_year" INTEGER,CONSTRAINT "Education_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "DirectApplication" ("id" TEXT NOT NULL,"profileId" TEXT NOT NULL,"jobRequestId" TEXT NOT NULL,"coverNote" TEXT,"status" "AppStatus" NOT NULL DEFAULT 'SUBMITTED',"appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "DirectApplication_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "RatingDetail" ("id" TEXT NOT NULL,"rating_id" TEXT NOT NULL,"dimension" TEXT NOT NULL,"score" INTEGER NOT NULL,"comment" TEXT,CONSTRAINT "RatingDetail_pkey" PRIMARY KEY ("id"))`,
];

const V2_FOREIGN_KEYS = [
  `ALTER TABLE "Message" ADD CONSTRAINT "Message_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "WorkExperience" ADD CONSTRAINT "WorkExperience_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "Education" ADD CONSTRAINT "Education_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "RatingDetail" ADD CONSTRAINT "RatingDetail_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run each statement individually — Prisma does not allow multiple statements per call
    for (const sql of ENUMS) {
      await prisma.$executeRawUnsafe(sql);
    }
    for (const sql of TABLES) {
      await prisma.$executeRawUnsafe(sql);
    }
    for (const sql of FOREIGN_KEYS) {
      try { await prisma.$executeRawUnsafe(sql); } catch { /* already exists */ }
    }

    // V2 migrations
    for (const sql of V2_ENUMS) {
      await prisma.$executeRawUnsafe(sql);
    }
    for (const sql of V2_ALTER_COLUMNS) {
      try { await prisma.$executeRawUnsafe(sql); } catch { /* already exists */ }
    }
    for (const sql of V2_TABLES) {
      try { await prisma.$executeRawUnsafe(sql); } catch { /* already exists */ }
    }
    for (const sql of V2_FOREIGN_KEYS) {
      try { await prisma.$executeRawUnsafe(sql); } catch { /* already exists */ }
    }

    const results: string[] = ["✅ V1+V2 Schema created"];

    // Seed Admin
    const adminExists = await prisma.adminUser.findUnique({ where: { email: "admin@talenthunt.sa" } });
    if (!adminExists) {
      await prisma.adminUser.create({
        data: {
          full_name: "مدير النظام",
          email: "admin@talenthunt.sa",
          password_hash: await bcrypt.hash("admin123", 12),
        },
      });
      results.push("✅ Admin user created");
    } else {
      results.push("⏭ Admin already exists");
    }

    // Seed Company 1
    const company1Exists = await prisma.company.findUnique({ where: { cr_number: "1010123456" } });
    let company1;
    if (!company1Exists) {
      company1 = await prisma.company.create({
        data: {
          name_ar: "شركة أفق التقنية",
          name_en: "Horizon Tech Company",
          cr_number: "1010123456",
          cr_verified: true,
          industry_sector: "TECHNOLOGY",
          city: "RIYADH",
          saudi_employee_count: 45,
          total_employee_count: 120,
          status: "ACTIVE",
        },
      });
      await prisma.companyUser.create({
        data: {
          company_id: company1.id,
          full_name: "أحمد الزهراني",
          email: "hr@horizontech.sa",
          password_hash: await bcrypt.hash("company123", 12),
          role: "HR_MANAGER",
          is_primary: true,
          status: "ACTIVE",
        },
      });
      await prisma.companyUser.create({
        data: {
          company_id: company1.id,
          full_name: "سارة المطيري",
          email: "ta@horizontech.sa",
          password_hash: await bcrypt.hash("company123", 12),
          role: "TA_LEAD",
          is_primary: false,
          status: "ACTIVE",
        },
      });
      results.push("✅ Company 1 (Horizon Tech) created");
    } else {
      company1 = company1Exists;
      results.push("⏭ Company 1 already exists");
    }

    // Seed Company 2
    const company2Exists = await prisma.company.findUnique({ where: { cr_number: "1010654321" } });
    if (!company2Exists) {
      const company2 = await prisma.company.create({
        data: {
          name_ar: "مجموعة الخليج المالية",
          name_en: "Gulf Finance Group",
          cr_number: "1010654321",
          cr_verified: true,
          industry_sector: "FINANCE",
          city: "JEDDAH",
          saudi_employee_count: 80,
          total_employee_count: 200,
          status: "ACTIVE",
        },
      });
      await prisma.companyUser.create({
        data: {
          company_id: company2.id,
          full_name: "منى العتيبي",
          email: "ta@gulffinance.sa",
          password_hash: await bcrypt.hash("company123", 12),
          role: "TA_LEAD",
          is_primary: true,
          status: "ACTIVE",
        },
      });
      results.push("✅ Company 2 (Gulf Finance) created");
    } else {
      results.push("⏭ Company 2 already exists");
    }

    // Seed Agency 1
    const agency1Exists = await prisma.agency.findUnique({ where: { hrsd_licence: "HRSD-2021-001234" } });
    let agency1;
    if (!agency1Exists) {
      agency1 = await prisma.agency.create({
        data: {
          name_ar: "وكالة النخبة للتوظيف",
          name_en: "Elite Recruitment Agency",
          hrsd_licence: "HRSD-2021-001234",
          hrsd_verified: true,
          founded_year: 2015,
          team_size: 25,
          sector_tags: ["TECHNOLOGY", "FINANCE", "HEALTHCARE"],
          client_types: ["ENTERPRISE", "SME"],
          subscription_tier: "PRO",
          rating_avg: 4.5,
          total_placements: 87,
          avg_time_to_fill_days: 18.5,
          fill_rate: 0.82,
          response_rate: 0.91,
          status: "ACTIVE",
        },
      });
      await prisma.agencyUser.create({
        data: {
          agency_id: agency1.id,
          full_name: "خالد الحربي",
          email: "owner@eliterecruitment.sa",
          password_hash: await bcrypt.hash("agency123", 12),
          role: "OWNER",
          status: "ACTIVE",
        },
      });
      results.push("✅ Agency 1 (Elite Recruitment) created");
    } else {
      agency1 = agency1Exists;
      results.push("⏭ Agency 1 already exists");
    }

    // Seed Agency 2
    const agency2Exists = await prisma.agency.findUnique({ where: { hrsd_licence: "HRSD-2019-005678" } });
    if (!agency2Exists) {
      const agency2 = await prisma.agency.create({
        data: {
          name_ar: "شركاء النجاح للتوظيف",
          name_en: "Success Partners Recruitment",
          hrsd_licence: "HRSD-2019-005678",
          hrsd_verified: true,
          founded_year: 2019,
          team_size: 12,
          sector_tags: ["FINANCE", "RETAIL", "LOGISTICS"],
          client_types: ["SME", "STARTUP"],
          subscription_tier: "BASIC",
          rating_avg: 4.1,
          total_placements: 43,
          avg_time_to_fill_days: 24.0,
          fill_rate: 0.74,
          response_rate: 0.85,
          status: "ACTIVE",
        },
      });
      await prisma.agencyUser.create({
        data: {
          agency_id: agency2.id,
          full_name: "ريم الشمري",
          email: "recruiter@successpartners.sa",
          password_hash: await bcrypt.hash("agency123", 12),
          role: "RECRUITER",
          status: "ACTIVE",
        },
      });
      results.push("✅ Agency 2 (Success Partners) created");
    } else {
      results.push("⏭ Agency 2 already exists");
    }

    // Seed Agency 3
    const agency3Exists = await prisma.agency.findUnique({ where: { hrsd_licence: "HRSD-2020-009999" } });
    if (!agency3Exists) {
      const agency3 = await prisma.agency.create({
        data: {
          name_ar: "رواد الكفاءات",
          name_en: "Competency Pioneers",
          hrsd_licence: "HRSD-2020-009999",
          hrsd_verified: true,
          founded_year: 2020,
          team_size: 8,
          sector_tags: ["TECHNOLOGY", "EDUCATION", "ENERGY"],
          client_types: ["ENTERPRISE", "STARTUP"],
          subscription_tier: "ELITE",
          rating_avg: 4.8,
          total_placements: 120,
          avg_time_to_fill_days: 14.2,
          fill_rate: 0.89,
          response_rate: 0.95,
          status: "ACTIVE",
        },
      });
      await prisma.agencyUser.create({
        data: {
          agency_id: agency3.id,
          full_name: "فيصل الدوسري",
          email: "owner@competencypioneer.sa",
          password_hash: await bcrypt.hash("agency123", 12),
          role: "OWNER",
          status: "ACTIVE",
        },
      });
      results.push("✅ Agency 3 (Competency Pioneers) created");
    } else {
      results.push("⏭ Agency 3 already exists");
    }

    // Seed Job Request + Proposal + Candidate
    const companyUser = await prisma.companyUser.findUnique({ where: { email: "hr@horizontech.sa" } });
    if (companyUser && company1) {
      const existingJR = await prisma.jobRequest.findFirst({ where: { company_id: company1.id } });
      if (!existingJR) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 14);
        const jr = await prisma.jobRequest.create({
          data: {
            company_id: company1.id,
            created_by: companyUser.id,
            title: "مهندس برمجيات أول",
            description: "نبحث عن مهندس برمجيات أول متمرس في تطوير تطبيقات الويب",
            sector: "TECHNOLOGY",
            experience_level: "SENIOR",
            salary_min: 18000,
            salary_max: 25000,
            saudi_national_required: false,
            headcount: 2,
            sla_days: 21,
            budget_type: "PERCENTAGE_OF_SALARY",
            budget_value: 15,
            status: "OPEN",
            proposal_deadline: deadline,
            opened_at: new Date(),
          },
        });

        if (agency1) {
          const agencyUser = await prisma.agencyUser.findUnique({ where: { email: "owner@eliterecruitment.sa" } });
          if (agencyUser) {
            const proposal = await prisma.proposal.create({
              data: {
                job_request_id: jr.id,
                agency_id: agency1.id,
                submitted_by: agencyUser.id,
                candidate_count_available: 5,
                fee_type: "PERCENTAGE",
                fee_value: 15,
                timeline_days: 14,
                guarantee_days: 90,
                notes: "لدينا مرشحون ممتازون بخبرة في React و Node.js",
                status: "SUBMITTED",
                submitted_at: new Date(),
              },
            });
            await prisma.candidateSubmission.create({
              data: {
                proposal_id: proposal.id,
                agency_id: agency1.id,
                anon_summary: "مهندس برمجيات بخبرة 7 سنوات في تطوير الويب، متخصص في React وNode.js",
                full_name: "محمد العمري",
                email: "m.omari@example.com",
                phone: "+966501234567",
                cv_url: "https://example.com/cv.pdf",
                current_title: "مهندس برمجيات",
                years_experience: 7,
                nationality: "سعودي",
                is_saudi: true,
                current_salary: 18000,
                expected_salary: 22000,
                status: "SUBMITTED",
                consent_given: true,
                consent_at: new Date(),
              },
            });
            results.push("✅ Sample job request, proposal & candidate created");
          }
        }
      } else {
        results.push("⏭ Job request already exists");
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database setup complete!",
      results,
      credentials: {
        admin: { email: "admin@talenthunt.sa", password: "admin123" },
        company: { email: "hr@horizontech.sa", password: "company123" },
        agency: { email: "owner@eliterecruitment.sa", password: "agency123" },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
