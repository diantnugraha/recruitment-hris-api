import Mailgun from 'mailgun.js'
import formData from 'form-data'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// --- Types ---

export type WelcomeEmailData = {
  email: string
  displayName: string
  password?: string
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
    from: process.env.MAILGUN_FROM_EMAIL || '',
    fromName: process.env.MAILGUN_FROM_NAME || '',
    companyName: process.env.COMPANY_NAME || '',
    contactEmail: process.env.COMPANY_CONTACT_EMAIL || '',
    websiteUrl: process.env.COMPANY_WEBSITE_URL || '',
    address: process.env.COMPANY_ADDRESS || '',
    addressLine2: process.env.COMPANY_ADDRESS_LINE2 || '',
  }
}

// --- Logo ---

function getLogoBase64(): string {
  const candidates = [
    resolve(process.cwd(), 'src', 'assets', 'tuv-nord-logo.png'),
    resolve(process.cwd(), 'dist', 'assets', 'tuv-nord-logo.png'),
  ]

  for (const path of candidates) {
    try {
      const buffer = readFileSync(path)
      return buffer.toString('base64')
    } catch {
      continue
    }
  }

  return ''
}

// --- Base Email Layout ---

function getBaseLayout(params: {
  title: string
  heading: string
  greeting: string
  bodyHtml: string
}): string {
  const config = getEmailConfig()
  const year = new Date().getFullYear()
  const logoBase64 = getLogoBase64()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
    * { font-family: 'Poppins', sans-serif !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', sans-serif; background-color: #f0f0f0;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Main Card -->
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">

          <!-- Logo -->
          <tr>
            <td style="padding: 36px 40px 20px 40px;">
              <img src="data:image/png;base64,${logoBase64}" alt="TÜV Nord" width="281" height="83" style="width: 200px; height: auto; display: block;">
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 22px; font-weight: 700;">
                ${params.heading}
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 8px 40px;">
              <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.6;">
                ${params.greeting}
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              ${params.bodyHtml}
            </td>
          </tr>

          <!-- Contact & Sign-off -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="margin: 0 0 16px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                For further clarifications, please contact <a href="mailto:${config.contactEmail}" style="color: #0032A0; text-decoration: none;">${config.contactEmail}</a>.
              </p>
              <p style="margin: 0 0 4px 0; color: #333333; font-size: 14px;">Regards,</p>
              <p style="margin: 0 0 4px 0; color: #1a1a1a; font-size: 14px; font-weight: 700;">The T&Uuml;V Nord Central Team</p>
              <a href="https://${config.websiteUrl}" style="color: #0032A0; font-size: 14px; text-decoration: none;">${config.websiteUrl}</a>
            </td>
          </tr>

          <!-- Company Address Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f7f7f7;">
              <p style="margin: 0 0 6px 0; color: #1a1a1a; font-size: 13px; font-weight: 700;">${config.companyName}</p>
              <p style="margin: 0 0 2px 0; color: #888888; font-size: 12px;">Head Office</p>
              <p style="margin: 0 0 2px 0; color: #888888; font-size: 12px;">${config.address}</p>
              <p style="margin: 0; color: #888888; font-size: 12px;">${config.addressLine2}</p>
            </td>
          </tr>

          <!-- Bottom Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e8e8e8;">
              <p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; text-align: center;">
                &copy; ${year} ${config.companyName}
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px; text-align: center; line-height: 1.5;">
                This email was automatically generated by the system. Please do not reply to this message.<br>
                If you experience any issues, please contact <a href="mailto:${config.contactEmail}" style="color: #0032A0; text-decoration: none;">${config.contactEmail}</a>.
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

// --- Email Templates ---

function getCandidateInvitationTemplate(data: CandidateInvitationEmailData & { companyName: string }): string {
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      We are pleased to invite you to apply for the following position at ${data.companyName}:
    </p>

    <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
    <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 17px; font-weight: 700;">${data.jobTitle}</p>

    <!-- Login Credentials -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #FFF8E1; border-radius: 8px; border: 1px solid #FFE082;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 10px 0; color: #E65100; font-size: 13px; font-weight: 700;">Your Login Credentials</p>
          <p style="margin: 0 0 6px 0; color: #333333; font-size: 14px;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin: 0 0 6px 0; color: #333333; font-size: 14px;"><strong>Password:</strong> <code style="background-color: #ffffff; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${data.password}</code></p>
          <p style="margin: 10px 0 0 0; color: #E65100; font-size: 11px;">Please keep your credentials secure and do not share them with anyone.</p>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Please click the button below to access our Candidate Portal and complete your application profile.
    </p>

    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${data.portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0032A0; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Access Candidate Portal
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 12px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6;">
      If the button above doesn't work, you can copy and paste the following link into your browser:
    </p>
    <p style="margin: 4px 0 0 0; word-break: break-all; color: #0032A0; font-size: 13px;">
      ${data.portalUrl}
    </p>
  `

  return getBaseLayout({
    title: 'Application Invitation',
    heading: 'Application Invitation',
    greeting: `Hi, <strong>${data.firstName} ${data.lastName}</strong>!`,
    bodyHtml,
  })
}

function getWelcomeEmailTemplate(data: WelcomeEmailData & { companyName: string, frontendUrl: string }): string {
  const credentialsSection = data.password ? `
    <!-- Login Credentials -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #FFF8E1; border-radius: 8px; border: 1px solid #FFE082;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 10px 0; color: #E65100; font-size: 13px; font-weight: 700;">Your Login Credentials</p>
          <p style="margin: 0 0 6px 0; color: #333333; font-size: 14px;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin: 0 0 6px 0; color: #333333; font-size: 14px;"><strong>Password:</strong> <code style="background-color: #ffffff; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; letter-spacing: 1px;">${data.password}</code></p>
          <p style="margin: 10px 0 0 0; color: #E65100; font-size: 11px;">Please change your password after your first login for security purposes.</p>
        </td>
      </tr>
    </table>
  ` : ''

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Your HRIS account has been created successfully. You can now access the system to manage your employee information.
    </p>

    ${credentialsSection}

    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${data.frontendUrl}/login" style="display: inline-block; padding: 14px 32px; background-color: #0032A0; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Login to HRIS
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 12px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6;">
      If the button above doesn't work, you can copy and paste the following link into your browser:
    </p>
    <p style="margin: 4px 0 0 0; word-break: break-all; color: #0032A0; font-size: 13px;">
      ${data.frontendUrl}/login
    </p>
  `

  return getBaseLayout({
    title: `Welcome to ${data.companyName}`,
    heading: 'Welcome to TÜV Nord Central',
    greeting: `Hi, <strong>${data.displayName}</strong>!`,
    bodyHtml,
  })
}

function getPasswordResetTemplate(params: { email: string, resetUrl: string, companyName: string }): string {
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      We received a request to reset the password for your account. Click the button below to set a new password.
    </p>

    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${params.resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0032A0; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 12px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6;">
      If the button above doesn't work, you can copy and paste the following link into your browser:
    </p>
    <p style="margin: 4px 0 0 0; word-break: break-all; color: #0032A0; font-size: 13px;">
      ${params.resetUrl}
    </p>

    <p style="margin: 20px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6;">
      This link will expire in 1 hour. If you did not request a password reset, please ignore this email.
    </p>
  `

  return getBaseLayout({
    title: 'Password Reset Request',
    heading: 'Password Reset',
    greeting: `Hi, <strong>${params.email}</strong>!`,
    bodyHtml,
  })
}

function getInterviewAssignmentTemplate(data: InterviewAssignmentEmailData & { companyName: string }): string {
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      You have been assigned to conduct an interview for a candidate. Please review the details below and prepare accordingly.
    </p>

    <!-- Assignment Card -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border-left: 4px solid #0032A0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Interview Type</p>
          <p style="margin: 0 0 14px 0; color: #0032A0; font-size: 17px; font-weight: 700;">${data.interviewType}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Candidate Name</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${data.candidateName}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Applied Position</p>
          <p style="margin: 0; color: #1a1a1a; font-size: 15px;">${data.jobTitle}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Please access the recruitment dashboard to review the candidate's profile and biodata before the interview.
    </p>

    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0032A0; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            View Candidate Details
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 12px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6;">
      If the button above doesn't work, you can copy and paste the following link into your browser:
    </p>
    <p style="margin: 4px 0 0 0; word-break: break-all; color: #0032A0; font-size: 13px;">
      ${data.dashboardUrl}
    </p>
  `

  return getBaseLayout({
    title: 'Interview Assignment',
    heading: 'Interview Assignment',
    greeting: `Hi, <strong>${data.assessorName}</strong>!`,
    bodyHtml,
  })
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
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      We are pleased to inform you that you have successfully passed all assessment stages.
      Below are your onboarding details. Please review and confirm your acceptance.
    </p>

    <!-- Details Card -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border-left: 4px solid #0032A0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
          <p style="margin: 0 0 14px 0; color: #0032A0; font-size: 17px; font-weight: 700;">${data.jobTitle}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Work Location</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${data.workLocation}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Join Date</p>
          <p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${data.joinDate}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Please click the button below to view your complete onboarding details and confirm your acceptance of the offer.
    </p>

    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${data.portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0032A0; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            View Onboarding Details
          </a>
        </td>
      </tr>
    </table>
  `

  return getBaseLayout({
    title: 'Onboarding Details',
    heading: 'Congratulations!',
    greeting: `Hi, <strong>${data.candidateName}</strong>!`,
    bodyHtml,
  })
}

// --- Interview Schedule Email (to Candidate) ---

export type InterviewScheduleEmailData = {
  candidateEmail: string
  candidateName: string
  jobTitle: string
  interviewDate: string
  interviewType: 'online' | 'onsite'
  portalUrl: string
}

function getInterviewScheduleTemplate(data: InterviewScheduleEmailData & { companyName: string }): string {
  const formattedDate = new Date(data.interviewDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })

  const typeLabel = data.interviewType === 'online' ? 'Online (Virtual)' : 'Onsite'

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      We are pleased to inform you that your application has been reviewed and you have been scheduled for an interview. Please find the details below:
    </p>

    <!-- Interview Details Card -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border-left: 4px solid #0032A0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 17px; font-weight: 700;">${data.jobTitle}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Interview Date & Time</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${formattedDate} WIB</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Interview Type</p>
          <p style="margin: 0; color: #0032A0; font-size: 15px; font-weight: 600;">${typeLabel}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Please make sure you are available at the scheduled time. You can check your interview status and details through our Candidate Portal.
    </p>

    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${data.portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0032A0; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Open Candidate Portal
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 12px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6;">
      If the button above doesn't work, you can copy and paste the following link into your browser:
    </p>
    <p style="margin: 4px 0 0 0; word-break: break-all; color: #0032A0; font-size: 13px;">
      ${data.portalUrl}
    </p>
  `

  return getBaseLayout({
    title: 'Interview Invitation',
    heading: 'Interview Invitation',
    greeting: `Hi, <strong>${data.candidateName}</strong>!`,
    bodyHtml,
  })
}

// --- Candidate Rejection Email ---

export type CandidateRejectionEmailData = {
  candidateEmail: string
  candidateName: string
  jobTitle: string
  stage: 'HR Assessment' | 'User Assessment' | 'Medical Check-Up'
}

function getCandidateRejectionTemplate(data: CandidateRejectionEmailData & { companyName: string }): string {
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Thank you for your interest in the <strong>${data.jobTitle}</strong> position at ${data.companyName} and for taking the time to go through our recruitment process.
    </p>

    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.
    </p>

    <!-- Info Card -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border-left: 4px solid #999999;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 17px; font-weight: 700;">${data.jobTitle}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Stage</p>
          <p style="margin: 0; color: #1a1a1a; font-size: 15px;">${data.stage}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 0 0; color: #333333; font-size: 15px; line-height: 1.6;">
      We encourage you to apply for future openings that match your skills and experience. We wish you all the best in your career endeavors.
    </p>
  `

  return getBaseLayout({
    title: 'Application Update',
    heading: 'Recruitment Update',
    greeting: `Hi, <strong>${data.candidateName}</strong>!`,
    bodyHtml,
  })
}

// --- Email Functions ---

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

  const html = getWelcomeEmailTemplate({
    ...data,
    companyName: config.companyName,
    frontendUrl,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.email,
    subject: `Welcome to ${config.companyName} - Your HRIS Account`,
    html,
  })

  console.log(`[MAILGUN] Welcome email sent to ${data.email}`)
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

  const html = getPasswordResetTemplate({
    email,
    resetUrl,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: email,
    subject: 'Password Reset Request',
    html,
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
    from: `${config.fromName} <${config.from}>`,
    to: data.email,
    subject: `Application Invitation - ${data.jobTitle}`,
    html,
  })

  console.log(`[MAILGUN] Candidate invitation email sent to ${data.email}`)
}

export async function sendInterviewAssignmentEmail(data: InterviewAssignmentEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getInterviewAssignmentTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.assessorEmail,
    subject: `Interview Assignment: ${data.candidateName} - ${data.jobTitle}`,
    html,
  })

  console.log(`[MAILGUN] Interview assignment email sent to ${data.assessorEmail}`)
}

export async function sendOnboardingEmail(data: OnboardingEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getOnboardingEmailTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.candidateEmail,
    subject: `Welcome to ${config.companyName} - Please Confirm Your Onboarding`,
    html,
  })

  console.log(`[MAILGUN] Onboarding email sent to ${data.candidateEmail}`)
}

export async function sendInterviewScheduleEmail(data: InterviewScheduleEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getInterviewScheduleTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.candidateEmail,
    subject: `Interview Invitation - ${data.jobTitle}`,
    html,
  })

  console.log(`[MAILGUN] Interview schedule email sent to ${data.candidateEmail}`)
}

// --- MCU Schedule Email (to Candidate) ---

export type McuScheduleEmailData = {
  candidateEmail: string
  candidateName: string
  jobTitle: string
  mcuDate: string
  mcuLocation: string
  portalUrl: string
}

function getMcuScheduleTemplate(data: McuScheduleEmailData & { companyName: string }): string {
  const formattedDate = new Date(data.mcuDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Congratulations on passing the interview stage! You have been scheduled for a Medical Check-Up (MCU). Please find the details below:
    </p>

    <!-- MCU Details Card -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border-left: 4px solid #0032A0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 17px; font-weight: 700;">${data.jobTitle}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">MCU Date & Time</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${formattedDate} WIB</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Location</p>
          <p style="margin: 0; color: #0032A0; font-size: 15px; font-weight: 600;">${data.mcuLocation}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Please make sure you are available at the scheduled time and location. You can check your MCU status and details through our Candidate Portal.
    </p>

    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${data.portalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0032A0; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            Open Candidate Portal
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 12px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6;">
      If the button above doesn't work, you can copy and paste the following link into your browser:
    </p>
    <p style="margin: 4px 0 0 0; word-break: break-all; color: #0032A0; font-size: 13px;">
      ${data.portalUrl}
    </p>
  `

  return getBaseLayout({
    title: 'Medical Check-Up Schedule',
    heading: 'Medical Check-Up Schedule',
    greeting: `Hi, <strong>${data.candidateName}</strong>!`,
    bodyHtml,
  })
}

export async function sendMcuScheduleEmail(data: McuScheduleEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getMcuScheduleTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.candidateEmail,
    subject: `Medical Check-Up Schedule - ${data.jobTitle}`,
    html,
  })

  console.log(`[MAILGUN] MCU schedule email sent to ${data.candidateEmail}`)
}

export async function sendCandidateRejectionEmail(data: CandidateRejectionEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getCandidateRejectionTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.candidateEmail,
    subject: `Application Update - ${data.jobTitle}`,
    html,
  })

  console.log(`[MAILGUN] Candidate rejection email sent to ${data.candidateEmail}`)
}

// --- SLA Email Types ---

export interface SlaApproachingEmailData {
  recipientEmail: string;
  recipientName: string;
  requestCode: string;
  jobTitle: string;
  remainingDays: number;
  dueDate: string;
}

export interface SlaOverdueEmailData {
  recipientEmail: string;
  recipientName: string;
  requestCode: string;
  jobTitle: string;
  overdueDays: number;
  dueDate: string;
}

// --- SLA Email Templates ---

function getSlaApproachingTemplate(data: SlaApproachingEmailData & { companyName: string }): string {
  const bodyHtml = `
    <p>${data.requestCode} for <strong>${data.jobTitle}</strong> has <strong>${data.remainingDays} working days</strong> remaining before the SLA deadline.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="padding: 15px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-weight: 600; color: #92400e;">SLA Deadline: ${data.dueDate}</p>
          <p style="margin: 5px 0 0; color: #92400e;">${data.remainingDays} working days remaining</p>
        </td>
      </tr>
    </table>
    <p>Please ensure the recruitment process is progressing to meet the deadline.</p>
  `;

  return getBaseLayout({
    title: `SLA Approaching - ${data.requestCode}`,
    heading: 'Recruitment SLA Approaching',
    greeting: `Dear ${data.recipientName},`,
    bodyHtml,
  });
}

export async function sendSlaApproachingEmail(data: SlaApproachingEmailData): Promise<void> {
  const config = getEmailConfig();
  const mg = getMailgunClient();
  const html = getSlaApproachingTemplate({ ...data, companyName: config.companyName });

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.recipientEmail,
    subject: `Recruitment SLA Approaching - ${data.requestCode}`,
    html,
  });

  console.log(`[MAILGUN] SLA approaching email sent to ${data.recipientEmail}`)
}

