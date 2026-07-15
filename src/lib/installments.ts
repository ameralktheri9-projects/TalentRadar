import { prisma } from './prisma'
import crypto from 'crypto'

export async function createInstallmentInvoices(params: {
  placementId: string
  companyId: string
  agencyId: string
  totalAmount: number
  installmentCount: number  // 3
}): Promise<string[]> {
  const { calculateVat } = await import('./zatca')
  const perInstallment = Math.round((params.totalAmount / params.installmentCount) * 100) / 100
  const ids: string[] = []

  for (let i = 0; i < params.installmentCount; i++) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + i * 30)

    const { vat, total } = calculateVat(perInstallment)
    const platformCut = perInstallment * 0.1
    const agencyPayout = perInstallment - platformCut

    const invoice = await prisma.invoice.create({
      data: {
        placement_id: params.placementId,
        company_id: params.companyId,
        agency_id: params.agencyId,
        gross_amount: perInstallment,
        platform_cut: platformCut,
        agency_payout: agencyPayout,
        vat_amount: vat,
        total_amount: total,
        status: 'DRAFT',
        due_date: dueDate,
        zatcaUUID: crypto.randomUUID(),
        installmentPlan: true,
        installmentCount: params.installmentCount,
      } as any,
    })
    ids.push(invoice.id)
  }
  return ids
}
