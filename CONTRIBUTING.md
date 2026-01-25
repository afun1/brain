# Contributing to Brain Entrainer

Thank you for your interest in contributing to Brain Entrainer! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/brain-entrainer.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages: `git commit -m "Add: feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Set up database
npm run db:push

# Start development server
npm run dev
```

## Code Standards

- Follow existing code style
- Run `npm run lint:fix` before committing
- Run `npm run format` to format code
- Ensure `npm run typecheck` passes
- Add comments for complex logic

## Commit Message Guidelines

- **Add:** New feature
- **Fix:** Bug fix
- **Update:** Update existing feature
- **Refactor:** Code refactoring
- **Docs:** Documentation changes
- **Style:** Code style changes (formatting)
- **Test:** Adding tests

## Pull Request Process

1. Update README.md if needed
2. Ensure all tests pass (when available)
3. Update documentation
4. Request review from maintainers

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Need Help?

Open an issue or ask questions in pull requests. We're here to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
