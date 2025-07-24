# Roundup Games Platform

The Roundup Games platform is comprehensive, easy-to-use platform for connecting tabletop and board game enthusiasts, helping them organize game sessions, longer running campaigns, event registrations, player memberships, team profiles, and administrative tasks. Built on modern web technologies with type-safe, full-stack architecture.

## Current Features

| Feature            | Status         | Description                                               |
| ------------------ | -------------- | --------------------------------------------------------- |
| **Authentication** | ✅ Complete    | Email/password and OAuth login via Better Auth            |
| **User Profiles**  | ✅ Complete    | Member profiles with privacy settings                     |
| **Dashboard**      | ✅ Complete    | Authenticated user dashboard                              |
| **Theme Support**  | ✅ Complete    | Light/dark mode with system preference                    |
| **Teams**          | ✅ Complete    | Team creation and management                              |
| **Events**         | 🚧 In Progress | Organizers UI shipped; E2E coverage + invites pending     |
| **Payments**       | 🚧 In Progress | Square checkout live; webhook reconciliation outstanding  |
| **Email**          | 🚧 In Progress | SendGrid service ready; invitations/notifications missing |
| **Analytics**      | ⏳ Planned     | Admin reporting dashboard                                 |

## Project Documentation

- **[Architecture Overview](./architecture/overview.md)** - System design and technology decisions
- **[Server Functions Guide](./api/server-functions.md)** - Backend implementation patterns
- **[Database Schema](./database/schema-overview.md)** - Data model and relationships
- **[Component Guide](./ui-flows/component-guide.md)** - UI patterns and components
- **[Roadmap](https://github.com/vburghelea/roundup-games/projects/1)** - Future development plans

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
