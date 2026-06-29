import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@talenthunt.sa" },
    update: {},
    create: {
      full_name: "مدير النظام",
      email: "admin@talenthunt.sa",
      password_hash: adminHash,
    },
  });
  console.log("Created admin:", admin.email);

  // Company 1
  const company1Hash = await bcrypt.hash("company123", 12);
  const company1 = await prisma.company.upsert({
    where: { cr_number: "1010123456" },
    update: {},
    create: {
      name_ar: "شركة الأفق للتقنية",
      name_en: "Horizon Tech Company",
      cr_number: "1010123456",
      cr_verified: true,
      industry_sector: "TECHNOLOGY",
      city: "RIYADH",
      saudi_employee_count: 120,
      total_employee_count: 250,
      status: "ACTIVE",
    },
  });

  await prisma.companyUser.upsert({
    where: { email: "hr@horizontech.sa" },
    update: {},
    create: {
      company_id: company1.id,
      full_name: "نورة الأحمدي",
      email: "hr@horizontech.sa",
      password_hash: company1Hash,
      role: "HR_MANAGER",
      is_primary: true,
      status: "ACTIVE",
    },
  });
  console.log("Created company 1:", company1.name_en);

  // Company 2
  const company2Hash = await bcrypt.hash("company123", 12);
  const company2 = await prisma.company.upsert({
    where: { cr_number: "4030567890" },
    update: {},
    create: {
      name_ar: "مجموعة الخليج للمال",
      name_en: "Gulf Finance Group",
      cr_number: "4030567890",
      cr_verified: true,
      industry_sector: "FINANCE",
      city: "JEDDAH",
      saudi_employee_count: 80,
      total_employee_count: 150,
      status: "ACTIVE",
    },
  });

  const company2User = await prisma.companyUser.upsert({
    where: { email: "ta@gulffinance.sa" },
    update: {},
    create: {
      company_id: company2.id,
      full_name: "عبدالله المنصور",
      email: "ta@gulffinance.sa",
      password_hash: company2Hash,
      role: "TA_LEAD",
      is_primary: true,
      status: "ACTIVE",
    },
  });
  console.log("Created company 2:", company2.name_en);

  // Agency 1 - Elite
  const agency1Hash = await bcrypt.hash("agency123", 12);
  const agency1 = await prisma.agency.upsert({
    where: { hrsd_licence: "HRSD-2015-0001" },
    update: {},
    create: {
      name_ar: "وكالة النخبة للتوظيف",
      name_en: "Elite Recruitment Agency",
      hrsd_licence: "HRSD-2015-0001",
      hrsd_verified: true,
      founded_year: 2015,
      team_size: 25,
      sector_tags: ["Technology", "Finance", "Healthcare"],
      client_types: ["ENTERPRISE", "SME"],
      subscription_tier: "ELITE",
      rating_avg: 4.8,
      total_placements: 342,
      avg_time_to_fill_days: 21.5,
      fill_rate: 0.92,
      response_rate: 0.98,
      status: "ACTIVE",
    },
  });

  await prisma.agencyUser.upsert({
    where: { email: "owner@eliterecruitment.sa" },
    update: {},
    create: {
      agency_id: agency1.id,
      full_name: "خالد العتيبي",
      email: "owner@eliterecruitment.sa",
      password_hash: agency1Hash,
      role: "OWNER",
      status: "ACTIVE",
    },
  });
  console.log("Created agency 1:", agency1.name_en);

  // Agency 2 - Pro
  const agency2Hash = await bcrypt.hash("agency123", 12);
  const agency2 = await prisma.agency.upsert({
    where: { hrsd_licence: "HRSD-2018-0042" },
    update: {},
    create: {
      name_ar: "شركاء النجاح للاستقطاب",
      name_en: "Success Partners Recruitment",
      hrsd_licence: "HRSD-2018-0042",
      hrsd_verified: true,
      founded_year: 2018,
      team_size: 12,
      sector_tags: ["Retail", "Hospitality", "Logistics"],
      client_types: ["SME", "STARTUP"],
      subscription_tier: "PRO",
      rating_avg: 4.3,
      total_placements: 187,
      avg_time_to_fill_days: 28.0,
      fill_rate: 0.85,
      response_rate: 0.91,
      status: "ACTIVE",
    },
  });

  const agency2User = await prisma.agencyUser.upsert({
    where: { email: "recruiter@successpartners.sa" },
    update: {},
    create: {
      agency_id: agency2.id,
      full_name: "سارة القحطاني",
      email: "recruiter@successpartners.sa",
      password_hash: agency2Hash,
      role: "RECRUITER",
      status: "ACTIVE",
    },
  });
  console.log("Created agency 2:", agency2.name_en);

  // Agency 3 - Basic
  const agency3Hash = await bcrypt.hash("agency123", 12);
  const agency3 = await prisma.agency.upsert({
    where: { hrsd_licence: "HRSD-2021-0155" },
    update: {},
    create: {
      name_ar: "رواد الكفاءات",
      name_en: "Competency Pioneers",
      hrsd_licence: "HRSD-2021-0155",
      hrsd_verified: true,
      founded_year: 2021,
      team_size: 5,
      sector_tags: ["Education", "Government"],
      client_types: ["ENTERPRISE"],
      subscription_tier: "BASIC",
      rating_avg: 3.9,
      total_placements: 43,
      avg_time_to_fill_days: 35.0,
      fill_rate: 0.72,
      response_rate: 0.80,
      status: "ACTIVE",
    },
  });

  await prisma.agencyUser.upsert({
    where: { email: "owner@competencypioneer.sa" },
    update: {},
    create: {
      agency_id: agency3.id,
      full_name: "محمد الزهراني",
      email: "owner@competencypioneer.sa",
      password_hash: agency3Hash,
      role: "OWNER",
      status: "ACTIVE",
    },
  });
  console.log("Created agency 3:", agency3.name_en);

  // Job Request 1 - OPEN
  const jobRequest1 = await prisma.jobRequest.create({
    data: {
      company_id: company1.id,
      created_by: (await prisma.companyUser.findFirst({ where: { company_id: company1.id } }))!.id,
      title: "مهندس برمجيات أول",
      description: "نبحث عن مهندس برمجيات متمرس لقيادة تطوير منتجاتنا الرئيسية باستخدام React و Node.js. يجب أن يكون لديك خبرة لا تقل عن 5 سنوات في تطوير تطبيقات الويب.",
      sector: "Technology",
      experience_level: "SENIOR",
      salary_min: 18000,
      salary_max: 25000,
      saudi_national_required: true,
      headcount: 2,
      sla_days: 30,
      budget_type: "PERCENTAGE_OF_SALARY",
      budget_value: 15,
      status: "OPEN",
      proposal_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      opened_at: new Date(),
    },
  });
  console.log("Created job request 1:", jobRequest1.title);

  // Job Request 2 - DRAFT
  const jobRequest2 = await prisma.jobRequest.create({
    data: {
      company_id: company2.id,
      created_by: company2User.id,
      title: "محلل مالي",
      description: "نحتاج محللاً مالياً لدعم قسم المالية في تحليل البيانات وإعداد التقارير المالية الشهرية والسنوية.",
      sector: "Finance",
      experience_level: "MID",
      salary_min: 12000,
      salary_max: 18000,
      saudi_national_required: false,
      headcount: 1,
      sla_days: 21,
      budget_type: "FLAT_FEE",
      budget_value: 8000,
      status: "DRAFT",
    },
  });
  console.log("Created job request 2:", jobRequest2.title);

  // Sample Proposal
  const proposal1 = await prisma.proposal.create({
    data: {
      job_request_id: jobRequest1.id,
      agency_id: agency1.id,
      submitted_by: (await prisma.agencyUser.findFirst({ where: { agency_id: agency1.id } }))!.id,
      candidate_count_available: 3,
      fee_type: "PERCENTAGE",
      fee_value: 12,
      timeline_days: 20,
      guarantee_days: 90,
      notes: "لدينا ثلاثة مرشحين مؤهلين جاهزون للمقابلة هذا الأسبوع",
      status: "SUBMITTED",
    },
  });
  console.log("Created proposal 1");

  // Sample Candidate Submission
  await prisma.candidateSubmission.create({
    data: {
      proposal_id: proposal1.id,
      agency_id: agency1.id,
      anon_summary: "مهندس برمجيات سعودي الجنسية، خبرة 7 سنوات في React و Node.js، حاصل على درجة البكالوريوس من KFUPM",
      full_name: "أحمد البشري",
      email: "ahmed.b@example.com",
      phone: "+966501234567",
      current_title: "مهندس برمجيات",
      years_experience: 7,
      nationality: "سعودي",
      is_saudi: true,
      current_salary: 20000,
      expected_salary: 23000,
      status: "SUBMITTED",
      consent_given: true,
      consent_at: new Date(),
    },
  });
  console.log("Created sample candidate");

  // Subscription for agency 1
  await prisma.subscription.create({
    data: {
      agency_id: agency1.id,
      tier: "ELITE",
      billing_cycle: "ANNUAL",
      price_sar: 24000,
      started_at: new Date(),
      renews_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });

  console.log("\nSeed completed successfully!");
  console.log("\nTest Credentials:");
  console.log("Admin:   admin@talenthunt.sa / admin123");
  console.log("Company: hr@horizontech.sa / company123");
  console.log("Company: ta@gulffinance.sa / company123");
  console.log("Agency:  owner@eliterecruitment.sa / agency123");
  console.log("Agency:  recruiter@successpartners.sa / agency123");
  console.log("Agency:  owner@competencypioneer.sa / agency123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
