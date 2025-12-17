// Performance and Security Monitoring Utilities

interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

interface SecurityEvent {
  type: 'csp_violation' | 'xss_attempt' | 'suspicious_activity' | 'form_submission'
  details: Record<string, unknown>
  timestamp: number
  userAgent: string
  url: string
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observer: PerformanceObserver | null = null

  constructor() {
    this.initializeObserver()
    this.measureCoreWebVitals()
  }

  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processEntry(entry)
        }
      })

      // Observe different types of performance entries
      try {
        this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })
      } catch (e) {
        // Fallback for browsers that don't support all entry types
        console.warn('Some performance metrics may not be available:', e)
      }
    }
  }

  private processEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation': {
        const navEntry = entry as PerformanceNavigationTiming
        this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart
        break
      }

      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime
        }
        break

      case 'largest-contentful-paint':
        this.metrics.lcp = entry.startTime
        break

      case 'first-input': {
        const fidEntry = entry as PerformanceEntry & { processingStart: number }
        this.metrics.fid = fidEntry.processingStart - fidEntry.startTime
        break
      }

      case 'layout-shift': {
        const clsEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
        if (!clsEntry.hadRecentInput) {
          this.metrics.cls = (this.metrics.cls || 0) + clsEntry.value
        }
        break
      }
    }
  }

  private measureCoreWebVitals() {
    // Measure FCP
    if ('PerformancePaintTiming' in window) {
      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime
      }
    }

    // Measure LCP using web-vitals approach
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP measurement not supported:', e)
      }
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  reportMetrics() {
    const metrics = this.getMetrics()
    
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metrics)
    }
    
    console.log('Performance Metrics:', metrics)
    return metrics
  }

  private sendToAnalytics(metrics: Partial<PerformanceMetrics>) {
    // Example: Send to Google Analytics 4
    if (typeof gtag !== 'undefined') {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== undefined) {
          gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: key.toUpperCase(),
            value: Math.round(value),
            non_interaction: true,
          })
        }
      })
    }

    // Example: Send to custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(error => {
      console.warn('Failed to send performance metrics:', error)
    })
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

class SecurityMonitor {
  private events: SecurityEvent[] = []

  constructor() {
    this.setupCSPViolationReporting()
    this.setupXSSDetection()
    this.setupSuspiciousActivityDetection()
  }

  private setupCSPViolationReporting() {
    document.addEventListener('securitypolicyviolation', (event) => {
      this.logSecurityEvent({
        type: 'csp_violation',
        details: {
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          documentURI: event.documentURI,
          originalPolicy: event.originalPolicy,
          disposition: event.disposition,
        },
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    })
  }

  private setupXSSDetection() {
    // Monitor for potential XSS attempts in form inputs
    const forms = document.querySelectorAll('form')
    forms.forEach(form => {
      form.addEventListener('submit', (event) => {
        const formData = new FormData(form)
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+=/i,
          /<iframe/i,
          /eval\(/i,
        ]

        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string') {
            for (const pattern of suspiciousPatterns) {
              if (pattern.test(value)) {
                this.logSecurityEvent({
                  type: 'xss_attempt',
                  details: {
                    field: key,
                    value: value.substring(0, 100), // Truncate for security
                    pattern: pattern.source,
                  },
                  timestamp: Date.now(),
                  userAgent: navigator.userAgent,
                  url: window.location.href,
                })
                break
              }
            }
          }
        }
      })
    })
  }

  private setupSuspiciousActivityDetection() {
    let rapidClickCount = 0
    let rapidClickTimer: NodeJS.Timeout

    document.addEventListener('click', () => {
      rapidClickCount++
      
      clearTimeout(rapidClickTimer)
      rapidClickTimer = setTimeout(() => {
        if (rapidClickCount > 10) {
          this.logSecurityEvent({
            type: 'suspicious_activity',
            details: {
              activity: 'rapid_clicking',
              count: rapidClickCount,
            },
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          })
        }
        rapidClickCount = 0
      }, 1000)
    })

    // Monitor for console access (potential developer tools usage)
    const devtools = { open: false, orientation: null }
    const threshold = 160

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true
          this.logSecurityEvent({
            type: 'suspicious_activity',
            details: {
              activity: 'devtools_opened',
            },
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          })
        }
      } else {
        devtools.open = false
      }
    }, 500)
  }

  private logSecurityEvent(event: SecurityEvent) {
    this.events.push(event)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', event)
    }

    // Send to security monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportSecurityEvent(event)
    }

    // Keep only last 100 events to prevent memory issues
    if (this.events.length > 100) {
      this.events = this.events.slice(-100)
    }
  }

  private reportSecurityEvent(event: SecurityEvent) {
    fetch('/api/security/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(error => {
      console.warn('Failed to report security event:', error)
    })
  }

  getEvents(): SecurityEvent[] {
    return [...this.events]
  }
}

// Error tracking and reporting
class ErrorTracker {
  constructor() {
    this.setupGlobalErrorHandling()
    this.setupUnhandledRejectionHandling()
  }

  private setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        type: 'javascript_error',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })
  }

  private setupUnhandledRejectionHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        error: event.reason?.stack,
        type: 'unhandled_rejection',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })
  }

  private reportError(errorInfo: Record<string, unknown>) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorInfo)
    }

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo),
      }).catch(err => {
        console.warn('Failed to report error:', err)
      })
    }
  }
}

// Initialize monitoring
export const performanceMonitor = new PerformanceMonitor()
export const securityMonitor = new SecurityMonitor()
export const errorTracker = new ErrorTracker()

// Utility functions
export const reportCustomMetric = (name: string, value: number, unit?: string) => {
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        unit,
        timestamp: Date.now(),
        url: window.location.href,
      }),
    }).catch(error => {
      console.warn('Failed to report custom metric:', error)
    })
  }
}

export const measureUserTiming = (name: string, startMark?: string, endMark?: string) => {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name, 'measure')[0]
      reportCustomMetric(name, measure.duration, 'ms')
    } catch (error) {
      console.warn('Failed to measure user timing:', error)
    }
  }
}

// Cleanup function
export const cleanupMonitoring = () => {
  performanceMonitor.disconnect()
}
