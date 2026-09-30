import sgMail from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function sendEmail(
  to: string,
  templateId: string,
  dynamicData: Record<string, unknown>
) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email skipped - no SENDGRID_API_KEY]', { to, templateId, dynamicData })
    return
  }
  await sgMail.send({
    to,
    from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@talentradar.sa', name: 'TalentRadar' },
    templateId,
    dynamicTemplateData: dynamicData,
  })
}

export const EMAIL_TEMPLATES = {
  OTP_VERIFICATION: process.env.SENDGRID_TEMPLATE_OTP || 'd-placeholder-otp',
  PASSWORD_RESET: process.env.SENDGRID_TEMPLATE_RESET || 'd-placeholder-reset',
  ORG_INVITE: process.env.SENDGRID_TEMPLATE_INVITE || 'd-placeholder-invite',
  PROPOSAL_RECEIVED: process.env.SENDGRID_TEMPLATE_PROPOSAL || 'd-placeholder-proposal',
  CANDIDATE_SHORTLISTED: process.env.SENDGRID_TEMPLATE_SHORTLISTED || 'd-placeholder-shortlisted',
  PLACEMENT_CONFIRMED: process.env.SENDGRID_TEMPLATE_PLACEMENT || 'd-placeholder-placement',
  SLA_WARNING: process.env.SENDGRID_TEMPLATE_SLA || 'd-placeholder-sla',
  INVOICE_GENERATED: process.env.SENDGRID_TEMPLATE_INVOICE || 'd-placeholder-invoice',
  SUBSCRIPTION_RENEWAL_7D: process.env.SENDGRID_TEMPLATE_RENEWAL_7D || 'd-placeholder-renewal-7d',
  SUBSCRIPTION_RENEWAL_3D: process.env.SENDGRID_TEMPLATE_RENEWAL_3D || 'd-placeholder-renewal-3d',
  SUBSCRIPTION_RENEWAL_1D: process.env.SENDGRID_TEMPLATE_RENEWAL_1D || 'd-placeholder-renewal-1d',
  SUBSCRIPTION_PAYMENT_FAILED: process.env.SENDGRID_TEMPLATE_PAYMENT_FAILED || 'd-placeholder-payment-failed',
  APPLICATION_STATUS_CHANGE: process.env.SENDGRID_TEMPLATE_APP_STATUS || 'd-placeholder-app-status',
  INTERVIEW_INVITED: process.env.SENDGRID_TEMPLATE_INTERVIEW || 'd-placeholder-interview',
  // HR Phase 1
  OFFER_SENT:             process.env.SENDGRID_TEMPLATE_OFFER_SENT     || 'd-placeholder-offer-sent',
  OFFER_ACCEPTED:         process.env.SENDGRID_TEMPLATE_OFFER_ACCEPTED  || 'd-placeholder-offer-accepted',
  OFFER_DECLINED:         process.env.SENDGRID_TEMPLATE_OFFER_DECLINED  || 'd-placeholder-offer-declined',
  APPROVAL_REQUESTED:     process.env.SENDGRID_TEMPLATE_APPROVAL_REQ    || 'd-placeholder-approval-req',
  APPROVAL_DECIDED:       process.env.SENDGRID_TEMPLATE_APPROVAL_DECIDED || 'd-placeholder-approval-decided',
  ONBOARDING_TASK_DUE:    process.env.SENDGRID_TEMPLATE_ONBOARDING_DUE  || 'd-placeholder-onboarding-due',
}