function getSlaOverdueTemplate(data: SlaOverdueEmailData & { companyName: string }): string {
  const bodyHtml = `
    <p>${data.requestCode} for <strong>${data.jobTitle}</strong> has exceeded the 45 working-day SLA by <strong>${data.overdueDays} days</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="padding: 15px; background-color: #fee2e2; border-radius: 8px; border-left: 4px solid #ef4444;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">SLA Deadline: ${data.dueDate} (exceeded)</p>
          <p style="margin: 5px 0 0; color: #991b1b;">Overdue by ${data.overdueDays} working days</p>
        </td>
      </tr>
    </table>
    <p>The recruitment process can still proceed. Please take action to complete the process as soon as possible.</p>
  `;

  return getBaseLayout({
    title: `SLA Overdue - ${data.requestCode}`,
    heading: 'Recruitment SLA Overdue',
    greeting: `Dear ${data.recipientName},`,
    bodyHtml,
  });
}

export async function sendSlaOverdueEmail(data: SlaOverdueEmailData): Promise<void> {
  const config = getEmailConfig();
  const mg = getMailgunClient();
  const html = getSlaOverdueTemplate({ ...data, companyName: config.companyName });

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.recipientEmail,
    subject: `Recruitment SLA Overdue - ${data.requestCode}`,
    html,
  });

  console.log(`[MAILGUN] SLA overdue email sent to ${data.recipientEmail}`)
}

