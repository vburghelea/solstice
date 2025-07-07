# Quadball Canada Platform

The Quadball Canada platform is a comprehensive sports league management system that handles member registration, team management, event coordination, and payment processing. Built on modern web technologies with type-safe, full-stack architecture.

## Current Features

| Feature            | Status         | Description                                    |
| ------------------ | -------------- | ---------------------------------------------- |
| **Authentication** | ✅ Complete    | Email/password and OAuth login via Better Auth |
| **User Profiles**  | ✅ Complete    | Member profiles with privacy settings          |
| **Dashboard**      | ✅ Complete    | Authenticated user dashboard                   |
| **Theme Support**  | ✅ Complete    | Light/dark mode with system preference         |
| **Teams**          | 🚧 In Progress | Team creation and management                   |
| **Events**         | ⏳ Planned     | Tournament and event system                    |
| **Payments**       | ⏳ Planned     | Square integration for fees                    |
| **Email**          | ⏳ Planned     | SendGrid notifications                         |
| **Analytics**      | ⏳ Planned     | Admin reporting dashboard                      |

## Project Documentation

- **[Architecture Overview](./architecture/overview.md)** - System design and technology decisions
- **[Server Functions Guide](./api/server-functions.md)** - Backend implementation patterns
- **[Database Schema](./database/schema-overview.md)** - Data model and relationships
- **[Component Guide](./ui-flows/component-guide.md)** - UI patterns and components
- **[Roadmap](https://github.com/your-org/quadball-canada/projects/1)** - Future development plans

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
netlify dev

# Run tests
pnpm test
```

For detailed setup instructions, see the main [project README](../../README.md).
