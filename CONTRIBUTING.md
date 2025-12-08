# Contributing to PinePaper MCP Server

Thank you for your interest in contributing to PinePaper MCP Server! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git
- A code editor (VS Code recommended)

### Setup

1. Fork the repository on GitHub

2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-server.git
   cd mcp-server
   ```

3. Install dependencies:
   ```bash
   # Using bun (recommended)
   bun install

   # Using npm
   npm install
   ```

4. Build the project:
   ```bash
   # Using bun
   bun run build

   # Using npm
   npm run build
   ```

5. Run tests to verify setup:
   ```bash
   # Using bun
   bun test

   # Using npm
   npm test
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests:
   ```bash
   bun test
   ```

4. Build to check for TypeScript errors:
   ```bash
   bun run build
   ```

5. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add new feature description"
   ```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add pinepaper_clear_canvas tool
fix: resolve item deletion failing on template items
docs: update README with bun instructions
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use explicit return types for functions
- Use meaningful variable names

### Tool Descriptions

When adding or modifying MCP tools, ensure descriptions include:

1. **USE WHEN** - Clear scenarios for when to use the tool
2. **IMPORTANT** - Any critical notes for the AI agent
3. **EXAMPLES** - Concrete examples showing usage

Example:
```typescript
{
  name: 'pinepaper_example_tool',
  description: `Brief description of what the tool does.

USE WHEN:
- Scenario 1
- Scenario 2

IMPORTANT:
- Critical note 1
- Critical note 2

EXAMPLES:
- "User request" → tool parameters`,
}
```

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/__tests__/unit/code-generator.test.ts

# Run with coverage
bun test --coverage
```

### Writing Tests

- Place unit tests in `src/__tests__/unit/`
- Place integration tests in `src/__tests__/integration/`
- Use descriptive test names
- Test both success and error cases

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update the README if adding new features
4. Create a pull request with:
   - Clear title describing the change
   - Description of what and why
   - Link to related issues (if any)

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows project style
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow convention
- [ ] No sensitive data included

## Adding New Tools

When adding a new MCP tool:

1. Add the tool definition in `src/tools/definitions.ts`
2. Add the handler in `src/tools/handlers.ts`
3. Add code generator function in `src/types/code-generator.ts` (if needed)
4. Add tests for the new tool
5. Update the README tools reference table

## Reporting Issues

When reporting bugs, please include:

- Node.js/Bun version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## Questions?

- Open a GitHub issue for questions
- Email: support@pinepaper.studio

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
