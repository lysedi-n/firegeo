// lib/auth.ts
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
import { sendEmail } from './email'

const isProd = process.env.NODE_ENV === 'production'

// Optional: if you plan to enable billing later, you can gate the plugin on env vars.
// For now we keep billing OFF so auth can't fail on missing keys.
// import { autumn } from 'autumn-js/better-auth'
// const plugins = (process.env.AUTUMN_SECRET_KEY || process.env.AUTUMN_PUBLISHABLE_KEY) ? [autumn()] : []
const plugins: any[] = []

export const auth = betterAuth({
  // Postgres pool with SSL enabled in production (fixes "self-signed certificate" on Vercel)
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: isProd ? { rejectUnauthorized: false } : undefined,
  }),

  // Required secret (>= 32 chars). Set BETTER_AUTH_SECRET in Vercel.
  secret: process.env.BETTER_AUTH_SECRET!,

  // Primary site origin used for callbacks and links
  // Prefer BETTER_AUTH_URL, then NEXT_PUBLIC_APP_URL, then localhost for dev
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000',

  // Allow sign up / login with email + password (no verification needed for testing)
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      // Visible in logs even if you haven't set up email yet
      console.log('Password reset link:', url)
      await sendEmail({
        to: user.email,
        subject: 'Reset your password - Fire SaaS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6;">Click the button below to create a new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">If you didn't request this, ignore this email.</p>
            <p style="color: #999; font-size: 14px;">This link expires in 1 hour.</p>
          </div>
        `,
      })
    },
  },

  // Optional email verification flow (left disabled for testing)
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log('Verification link:', url)
      await sendEmail({
        to: user.email,
        subject: 'Verify your email - Fire SaaS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p style="color: #666; line-height: 1.6;">Click the button below to verify your email.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">If you didn't create an account, ignore this email.</p>
          </div>
        `,
      })
    },
  },

  // Origins that are allowed to create and read sessions
  // Includes your production domain and the current Vercel preview domain if present
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean) as string[],

  // Session cookie config
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh session if older than 1 day
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
    },
  },

  plugins,
})