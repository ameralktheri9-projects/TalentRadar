export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SECRET = process.env.SETUP_SECRET || "talenthunt-setup-2026";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Test connection
    await prisma.$connect();

    const results: string[] = [];

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

    // Seed Job Request
    const companyUser = await prisma.companyUser.findUnique({ where: { email: "hr@horizontech.sa" } });
    if (companyUser) {
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

        // Seed Proposal
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

            // Seed Candidate
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

    await prisma.$disconnect();

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
