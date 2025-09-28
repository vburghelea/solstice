# Roundup Games Platform

The Roundup Games platform is comprehensive, easy-to-use platform for connecting tabletop and board game enthusiasts, helping them organize game sessions, longer running campaigns, event registrations, player memberships, team profiles, and administrative tasks. Built on modern web technologies with type-safe, full-stack architecture.

## Current Features

| Feature            | Status         | Description                                              |
| ------------------ | -------------- | -------------------------------------------------------- |
| **Authentication** | ✅ Complete    | Email/password and OAuth login via Better Auth           |
| **User Profiles**  | ✅ Complete    | Member profiles with privacy settings                    |
| **Dashboard**      | ✅ Complete    | Authenticated user dashboard                             |
| **Theme Support**  | ✅ Complete    | Light/dark mode with system preference                   |
| **Teams**          | ✅ Complete    | Team creation and management                             |
| **Events**         | 🚧 In Progress | Organizers UI shipped; E2E coverage + invites pending    |
| **Payments**       | 🚧 In Progress | Square checkout live; webhook reconciliation outstanding |
| **Email**          | 🚧 In Progress | Resend service ready; invitations/notifications missing  |
| **Analytics**      | ⏳ Planned     | Admin reporting dashboard                                |

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

## Connections & Teammates Visibility

Some lists and actions are gated by social relationships to reduce unwanted interactions:

- Games and Campaigns marked `protected` are presented as “Connections & Teammates”. They are visible in lists and eligible for “apply” only when the viewer is socially connected to the organizer (either follow direction), actively on the same team, and neither side has blocked the other.
- Direct navigation to a protected item still honors block rules; if blocked, the UI renders a neutral restriction banner without leaking private state.
- Admin/mod tooling may bypass in moderation contexts but should avoid leaking state on user-facing surfaces.

Developer notes:

- Back-end queries enforce “connections & teammates” by requiring a follower/followed-by relation or a shared active team (and absence of blocks).
- Client surfaces should hide or disable “Apply” when the viewer and organizer are blocked either way.
