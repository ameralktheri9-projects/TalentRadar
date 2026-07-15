import { openai, OPENAI_MODEL } from './openai'
import { prisma } from './prisma'

export async function generateCandidateSummary(applicationId: string): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return

  const app = await prisma.directApplication.findUnique({
    where: { id: applicationId },
    include: {
      profile: { include: { experiences: true, education: true } },
    },
  })
  if (!app) return

  const jobRequest = await prisma.jobRequest.findUnique({ where: { id: app.jobRequestId } })
  if (!jobRequest) return

  const prompt = `Write a 3-5 sentence recruiter summary for this candidate applying to this role. Be specific and factual. Focus on seniority, relevant skills, years of experience, and salary alignment.

Candidate: ${JSON.stringify({ headline: app.profile.headline, skills: app.profile.skills, experiences: app.profile.experiences, expectedSalary: { min: app.profile.expectedSalaryMin, max: app.profile.expectedSalaryMax } })}

Job: ${JSON.stringify({ title: jobRequest.title, sector: jobRequest.sector, experience_level: jobRequest.experience_level, salary_min: jobRequest.salary_min, salary_max: jobRequest.salary_max })}

Write in English. No headers, no bullets, just flowing sentences.`

  try {
    const res = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    })
    const summary = res.choices[0].message.content ?? ''
    await prisma.directApplication.update({ where: { id: applicationId }, data: { aiSummary: summary } })
  } catch (err) {
    console.error('AI summary generation failed:', err)
  }
}
