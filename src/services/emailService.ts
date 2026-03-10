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
  password: string
}

export type InterviewAssignmentEmailData = {
  assessorEmail: string
  assessorName: string
  candidateName: string
  jobTitle: string
  interviewType: 'Interview User' | 'Interview HR'
  dashboardUrl: string
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

              <!-- Login Credentials Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #92400e; font-size: 14px; font-weight: 600;">
                      Your Login Credentials
                    </p>
                    <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">
                      <strong>Email:</strong> ${data.email}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">
                      <strong>Password:</strong> <code style="background-color: #ffffff; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${data.password}</code>
                    </p>
                    <p style="margin: 12px 0 0 0; color: #92400e; font-size: 12px;">
                      Please keep your credentials secure and do not share them with anyone.
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
                If you have any questions, please contact our HR department.
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

function getInterviewAssignmentTemplate(data: InterviewAssignmentEmailData & { companyName: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Assignment</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${data.companyName}
              </h1>
              <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 14px;">
                Interview Assignment Notification
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                Hello ${data.assessorName},
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You have been assigned to conduct an interview for a candidate. Please review the details below and prepare accordingly.
              </p>

              <!-- Assignment Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Interview Type
                    </p>
                    <p style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                      ${data.interviewType}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Candidate Name
                    </p>
                    <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 500;">
                      ${data.candidateName}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Applied Position
                    </p>
                    <p style="margin: 0; color: #1f2937; font-size: 16px;">
                      ${data.jobTitle}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Please access the recruitment dashboard to review the candidate's profile and biodata before the interview.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.dashboardUrl}"
                       style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      View Candidate Details
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button above doesn't work, you can copy and paste the following link into your browser:
              </p>
              <p style="margin: 8px 0 20px 0; word-break: break-all; color: #3b82f6; font-size: 14px;">
                ${data.dashboardUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                If you have any questions, please contact the HR department.
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

export async function sendInterviewAssignmentEmail(data: InterviewAssignmentEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getInterviewAssignmentTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.companyName} HR <${config.from}>`,
    to: data.assessorEmail,
    subject: `Interview Assignment: ${data.candidateName} - ${data.jobTitle}`,
    html,
  })

  console.log(`[MAILGUN] Interview assignment email sent to ${data.assessorEmail}`)
}

// --- Onboarding Email ---

export interface OnboardingEmailData {
  candidateName: string
  candidateEmail: string
  jobTitle: string
  workLocation: string
  joinDate: string
  portalUrl: string
}

function getOnboardingEmailTemplate(data: OnboardingEmailData & { companyName: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Details</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #10b981; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🎉 Congratulations!
              </h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">
                Welcome to ${data.companyName}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                Dear ${data.candidateName},
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We are pleased to inform you that you have successfully passed all assessment stages.
                Below are your onboarding details. Please review and confirm your acceptance.
              </p>

              <!-- Details Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Position
                    </p>
                    <p style="margin: 0 0 16px 0; color: #047857; font-size: 18px; font-weight: 600;">
                      ${data.jobTitle}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Work Location
                    </p>
                    <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 500;">
                      ${data.workLocation}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Join Date
                    </p>
                    <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 500;">
                      ${data.joinDate}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Please click the button below to view your complete onboarding details and confirm your acceptance of the offer.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.portalUrl}"
                       style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
                      View Onboarding Details
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions, please contact our HR team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ${data.companyName} - Human Resources
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

export async function sendOnboardingEmail(data: OnboardingEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getOnboardingEmailTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.companyName} HR <${config.from}>`,
    to: data.candidateEmail,
    subject: `Welcome to ${config.companyName} - Please Confirm Your Onboarding`,
    html,
  })

  console.log(`[MAILGUN] Onboarding email sent to ${data.candidateEmail}`)
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
