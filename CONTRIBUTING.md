# Contributing to Ace Web Designers Website

Thank you for your interest in contributing to the Ace Web Designers website! This document provides guidelines and instructions for contributing to this project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git

### Development Setup
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Open http://localhost:5173 in your browser

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint and Prettier)
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused

### Component Guidelines
- Use functional components with hooks
- Implement proper TypeScript interfaces for props
- Include proper accessibility attributes
- Optimize for performance (use React.memo when appropriate)
- Write unit tests for new components

### SEO Guidelines
- Maintain semantic HTML structure
- Include proper meta tags for new pages
- Optimize images with alt text and proper sizing
- Ensure fast loading times
- Test mobile responsiveness

### Security Guidelines
- Validate and sanitize all user inputs
- Use the provided validation utilities
- Follow CSP guidelines for external resources
- Never expose sensitive information in client-side code
- Report security vulnerabilities privately

## 🧪 Testing Requirements

### Unit Tests
- Write tests for all new components and utilities
- Aim for 80%+ code coverage
- Use React Testing Library for component tests
- Mock external dependencies appropriately

### E2E Tests
- Add E2E tests for new user flows
- Test critical paths and form submissions
- Ensure tests work across different browsers
- Include accessibility testing

### Performance Tests
- Ensure Lighthouse scores remain at 100/100
- Test Core Web Vitals compliance
- Optimize bundle sizes
- Test on slow networks

## 🔄 Pull Request Process

### Before Submitting
1. Run all tests: `npm test`
2. Run type checking: `npm run type-check`
3. Run linting: `npm run lint`
4. Run E2E tests: `npm run test:e2e`
5. Check Lighthouse scores: `npm run lighthouse`

### PR Requirements
- Clear, descriptive title
- Detailed description of changes
- Link to related issues
- Screenshots for UI changes
- Performance impact assessment
- Security considerations

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Security enhancement

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Lighthouse scores maintained

## Screenshots
(If applicable)

## Performance Impact
(Describe any performance implications)

## Security Considerations
(Describe any security implications)
```

## 🐛 Bug Reports

### Before Reporting
- Check existing issues
- Reproduce the bug
- Test in multiple browsers
- Gather system information

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: [e.g., Chrome 91]
- OS: [e.g., Windows 10]
- Device: [e.g., Desktop, iPhone 12]
- Screen size: [e.g., 1920x1080]

## Screenshots
(If applicable)
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this be implemented?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Any other relevant information
```

## 📚 Documentation

### Documentation Standards
- Use clear, concise language
- Include code examples
- Update README.md for significant changes
- Document API changes
- Include screenshots for UI features

### JSDoc Standards
```typescript
/**
 * Validates and sanitizes user input
 * @param input - The raw user input string
 * @param options - Validation options
 * @returns Sanitized and validated input
 * @throws {ValidationError} When input is invalid
 * @example
 * ```typescript
 * const clean = sanitizeInput('<script>alert("xss")</script>', { allowHTML: false })
 * // Returns: 'alert("xss")'
 * ```
 */
function sanitizeInput(input: string, options: ValidationOptions): string {
  // Implementation
}
```

## 🔒 Security

### Reporting Security Issues
- **DO NOT** create public issues for security vulnerabilities
- Email security issues to: security@acewebdesigners.com
- Include detailed steps to reproduce
- Allow time for investigation and patching

### Security Best Practices
- Always validate user input
- Use the provided sanitization utilities
- Follow CSP guidelines
- Keep dependencies updated
- Use HTTPS for all external requests

## 📊 Performance

### Performance Guidelines
- Optimize images (use WebP when possible)
- Minimize bundle sizes
- Use lazy loading for non-critical resources
- Implement proper caching strategies
- Monitor Core Web Vitals

### Performance Testing
```bash
# Run Lighthouse audit
npm run lighthouse

# Check bundle size
npm run build
npm run preview
```

## 🎨 Design Guidelines

### UI/UX Principles
- Mobile-first responsive design
- Consistent spacing and typography
- Accessible color contrasts
- Intuitive navigation
- Fast loading animations

### Tailwind CSS Usage
- Use existing utility classes
- Follow the design system
- Create custom components for repeated patterns
- Maintain consistent spacing scale
- Use semantic color names

## 🚀 Deployment

### Staging Environment
- All PRs are automatically deployed to staging
- Test thoroughly in staging before merging
- Check all functionality works as expected

### Production Deployment
- Only maintainers can deploy to production
- Deployment happens automatically on merge to main
- Monitor performance and errors after deployment

## 📞 Getting Help

### Communication Channels
- GitHub Issues: For bugs and feature requests
- GitHub Discussions: For questions and general discussion
- Email: development@acewebdesigners.com

### Code Review Process
- All code must be reviewed by at least one maintainer
- Address all review comments
- Ensure CI checks pass
- Squash commits before merging

## 🏆 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Company blog posts (with permission)
- LinkedIn recommendations (for significant contributions)

Thank you for contributing to Ace Web Designers! Your efforts help us provide better web design services to small businesses nationwide.

