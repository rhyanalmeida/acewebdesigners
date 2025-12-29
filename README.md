# Ace Web Designers - Small Business Web Design Company

[![CI/CD Pipeline](https://github.com/acewebdesigners/website/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/acewebdesigners/website/actions)
[![Lighthouse Score](https://img.shields.io/badge/lighthouse-100%2F100-brightgreen)](https://www.acewebdesigners.com)
[![Security Headers](https://img.shields.io/badge/security-A%2B-brightgreen)](https://securityheaders.com/?q=acewebdesigners.com)

Professional small business web design company serving all 50 states. This repository contains the source code for our company website, built with modern web technologies and optimized for performance, SEO, and security.

## 🚀 Features

- **SEO Optimized**: Complete SEO optimization for national small business keywords
- **Performance**: 100/100 Lighthouse scores across all metrics
- **Security**: A+ security rating with comprehensive security headers
- **Responsive**: Mobile-first design that works on all devices
- **Accessible**: WCAG 2.1 AA compliant
- **Modern Stack**: React 18, TypeScript, Tailwind CSS, Vite

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest, React Testing Library, Playwright
- **Deployment**: Netlify
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom performance and security monitoring

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/acewebdesigners/website.git
   cd website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:ui
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Performance Testing
```bash
# Run Lighthouse audit
npm run lighthouse
```

## 🏗️ Build & Deploy

### Development Build
```bash
npm run build
npm run preview
```

### Production Deployment
The site automatically deploys to Netlify when changes are pushed to the `main` branch.

Manual deployment:
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 📊 Performance Metrics

Our website achieves perfect scores across all Lighthouse metrics:

- **Performance**: 100/100
- **Accessibility**: 100/100
- **Best Practices**: 100/100
- **SEO**: 100/100

### Core Web Vitals
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## 🔒 Security Features

- **Content Security Policy (CSP)**: Strict CSP with nonce-based script loading
- **Security Headers**: Complete OWASP security header implementation
- **Input Validation**: Comprehensive form validation and sanitization
- **Dependency Security**: Automated vulnerability scanning
- **Rate Limiting**: Client-side and server-side rate limiting

## 🎨 Code Quality

### Linting & Formatting
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Type Checking
```bash
npm run type-check
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, LazyImage)
│   ├── common/         # Common components (ErrorBoundary)
│   └── __tests__/      # Component tests
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── validation.ts   # Form validation and sanitization
│   └── monitoring.ts   # Performance and security monitoring
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles

public/
├── robots.txt         # Search engine directives
├── sitemap.xml        # XML sitemap
└── site.webmanifest   # Web app manifest

tests/
├── e2e/               # End-to-end tests
└── setup.ts           # Test configuration
```

## 🌐 SEO Optimization

### Meta Tags & Structured Data
- Comprehensive meta tags for all pages
- Open Graph and Twitter Card optimization
- JSON-LD structured data (Organization, FAQ, Service schemas)
- Proper canonical URLs and hreflang tags

### Content Optimization
- Optimized for national small business keywords
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for all images

### Technical SEO
- XML sitemap with proper priorities
- Robots.txt optimization
- Fast loading times (< 2.3s)
- Mobile-first responsive design

## 🔧 Configuration Files

- **`vite.config.ts`**: Vite build configuration
- **`vitest.config.ts`**: Unit test configuration
- **`playwright.config.ts`**: E2E test configuration
- **`eslint.config.js`**: ESLint configuration
- **`tailwind.config.js`**: Tailwind CSS configuration
- **`netlify.toml`**: Netlify deployment configuration
- **`lighthouserc.js`**: Lighthouse CI configuration

## 🚀 Deployment

### Netlify Configuration
The site is configured for deployment on Netlify with:
- Automatic builds from GitHub
- Security headers configuration
- Redirect rules for SPA routing
- Performance optimizations

### Environment Variables
Set the following environment variables in your deployment platform:
- `NETLIFY_AUTH_TOKEN`: Netlify authentication token
- `NETLIFY_SITE_ID`: Netlify site ID
- `LHCI_GITHUB_APP_TOKEN`: Lighthouse CI GitHub app token

## 📈 Monitoring & Analytics

### Performance Monitoring
- Real-time Core Web Vitals tracking
- Custom performance metrics
- Error tracking and reporting
- User experience monitoring

### Security Monitoring
- CSP violation reporting
- XSS attempt detection
- Suspicious activity monitoring
- Security event logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Ensure all CI checks pass
- Follow the existing code style
- Update documentation as needed

## 📝 License

This project is proprietary and confidential. All rights reserved by Ace Web Designers.

## 📞 Contact

**Ace Web Designers**
- Website: [https://www.acewebdesigners.com](https://www.acewebdesigners.com)
- Email: support@acewebdesigners.com
- Phone: (774) 315-1951
- Location: Leominster, MA (Serving Nationwide)

---

**Specializing in small business web design across all 50 states. Get a professional website that converts visitors into customers.**

