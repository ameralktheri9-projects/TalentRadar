import { openai, OPENAI_MODEL } from './openai'

export async function suggestSalaryRange(
  role: string,
  sector: string,
  seniority: string
): Promise<{ min: number; max: number; currency: string }> {
  if (!process.env.OPENAI_API_KEY) {
    // Return market estimates without AI when no key configured
    const base = seniority === 'SENIOR' ? 20000 : seniority === 'MID' ? 14000 : 9000
    return { min: base, max: Math.round(base * 1.4), currency: 'SAR' }
  }

  const prompt = `Saudi Arabia job market 2025. Role: ${role}. Sector: ${sector}. Seniority: ${seniority}. Return JSON only: { "min": number, "max": number, "currency": "SAR" }. Monthly salary in SAR. No explanation.`

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 100,
  })

  try {
    return JSON.parse(res.choices[0].message.content ?? '{}')
  } catch {
    return { min: 10000, max: 20000, currency: 'SAR' }
  }
}
