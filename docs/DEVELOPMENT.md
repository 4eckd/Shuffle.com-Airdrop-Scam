# Development Setup Guide

![Development](https://img.shields.io/badge/development-active-orange.svg)
![Version](https://img.shields.io/badge/version-1.1.0--alpha-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3+-blue.svg)
![Testing](https://img.shields.io/badge/testing-jest-red.svg)
![Security](https://img.shields.io/badge/security-first-red.svg)

**⚠️ SECURITY WARNING**: This development environment is for analyzing malicious smart contracts. All development must maintain educational focus and security warnings.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/4eckd/Shuffle.com-Airdrop-Scam.git
   cd Shuffle.com-Airdrop-Scam
   ```

2. **Switch to enhancements branch**
   ```bash
   git checkout enhancements
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run development server with ts-node (hot reload) |
| `npm run start` | Run compiled JavaScript application |
| `npm test` | Run Jest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ci` | Run tests with CI configuration |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint code analysis |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |

## 🏗️ Project Structure

```
src/
├── config/
│   └── environment.ts      # Environment configuration with Zod validation
├── types/
│   └── index.ts           # TypeScript types and Zod schemas
├── utils/
│   └── validation.ts      # Contract validation and security utilities
└── index.ts               # Main application entry point

tests/
├── setup.ts               # Jest test configuration
└── validation.test.ts     # Validation utility tests
```

## 📋 Development Standards

### Code Quality Requirements

#### TypeScript Configuration
- **Strict Mode**: All TypeScript strict options enabled
- **Type Safety**: Comprehensive type definitions for all functions
- **Error Handling**: Proper error types and exception handling
- **Documentation**: TSDoc comments for all public APIs

#### Testing Standards
- **Unit Tests**: All utility functions must have unit tests
- **Coverage**: Minimum 80% code coverage required
- **Test Data**: Use realistic test fixtures
- **Security Tests**: Validate security-related functionality

#### Code Style
- **ESLint**: Follow configured ESLint rules
- **Prettier**: Consistent code formatting
- **Naming**: Clear, descriptive variable and function names
- **Comments**: Document complex logic and security considerations

### Security-First Development

#### Input Validation
- **Zod Schemas**: All input validation using Zod
- **Contract Addresses**: Validate Ethereum address format
- **Sanitization**: Clean input data to prevent injection attacks
- **Error Messages**: Secure error handling without information leakage

#### Environment Security
- **Environment Variables**: Use .env files for configuration
- **Secrets Management**: Never commit secrets to version control
- **Configuration Validation**: Validate all environment variables
- **Default Values**: Secure defaults for all configuration options

#### Known Threat Protection
- **Malicious Addresses**: Built-in validation against known malicious contracts
- **Pattern Detection**: Identify suspicious contract patterns
- **Warning Generation**: Automatic security warnings for threats
- **Safe Operations**: Ensure all operations are safe by default

## 🚀 ts-node Development

### Using ts-node for Development

The project uses ts-node for direct TypeScript execution during development:

```bash
# Run the application directly with ts-node
npm run dev

# Equivalent to:
ts-node --project tsconfig.json src/index.ts
```

### ts-node Configuration
- **Project Support**: Uses `tsconfig.json` for type checking
- **Hot Reload**: Automatic recompilation on file changes
- **Development Speed**: No build step required for testing
- **Type Safety**: Full TypeScript support during development

### Development vs Production
```bash
# Development (with ts-node)
npm run dev

# Production (compiled JavaScript)
npm run build
npm run start
```

## 🧪 Testing Guide

### Jest Testing Framework

The project uses Jest with TypeScript support and custom testing utilities:

#### Jest Configuration Features
- **ts-jest Preset**: Direct TypeScript test execution
- **Custom Matchers**: Security-focused test assertions
- **Coverage Reporting**: Minimum 80% coverage threshold
- **Test Timeouts**: 10-second timeout for security operations
- **Isolated Tests**: Each test runs in isolation for security

#### Custom Jest Matchers
```typescript
// Security-focused custom matchers
expect(address).toBeValidContractAddress();
expect(error).toBeSecurityError();
expect(validationError).toBeValidationError();
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run CI tests (with coverage)
npm run test:ci

# Run specific test file
npm test validation.test.ts
```

### Test Structure

```typescript
// Example test structure with custom matchers
describe('Security Utilities', () => {
  describe('Contract Address Validation', () => {
    it('validates correct contract addresses', () => {
      const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
      expect(validAddress).toBeValidContractAddress();
      expect(() => validateContractAddress(validAddress)).not.toThrow();
    });
    
    it('rejects invalid contract addresses', () => {
      const invalidAddress = '0x123';
      expect(() => validateContractAddress(invalidAddress))
        .toThrow(ValidationError);
    });

    it('handles malicious addresses with security warnings', () => {
      const maliciousAddress = '0xacba164135904dc63c5418b57ff87efd341d7c80';
      expect(() => generateMaliciousContractWarning(maliciousAddress))
        .not.toThrow();
    });
  });
});
```

### Test Data and Fixtures
- **Test Setup**: `tests/setup.ts` provides test configuration and fixtures
- **Contract Addresses**: Predefined valid/invalid addresses for testing
- **Security Scenarios**: Malicious contract address testing
- **Error Testing**: Comprehensive error condition coverage

### Jest Coverage Requirements
- **Minimum 80% Coverage**: All coverage metrics (lines, functions, branches, statements)
- **Security Focus**: Tests emphasize security validation and error handling
- **Realistic Data**: Test fixtures mirror real-world security scenarios

## 🔍 Code Review Process

### Pull Request Guidelines
1. **Branch Naming**: Use descriptive branch names (e.g., `feature/validation-improvements`)
2. **Commit Messages**: Clear, descriptive commit messages
3. **Documentation**: Update documentation for significant changes
4. **Testing**: Include tests for new functionality
5. **Security Review**: Ensure security considerations are addressed

### Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] All tests pass and coverage is maintained
- [ ] Security considerations are properly addressed
- [ ] Documentation is updated
- [ ] No sensitive information is exposed
- [ ] Error handling is comprehensive

## 🚨 Security Considerations

### Critical Security Rules
1. **Never Deploy**: Never deploy analyzed contracts to any blockchain
2. **No Interaction**: Never interact with malicious contract addresses
3. **Educational Purpose**: Maintain educational and research focus
4. **Warning Prominence**: Include security warnings in all outputs
5. **Safe Defaults**: Ensure all operations are safe by default

### Security Testing
- Test validation of malicious contract addresses
- Verify security warnings are generated correctly
- Ensure input sanitization prevents injection attacks
- Test error handling doesn't leak sensitive information

## 📚 Development Resources

### Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Zod Validation Library](https://zod.dev/)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)

### Internal Resources
- [Main Documentation](index.md)
- [Security Guidelines](../SECURITY.md)
- [Contribution Guidelines](../CONTRIBUTION.md)
- [API Documentation](api/README.md)

## 🔧 Troubleshooting

### Common Issues

#### TypeScript Compilation Errors
```bash
# Clear TypeScript cache
npm run build -- --force

# Check TypeScript configuration
npm run type-check
```

#### Test Failures
```bash
# Run tests in verbose mode
npm test -- --verbose

# Clear Jest cache
npm test -- --clearCache
```

#### Environment Issues
```bash
# Verify environment configuration
npm run type-check

# Check environment variables
echo $NODE_ENV
```

### Getting Help
- Check existing issues in the repository
- Review documentation and comments
- Follow security guidelines when asking for help
- Maintain confidentiality of sensitive information

---

*Development Guide Version: 1.1.0-alpha*  
*Last Updated: 2025-07-09T15:44:00Z*  
*Maintained by: Security Research Team*  
*Next Review: 2025-08-09*