// --- Employee Request Status Email ---

export interface EmployeeRequestStatusEmailData {
  recipientEmail: string
  recipientName: string
  requestCode: string
  jobTitle: string
  department: string
  actionLabel: string
  actorName: string
  comment?: string | undefined
  statusColor: string
  detailUrl: string
}

function getEmployeeRequestStatusTemplate(data: EmployeeRequestStatusEmailData & { companyName: string }): string {
  const commentSection = data.comment ? `
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border: 1px solid #e8e8e8;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Comment</p>
          <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; font-style: italic;">"${data.comment}"</p>
        </td>
      </tr>
    </table>
  ` : ''

  const bodyHtml = `
    <!-- Status Badge -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 16px 0;">
      <tr>
        <td>
          <span style="display: inline-block; padding: 6px 16px; background-color: ${data.statusColor}; color: #ffffff; font-size: 13px; font-weight: 600; border-radius: 20px;">
            ${data.actionLabel}
          </span>
        </td>
      </tr>
    </table>

    <!-- Request Details Card -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border-left: 4px solid ${data.statusColor};">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Request Code</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 17px; font-weight: 700;">${data.requestCode}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${data.jobTitle}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Department</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 15px;">${data.department}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Action By</p>
          <p style="margin: 0; color: #1a1a1a; font-size: 15px;">${data.actorName}</p>
        </td>
      </tr>
    </table>

    ${commentSection}

    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 16px 0;">
          <a href="${data.detailUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0032A0; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
            View Request Details
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 12px 0 0 0; color: #888888; font-size: 13px; line-height: 1.6;">
      If the button above doesn't work, you can copy and paste the following link into your browser:
    </p>
    <p style="margin: 4px 0 0 0; word-break: break-all; color: #0032A0; font-size: 13px;">
      ${data.detailUrl}
    </p>
  `

  return getBaseLayout({
    title: `Employee Request ${data.actionLabel} - ${data.requestCode}`,
    heading: 'Employee Request Update',
    greeting: `Dear ${data.recipientName},`,
    bodyHtml,
  })
}

