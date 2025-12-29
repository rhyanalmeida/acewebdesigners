import { z } from 'zod'
import DOMPurify from 'dompurify'

// Validation schemas
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-()]/g, '')),
      'Please enter a valid phone number'
    ),
  
  company: z
    .string()
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  
  website: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+\..+/.test(val),
      'Please enter a valid website URL'
    ),
  
  budget: z
    .string()
    .optional(),
  
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  
  projectType: z
    .array(z.string())
    .optional(),
  
  timeline: z
    .string()
    .optional(),
})

export const referralFormSchema = z.object({
  referrerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  
  referrerEmail: z
    .string()
    .email('Please enter a valid email address'),
  
  referralName: z
    .string()
    .min(2, 'Referral name must be at least 2 characters')
    .max(50, 'Referral name must be less than 50 characters'),
  
  referralEmail: z
    .string()
    .email('Please enter a valid referral email address'),
  
  referralCompany: z
    .string()
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
export type ReferralFormData = z.infer<typeof referralFormSchema>

// Input sanitization functions
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''
  
  // Remove any HTML tags and potentially dangerous content
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
  
  // Additional sanitization for common injection patterns
  return sanitized
    .replace(/[<>]/g, '') // Remove any remaining angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return ''
  
  // Basic email sanitization - remove dangerous characters
  return email
    .toLowerCase()
    .replace(/[<>"']/g, '')
    .trim()
}

export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return ''
  
  try {
    const urlObj = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return ''
    }
    return urlObj.toString()
  } catch {
    return ''
  }
}

export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') return ''
  
  // Remove all non-digit characters except + at the beginning
  return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
}

// Rate limiting helper (client-side basic implementation)
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(identifier) || []
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (validAttempts.length >= this.maxAttempts) {
      return false
    }
    
    // Add current attempt
    validAttempts.push(now)
    this.attempts.set(identifier, validAttempts)
    
    return true
  }

  getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier) || []
    if (attempts.length === 0) return 0
    
    const oldestAttempt = Math.min(...attempts)
    const timeUntilReset = this.windowMs - (Date.now() - oldestAttempt)
    
    return Math.max(0, timeUntilReset)
  }
}

// Form validation helpers
export const validateFormData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: 'Validation failed' } }
  }
}

// Security headers validation
export const validateSecurityHeaders = (headers: Headers): boolean => {
  const requiredHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'content-security-policy'
  ]
  
  return requiredHeaders.every(header => headers.has(header))
}

// XSS protection helper
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// CSRF token helper (for future API integration)
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
