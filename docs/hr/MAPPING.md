# HR Phase 1 — Codebase Mapping (Sprint 0)

Resolves every placeholder name used in the HR Phase 1 Spec against the real Prisma models,
API helpers, and auth conventions in this codebase.

---

## 1. Auth & Session

| Spec placeholder | Real value | Source |
|---|---|---|
| `currentUser.id` | `(session.user as AuthUser).id` → `CompanyUser.id` | `src/lib/auth.ts` |
| `currentUser.entityId` | `(session.user as AuthUser).entityId` → `Company.id` | `src/lib/auth.ts` |
| `currentUser.role` | `(session.user as AuthUser).role` → `CompanyUserRole` enum | `src/lib/auth.ts` |
| `userType === "COMPANY"` | `(session.user as AuthUser).userType === "COMPANY"` | `src/lib/auth.ts` |

**`AuthUser` interface** (`src/lib/auth.ts`):
```ts
{ id: string; email: string; name: string; userType: UserType; role?: string; entityId?: string }
```

---

## 2. Prisma Models

### Existing models (use as-is or extend)

| Spec name | Real Prisma model | Key fields |
|---|---|---|
| `Company` | `Company` | `id`, `name_ar`, `name_en`, `city`, `status` |
| `User` / `CompanyMember` | `CompanyUser` | `id`, `company_id`, `email`, `full_name`, `role: CompanyUserRole`, `status` |
| `Job` / `JobPost` | `JobRequest` | `id`, `company_id`, `title`, `description`, `sector`, `experience_level`, `salary_min/max`, `headcount`, `status: JobRequestStatus`, `proposal_deadline` |
| `CandidateApplication` | `DirectApplication` | `id`, `profileId`, `jobRequestId`, `coverNote`, `status: AppStatus`, `appliedAt` |
| `AgencySubmission` | `Proposal` | `id`, `job_request_id`, `agency_id`, `status: ProposalStatus` |
| `Interview` | `Interview` | `id`, `candidate_submission_id`, `scheduled_by (CompanyUser)`, `interview_type: InterviewType`, `scheduled_at`, `outcome: InterviewOutcome`, `feedback` |
| `Notification` | `Notification` | `id`, `userId`, `userType`, `event`, `title`, `body`, `referenceId`, `referenceType`, `channel`, `readAt`, `deliveredAt` |
| `AuditLog` | `AuditLog` | `id`, `adminId`, `action`, `targetId`, `targetType`, `metadata`, `ip`, `createdAt` — **needs extension for HR actor/context** |

### Models that must be CREATED (Sprint 1 migration)

| Spec name | Migration model name | Notes |
|---|---|---|
| `HrSettings` | `HrSettings` | Per-company HR config; 1:1 with `Company` |
| `HrMembership` | `HrMembership` | Maps `CompanyUser` → HR role (HR_MANAGER, RECRUITER, etc.) |
| `Department` | `Department` | Org-chart unit; belongs to `Company` |
| `Grade` | `Grade` | Compensation band; belongs to `Company` |
| `Position` | `Position` | Role template; belongs to `Department` + `Grade` |
| `HeadcountPlan` | `HeadcountPlan` | Budget request for headcount; links to `JobRequest` |
| `ApprovalPolicy` | `ApprovalPolicy` | Workflow definition (steps, approvers) per company |
| `ApprovalRequest` | `ApprovalRequest` | Instance of a policy run for a specific entity |
| `OfferLetter` | `OfferLetter` | Offer doc linked to `DirectApplication`; PDF URL, status |
| `OnboardingTask` | `OnboardingTask` | Checklist item template |
| `OnboardingPlan` | `OnboardingPlan` | Instance for a placed candidate |
| `OnboardingTaskItem` | `OnboardingTaskItem` | Join: plan × task with status |
| `DomainEvent` | `DomainEvent` | Outbox table for cross-domain side effects (does NOT exist yet) |
| `Contract` | `Contract` | Employment contract; linked to `OfferLetter` |
| `EmployeeProfile` | `EmployeeProfile` | Post-hire record; linked to `CandidateProfile` + `Company` |

---

## 3. Enums

### Existing enums (extend or reuse)

