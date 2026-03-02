import Mailgun from 'mailgun.js'
import formData from 'form-data'

// --- Types ---

export type WelcomeEmailData = {
  email: string
  displayName: string
}

export type CandidateInvitationEmailData = {
  email: string
  firstName: string
  lastName: string
  jobTitle: string
  department: string
  portalUrl: string
}

// --- Mailgun Client ---

const mailgun = new Mailgun(formData)

function getMailgunClient() {
  const apiKey = process.env.MAILGUN_API_KEY
  if (!apiKey) {
    throw new Error('MAILGUN_API_KEY environment variable is not set')
  }

  return mailgun.client({
    username: 'api',
    key: apiKey,
  })
}

function getEmailConfig() {
  return {
    domain: process.env.MAILGUN_DOMAIN || '',
    from: process.env.MAIL_FROM || 'noreply@company.com',
    companyName: process.env.COMPANY_NAME || 'Company',
  }
}

// --- Email Templates ---

function getCandidateInvitationTemplate(data: CandidateInvitationEmailData & { companyName: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #6366f1; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${data.companyName}
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Recruitment Portal
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                Hello ${data.firstName} ${data.lastName},
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We are pleased to invite you to apply for the following position at ${data.companyName}:
              </p>

              <!-- Position Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Position
                    </p>
                    <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                      ${data.jobTitle}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Department
                    </p>
                    <p style="margin: 0; color: #1f2937; font-size: 16px;">
                      ${data.department}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Please click the button below to access our Candidate Portal and complete your application profile.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.portalUrl}"
                       style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Access Candidate Portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button above doesn't work, you can copy and paste the following link into your browser:
              </p>
              <p style="margin: 8px 0 20px 0; word-break: break-all; color: #6366f1; font-size: 14px;">
                ${data.portalUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                This invitation link is unique to you. Please do not share it with others.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// --- Email Functions ---

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  await mg.messages.create(config.domain, {
    from: `${config.companyName} <${config.from}>`,
    to: data.email,
    subject: `Welcome to ${config.companyName}`,
    html: `
      <h1>Welcome ${data.displayName}!</h1>
      <p>Your account has been created successfully.</p>
      <p>You can now login to the system.</p>
    `,
  })

  console.log(`[MAILGUN] Welcome email sent to ${data.email}`)
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

  await mg.messages.create(config.domain, {
    from: `${config.companyName} <${config.from}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `,
  })

  console.log(`[MAILGUN] Password reset email sent to ${email}`)
}

export async function sendCandidateInvitationEmail(data: CandidateInvitationEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getCandidateInvitationTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.companyName} Recruitment <${config.from}>`,
    to: data.email,
    subject: `Application Invitation - ${data.jobTitle} at ${config.companyName}`,
    html,
  })

  console.log(`[MAILGUN] Candidate invitation email sent to ${data.email}`)
}

// --- Utility Functions ---

export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    const config = getEmailConfig()
    const mg = getMailgunClient()

    // Try to get domain info to verify credentials
    await mg.domains.get(config.domain)
    console.log('[MAILGUN] Configuration verified successfully')
    return true
  } catch (error) {
    console.error('[MAILGUN] Configuration verification failed:', error)
    return false
  }
}