export async function sendEmployeeRequestStatusEmail(data: EmployeeRequestStatusEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getEmployeeRequestStatusTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.recipientEmail,
    subject: `Employee Request ${data.actionLabel} - ${data.requestCode}`,
    html,
  })

  console.log(`[MAILGUN] Employee request status email sent to ${data.recipientEmail} (${data.actionLabel})`)
}

// --- Facility PIC Email ---

export interface FacilityPicEmailData {
  picName: string
  picEmail: string
  candidateName: string
  joinDate: string
  workLocation: string
  facilities: Array<{ item: string; qty: number; condition: string }>
}

function getFacilityPicTemplate(data: FacilityPicEmailData & { companyName: string }): string {
  const facilityRows = data.facilities
    .map(
      (f) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e8; color: #333333; font-size: 14px;">${f.item}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e8; color: #333333; font-size: 14px; text-align: center;">${f.qty}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e8; color: #333333; font-size: 14px;">${f.condition}</td>
      </tr>`
    )
    .join('')

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      A new employee will be joining the team. Please prepare the following facilities:
    </p>

    <!-- Candidate Details Card -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border-left: 4px solid #0032A0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Employee Name</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 17px; font-weight: 700;">${data.candidateName}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Join Date</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${data.joinDate}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Work Location</p>
          <p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${data.workLocation}</p>
        </td>
      </tr>
    </table>

    <!-- Facility Table -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr>
          <th style="padding: 10px 12px; background-color: #0032A0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left; border-radius: 6px 0 0 0;">Item</th>
          <th style="padding: 10px 12px; background-color: #0032A0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: center;">Qty</th>
          <th style="padding: 10px 12px; background-color: #0032A0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left; border-radius: 0 6px 0 0;">Condition</th>
        </tr>
      </thead>
      <tbody>
        ${facilityRows}
      </tbody>
    </table>

    <p style="margin: 16px 0 0 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Thank you.
    </p>
  `

  return getBaseLayout({
    title: `New Employee Facility Preparation - ${data.candidateName}`,
    heading: 'New Employee Facility Preparation',
    greeting: `Dear ${data.picName},`,
    bodyHtml,
  })
}

export async function sendFacilityPicEmail(data: FacilityPicEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getFacilityPicTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.picEmail,
    subject: `New Employee Facility Preparation - ${data.candidateName}`,
    html,
  })

  console.log(`[MAILGUN] Facility PIC email sent to ${data.picEmail}`)
}