| Spec name | Real Prisma enum | Values |
|---|---|---|
| `CompanyUserRole` | `CompanyUserRole` | `ADMIN`, `TA_LEAD`, `BU_MANAGER`, `HR_MANAGER` |
| `JobStatus` | `JobRequestStatus` | `DRAFT`, `OPEN`, `CLOSED`, `FILLED` |
| `ApplicationStatus` | `AppStatus` | `SUBMITTED`, `UNDER_REVIEW`, `INTERVIEW_INVITED`, `REJECTED`, `OFFER_MADE` |
| `InterviewType` | `InterviewType` | `PHONE`, `VIDEO`, `ONSITE`, `TECHNICAL` |
| `InterviewOutcome` | `InterviewOutcome` | `PENDING`, `PASSED`, `FAILED`, `NO_SHOW` |

### Enums to CREATE

| Spec name | Migration enum | Suggested values |
|---|---|---|
| `HrRole` | `HrRole` | `HR_MANAGER`, `HR_RECRUITER`, `HR_COORDINATOR`, `HR_ADMIN` |
| `ApprovalStatus` | `ApprovalStatus` | `PENDING`, `APPROVED`, `REJECTED`, `ESCALATED` |
| `OfferStatus` | `OfferStatus` | `DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `REVOKED` |
| `OnboardingStatus` | `OnboardingStatus` | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE` |
| `ContractType` | `ContractType` | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP` |
| `DomainEventStatus` | `DomainEventStatus` | `PENDING`, `PROCESSED`, `FAILED` |

---

## 4. Helper Functions

### Email (`src/lib/email.ts`)
```ts
sendEmail(to: string, templateId: string, dynamicData: Record<string, unknown>): Promise<void>
// Provider: SendGrid. Falls back silently if SENDGRID_API_KEY not set.
```
New templates to add to `EMAIL_TEMPLATES`:
- `OFFER_SENT`, `OFFER_ACCEPTED`, `OFFER_DECLINED`, `ONBOARDING_TASK_DUE`, `APPROVAL_REQUESTED`, `APPROVAL_DECIDED`

### Real-time (`src/lib/pusher.ts`)
```ts
triggerPusher(channel: string, event: string, data: Record<string, unknown>): Promise<void>
// Returns silently if PUSHER_APP_ID not set (non-fatal).
```
HR channel convention: `private-company-{companyId}-hr`

### Notifications (`src/lib/notifications.ts`)
```ts
createNotification({ userId, userType, event, title, body, referenceId, referenceType, channel }): Promise<Notification>
```
New `event` values needed: `offer_sent`, `offer_accepted`, `approval_needed`, `onboarding_task_due`

### Permissions (`src/lib/permissions.ts`)
```ts
canCompany(role: string, action: string): boolean
```
New actions to add to `COMPANY_PERMISSIONS`:
- `hr:activate`, `hr:manage_settings`, `hr:manage_team`
- `offer:create`, `offer:send`, `offer:revoke`
- `onboarding:manage`, `approval:approve`

---

## 5. Locale (`src/lib/locale.shared.ts`)

All HR UI strings go into the existing `dict` under `"hr.*"` namespace prefix.
Both `ar` and `en` entries required for every key.

---

## 6. File Storage

**Not yet configured.** Spec requires PDF upload for offer letters and contracts.
Options in order of preference for Vercel Hobby:
1. **Vercel Blob** (`@vercel/blob`) — easiest, native Vercel integration
2. **Supabase Storage** — if already using Supabase for anything
3. **Cloudinary** — free tier, good for documents

Decision needed before Sprint 3 (OfferLetter PDF generation).

---

## 7. Sensitive Data (PDPL)

National ID / Iqama numbers must be stored AES-256-GCM encrypted.
Encryption helper does **not exist yet** — must create `src/lib/crypto.ts` before Sprint 4.

```ts
// Target API:
encrypt(plaintext: string): { iv: string; ciphertext: string }
decrypt(iv: string, ciphertext: string): string
// Key: process.env.ENCRYPTION_KEY (32-byte hex)
```

---

## 8. Cron / Scheduled Jobs

Vercel Hobby plan: **maximum one cron execution per day** (`0 0 * * *`).
Spec's hourly/daily crons (SLA reminders, onboarding nudges) must be:
- Collapsed into a single daily digest job, OR
- Upgrade to Vercel Pro for fine-grained cron schedules.

Cron handler location: `src/app/api/cron/` (existing pattern)

---

## 9. Key Invariants (from existing bugs)

- `user.entityId` = `Company.id` (NOT `CompanyUser.id`)
- Every ownership check: `record.company_id === user.entityId`
- Never use `NEXTAUTH_URL` for internal fetches in server components — use Prisma directly
- Prisma: cannot mix `include` and `select` on the same relation level
- `datetime-local` inputs must have `dir="ltr"` inside RTL pages

---

*Sprint 0 complete. Ready for Sprint 1: schema migration.*
