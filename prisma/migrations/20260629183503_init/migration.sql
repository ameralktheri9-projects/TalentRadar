-- CreateEnum
CREATE TYPE "IndustrySector" AS ENUM ('TECHNOLOGY', 'HEALTHCARE', 'FINANCE', 'EDUCATION', 'RETAIL', 'MANUFACTURING', 'CONSTRUCTION', 'ENERGY', 'LOGISTICS', 'HOSPITALITY', 'MEDIA', 'GOVERNMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SaudiCity" AS ENUM ('RIYADH', 'JEDDAH', 'MECCA', 'MEDINA', 'DAMMAM', 'KHOBAR', 'DHAHRAN', 'TABUK', 'ABHA', 'TAIF', 'NAJRAN', 'JIZAN', 'HAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CompanyUserRole" AS ENUM ('HR_MANAGER', 'TA_LEAD', 'BU_MANAGER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('ENTERPRISE', 'SME', 'STARTUP');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "AgencyStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgencyUserRole" AS ENUM ('OWNER', 'RECRUITER', 'FINANCE');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'DIRECTOR', 'C_SUITE');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('PERCENTAGE_OF_SALARY', 'FLAT_FEE');

-- CreateEnum
CREATE TYPE "JobRequestStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_MADE', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE', 'VIDEO', 'ONSITE');

-- CreateEnum
CREATE TYPE "InterviewOutcome" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('OFFER_MADE', 'ACCEPTED', 'DECLINED', 'STARTED', 'GUARANTEE_BREACH', 'REPLACED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "cr_number" TEXT NOT NULL,
    "cr_verified" BOOLEAN NOT NULL DEFAULT false,
    "industry_sector" "IndustrySector" NOT NULL,
    "city" "SaudiCity" NOT NULL,
    "saudi_employee_count" INTEGER NOT NULL DEFAULT 0,
    "total_employee_count" INTEGER NOT NULL DEFAULT 0,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyUser" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "CompanyUserRole" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',

    CONSTRAINT "CompanyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "hrsd_licence" TEXT NOT NULL,
    "hrsd_verified" BOOLEAN NOT NULL DEFAULT false,
    "founded_year" INTEGER,
    "team_size" INTEGER NOT NULL DEFAULT 1,
    "sector_tags" TEXT[],
    "client_types" "ClientType"[],
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_placements" INTEGER NOT NULL DEFAULT 0,
    "avg_time_to_fill_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fill_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "response_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "AgencyStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyUser" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "AgencyUserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',

    CONSTRAINT "AgencyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequest" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "experience_level" "ExperienceLevel" NOT NULL,
    "salary_min" INTEGER NOT NULL,
    "salary_max" INTEGER NOT NULL,
    "saudi_national_required" BOOLEAN NOT NULL DEFAULT false,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "sla_days" INTEGER NOT NULL DEFAULT 30,
    "budget_type" "BudgetType" NOT NULL,
    "budget_value" DOUBLE PRECISION NOT NULL,
    "status" "JobRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "proposal_deadline" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "job_request_id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "candidate_count_available" INTEGER NOT NULL DEFAULT 0,
    "fee_type" "FeeType" NOT NULL,
    "fee_value" DOUBLE PRECISION NOT NULL,
    "timeline_days" INTEGER NOT NULL,
    "guarantee_days" INTEGER NOT NULL DEFAULT 90,
    "notes" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateSubmission" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "anon_summary" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "cv_url" TEXT,
    "current_title" TEXT,
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "nationality" TEXT,
    "is_saudi" BOOLEAN NOT NULL DEFAULT false,
    "current_salary" INTEGER,
    "expected_salary" INTEGER,
    "status" "CandidateStatus" NOT NULL DEFAULT 'SUBMITTED',
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "candidate_submission_id" TEXT NOT NULL,
    "scheduled_by" TEXT NOT NULL,
    "interview_type" "InterviewType" NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "calendar_event_id" TEXT,
    "outcome" "InterviewOutcome" NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "feedback_submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "candidate_submission_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "offer_amount" INTEGER NOT NULL,
    "offer_made_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offer_accepted_at" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "guarantee_end_date" TIMESTAMP(3),
    "status" "PlacementStatus" NOT NULL DEFAULT 'OFFER_MADE',

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "gross_amount" DOUBLE PRECISION NOT NULL,
    "platform_cut" DOUBLE PRECISION NOT NULL,
    "agency_payout" DOUBLE PRECISION NOT NULL,
    "vat_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "payment_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "placement_id" TEXT NOT NULL,
    "rated_by" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "score_speed" INTEGER NOT NULL,
    "score_quality" INTEGER NOT NULL,
    "score_professionalism" INTEGER NOT NULL,
    "score_outcome" INTEGER NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "price_sar" DOUBLE PRECISION NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renews_at" TIMESTAMP(3),
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_cr_number_key" ON "Company"("cr_number");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUser_email_key" ON "CompanyUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_hrsd_licence_key" ON "Agency"("hrsd_licence");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyUser_email_key" ON "AgencyUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_candidate_submission_id_key" ON "Placement"("candidate_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_placement_id_key" ON "Invoice"("placement_id");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_placement_id_key" ON "Rating"("placement_id");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyUser" ADD CONSTRAINT "AgencyUser_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequest" ADD CONSTRAINT "JobRequest_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "CompanyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_job_request_id_fkey" FOREIGN KEY ("job_request_id") REFERENCES "JobRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "AgencyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSubmission" ADD CONSTRAINT "CandidateSubmission_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSubmission" ADD CONSTRAINT "CandidateSubmission_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_candidate_submission_id_fkey" FOREIGN KEY ("candidate_submission_id") REFERENCES "CandidateSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_scheduled_by_fkey" FOREIGN KEY ("scheduled_by") REFERENCES "CompanyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_candidate_submission_id_fkey" FOREIGN KEY ("candidate_submission_id") REFERENCES "CandidateSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "Placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_rated_by_fkey" FOREIGN KEY ("rated_by") REFERENCES "CompanyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
