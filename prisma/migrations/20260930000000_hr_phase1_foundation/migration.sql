-- HR Phase 1: Foundation Migration
-- Adds ADMIN to CompanyUserRole, extends AuditLog, and creates all HR models.

-- AlterEnum: add ADMIN value to CompanyUserRole
ALTER TYPE "CompanyUserRole" ADD VALUE IF NOT EXISTS 'ADMIN';

-- AlterTable: extend AuditLog with HR actor fields
ALTER TABLE "AuditLog"
  ALTER COLUMN "adminId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "actorId"   TEXT,
  ADD COLUMN IF NOT EXISTS "actorType" TEXT;

-- AlterTable: add jobRequest relation on DirectApplication
-- (column already exists via init; only FK is new if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'DirectApplication_jobRequestId_fkey'
  ) THEN
    ALTER TABLE "DirectApplication"
      ADD CONSTRAINT "DirectApplication_jobRequestId_fkey"
      FOREIGN KEY ("jobRequestId") REFERENCES "JobRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "HrRole" AS ENUM ('HR_ADMIN', 'HR_MANAGER', 'HR_RECRUITER', 'HR_COORDINATOR');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "DomainEventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable: HrSettings
CREATE TABLE "HrSettings" (
    "id"                TEXT NOT NULL,
    "companyId"         TEXT NOT NULL,
    "isActive"          BOOLEAN NOT NULL DEFAULT false,
    "defaultLocale"     TEXT NOT NULL DEFAULT 'ar',
    "offerValidityDays" INTEGER NOT NULL DEFAULT 7,
    "requireApproval"   BOOLEAN NOT NULL DEFAULT false,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HrSettings_companyId_key" ON "HrSettings"("companyId");

-- CreateTable: HrMembership
CREATE TABLE "HrMembership" (
    "id"        TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "hrRole"    "HrRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HrMembership_userId_key" ON "HrMembership"("userId");
CREATE INDEX "HrMembership_companyId_idx" ON "HrMembership"("companyId");

-- CreateTable: Department
CREATE TABLE "Department" (
    "id"        TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nameAr"    TEXT NOT NULL,
    "nameEn"    TEXT,
    "parentId"  TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Department_companyId_idx" ON "Department"("companyId");

-- CreateTable: Grade
CREATE TABLE "Grade" (
    "id"        TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "nameAr"    TEXT NOT NULL,
    "nameEn"    TEXT,
    "salaryMin" INTEGER NOT NULL,
    "salaryMax" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Grade_companyId_code_key" ON "Grade"("companyId", "code");

-- CreateTable: Position
CREATE TABLE "Position" (
    "id"           TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "gradeId"      TEXT,
    "titleAr"      TEXT NOT NULL,
    "titleEn"      TEXT,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HeadcountPlan
CREATE TABLE "HeadcountPlan" (
    "id"            TEXT NOT NULL,
    "jobRequestId"  TEXT NOT NULL,
    "positionId"    TEXT,
    "requestedBy"   TEXT NOT NULL,
    "headcount"     INTEGER NOT NULL DEFAULT 1,
    "justification" TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeadcountPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HeadcountPlan_jobRequestId_key" ON "HeadcountPlan"("jobRequestId");

-- CreateTable: ApprovalPolicy
CREATE TABLE "ApprovalPolicy" (
    "id"         TEXT NOT NULL,
    "companyId"  TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "steps"      JSONB NOT NULL,
    "isActive"   BOOLEAN NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalPolicy_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApprovalPolicy_companyId_entityType_idx" ON "ApprovalPolicy"("companyId", "entityType");

-- CreateTable: ApprovalRequest
CREATE TABLE "ApprovalRequest" (
    "id"              TEXT NOT NULL,
    "policyId"        TEXT NOT NULL,
    "headcountPlanId" TEXT,
    "offerLetterId"   TEXT,
    "currentStep"     INTEGER NOT NULL DEFAULT 1,
    "status"          "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt"      TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ApprovalAction
CREATE TABLE "ApprovalAction" (
    "id"        TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actorId"   TEXT NOT NULL,
    "step"      INTEGER NOT NULL,
    "decision"  "ApprovalStatus" NOT NULL,
    "comment"   TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OfferLetter
CREATE TABLE "OfferLetter" (
    "id"            TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "jobRequestId"  TEXT NOT NULL,
    "issuedBy"      TEXT NOT NULL,
    "status"        "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "contractType"  "ContractType" NOT NULL DEFAULT 'FULL_TIME',
    "offeredSalary" INTEGER NOT NULL,
    "startDate"     TIMESTAMP(3),
    "expiresAt"     TIMESTAMP(3),
    "pdfUrl"        TEXT,
    "notes"         TEXT,
    "sentAt"        TIMESTAMP(3),
    "respondedAt"   TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferLetter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OfferLetter_applicationId_key" ON "OfferLetter"("applicationId");

-- CreateTable: Contract
CREATE TABLE "Contract" (
    "id"                  TEXT NOT NULL,
    "offerLetterId"       TEXT NOT NULL,
    "contractType"        "ContractType" NOT NULL,
    "startDate"           TIMESTAMP(3) NOT NULL,
    "endDate"             TIMESTAMP(3),
    "pdfUrl"              TEXT,
    "signedByCandidate"   BOOLEAN NOT NULL DEFAULT false,
    "signedAt"            TIMESTAMP(3),
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contract_offerLetterId_key" ON "Contract"("offerLetterId");

-- CreateTable: OnboardingTask (template)
CREATE TABLE "OnboardingTask" (
    "id"           TEXT NOT NULL,
    "companyId"    TEXT NOT NULL,
    "titleAr"      TEXT NOT NULL,
    "titleEn"      TEXT,
    "category"     TEXT NOT NULL,
    "dueDayOffset" INTEGER NOT NULL DEFAULT 0,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OnboardingTask_companyId_idx" ON "OnboardingTask"("companyId");

-- CreateTable: OnboardingPlan
CREATE TABLE "OnboardingPlan" (
    "id"            TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "startDate"     TIMESTAMP(3) NOT NULL,
    "status"        "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt"   TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnboardingPlan_applicationId_key" ON "OnboardingPlan"("applicationId");

-- CreateTable: OnboardingTaskItem
CREATE TABLE "OnboardingTaskItem" (
    "id"          TEXT NOT NULL,
    "planId"      TEXT NOT NULL,
    "taskId"      TEXT NOT NULL,
    "status"      "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "dueAt"       TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes"       TEXT,

    CONSTRAINT "OnboardingTaskItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnboardingTaskItem_planId_taskId_key" ON "OnboardingTaskItem"("planId", "taskId");

-- CreateTable: EmployeeProfile
CREATE TABLE "EmployeeProfile" (
    "id"                  TEXT NOT NULL,
    "companyId"           TEXT NOT NULL,
    "candidateProfileId"  TEXT,
    "nationalIdEncrypted" TEXT,
    "jobTitle"            TEXT,
    "departmentId"        TEXT,
    "gradeId"             TEXT,
    "startDate"           TIMESTAMP(3),
    "employeeNumber"      TEXT,
    "isActive"            BOOLEAN NOT NULL DEFAULT true,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmployeeProfile_companyId_idx" ON "EmployeeProfile"("companyId");

-- CreateTable: DomainEvent (outbox)
CREATE TABLE "DomainEvent" (
    "id"          TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregate"   TEXT NOT NULL,
    "eventType"   TEXT NOT NULL,
    "payload"     JSONB NOT NULL,
    "status"      "DomainEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts"    INTEGER NOT NULL DEFAULT 0,
    "lastError"   TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DomainEvent_status_createdAt_idx" ON "DomainEvent"("status", "createdAt");

-- AddForeignKey constraints
ALTER TABLE "HrSettings"
  ADD CONSTRAINT "HrSettings_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HrMembership"
  ADD CONSTRAINT "HrMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "CompanyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Department"
  ADD CONSTRAINT "Department_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Department"
  ADD CONSTRAINT "Department_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Grade"
  ADD CONSTRAINT "Grade_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Position"
  ADD CONSTRAINT "Position_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Position"
  ADD CONSTRAINT "Position_gradeId_fkey"
  FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HeadcountPlan"
  ADD CONSTRAINT "HeadcountPlan_jobRequestId_fkey"
  FOREIGN KEY ("jobRequestId") REFERENCES "JobRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HeadcountPlan"
  ADD CONSTRAINT "HeadcountPlan_positionId_fkey"
  FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApprovalPolicy"
  ADD CONSTRAINT "ApprovalPolicy_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApprovalRequest"
  ADD CONSTRAINT "ApprovalRequest_policyId_fkey"
  FOREIGN KEY ("policyId") REFERENCES "ApprovalPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApprovalRequest"
  ADD CONSTRAINT "ApprovalRequest_headcountPlanId_fkey"
  FOREIGN KEY ("headcountPlanId") REFERENCES "HeadcountPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApprovalRequest"
  ADD CONSTRAINT "ApprovalRequest_offerLetterId_fkey"
  FOREIGN KEY ("offerLetterId") REFERENCES "OfferLetter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApprovalAction"
  ADD CONSTRAINT "ApprovalAction_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApprovalAction"
  ADD CONSTRAINT "ApprovalAction_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "CompanyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OfferLetter"
  ADD CONSTRAINT "OfferLetter_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "DirectApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OfferLetter"
  ADD CONSTRAINT "OfferLetter_jobRequestId_fkey"
  FOREIGN KEY ("jobRequestId") REFERENCES "JobRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Contract"
  ADD CONSTRAINT "Contract_offerLetterId_fkey"
  FOREIGN KEY ("offerLetterId") REFERENCES "OfferLetter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OnboardingPlan"
  ADD CONSTRAINT "OnboardingPlan_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "DirectApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OnboardingTaskItem"
  ADD CONSTRAINT "OnboardingTaskItem_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "OnboardingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OnboardingTaskItem"
  ADD CONSTRAINT "OnboardingTaskItem_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "OnboardingTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EmployeeProfile"
  ADD CONSTRAINT "EmployeeProfile_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