// --- Program PIC Email ---

export interface ProgramPicEmailData {
  picName: string
  picEmail: string
  candidateName: string
  joinDate: string
  programs: Array<{ program: string; date: string; location: string }>
}

function getProgramPicTemplate(data: ProgramPicEmailData & { companyName: string }): string {
  const programRows = data.programs
    .map(
      (p) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e8; color: #333333; font-size: 14px;">${p.program}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e8; color: #333333; font-size: 14px;">${p.date}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e8e8e8; color: #333333; font-size: 14px;">${p.location}</td>
      </tr>`
    )
    .join('')

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px; line-height: 1.6;">
      A new employee will be joining the team. Please prepare the following onboarding programs:
    </p>

    <!-- Candidate Details Card -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f7f7f7; border-radius: 8px; border-left: 4px solid #0032A0;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Employee Name</p>
          <p style="margin: 0 0 14px 0; color: #1a1a1a; font-size: 17px; font-weight: 700;">${data.candidateName}</p>
          <p style="margin: 0 0 4px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Join Date</p>
          <p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${data.joinDate}</p>
        </td>
      </tr>
    </table>

    <!-- Program Table -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr>
          <th style="padding: 10px 12px; background-color: #0032A0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left; border-radius: 6px 0 0 0;">Program</th>
          <th style="padding: 10px 12px; background-color: #0032A0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left;">Date</th>
          <th style="padding: 10px 12px; background-color: #0032A0; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left; border-radius: 0 6px 0 0;">Location</th>
        </tr>
      </thead>
      <tbody>
        ${programRows}
      </tbody>
    </table>

    <p style="margin: 16px 0 0 0; color: #333333; font-size: 15px; line-height: 1.6;">
      Thank you.
    </p>
  `

  return getBaseLayout({
    title: `Onboarding Program Preparation - ${data.candidateName}`,
    heading: 'Onboarding Program Preparation',
    greeting: `Dear ${data.picName},`,
    bodyHtml,
  })
}

export async function sendProgramPicEmail(data: ProgramPicEmailData): Promise<void> {
  const config = getEmailConfig()
  const mg = getMailgunClient()

  const html = getProgramPicTemplate({
    ...data,
    companyName: config.companyName,
  })

  await mg.messages.create(config.domain, {
    from: `${config.fromName} <${config.from}>`,
    to: data.picEmail,
    subject: `Onboarding Program Preparation - ${data.candidateName}`,
    html,
  })

  console.log(`[MAILGUN] Program PIC email sent to ${data.picEmail}`)
}

// --- Utility Functions ---

export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    const config = getEmailConfig()
    const mg = getMailgunClient()

    await mg.domains.get(config.domain)
    console.log('[MAILGUN] Configuration verified successfully')
    return true
  } catch (error) {
    console.error('[MAILGUN] Configuration verification failed:', error)
    return false
  }
}
