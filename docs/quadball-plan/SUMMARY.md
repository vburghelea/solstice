# Quadball Canada Platform - Documentation Overview

## Quick Links

### Core Documentation

- [README](./README.md) - Project overview and navigation
- [Architecture Overview](./architecture/overview.md) - System design and technology choices
- [Server Functions Guide](./api/server-functions.md) - Backend implementation patterns
- [Database Schema](./database/schema-overview.md) - Data model and relationships

### Developer Guides

- [External Integrations](./integrations/README.md) - Square, SendGrid, and other services
- [Component Guide](./ui-flows/component-guide.md) - UI components and patterns
- [User Journeys](./ui-flows/user-journeys.md) - User flows through the platform

## Project Overview

The Quadball Canada platform is a comprehensive sports league management system built on modern web technologies. It handles member registration, team management, event coordination, and payment processing.

### Key Features

1. **Member Management** - Registration, profiles, and membership purchases
2. **Team Operations** - Roster management and team administration
3. **Event System** - Tournament creation and registration
4. **Payment Processing** - Square integration with e-transfer support
5. **Communications** - Email notifications and bulk messaging
6. **Analytics** - Reporting dashboards for administrators

### Technical Stack

- **Framework**: TanStack Start (full-stack React with SSR)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with OAuth support
- **Hosting**: Netlify with edge functions
- **Payments**: Square API
- **Email**: SendGrid

### Architecture Highlights

- **Type-Safe**: End-to-end TypeScript from database to UI
- **Server Functions**: RPC-style backend calls instead of REST
- **Feature-Based**: Code organized by business domain
- **Performance**: Server-side rendering with intelligent caching

## Getting Started

### For Developers

1. Review the [Architecture Overview](./architecture/overview.md) to understand the system
2. Read the [Server Functions Guide](./api/server-functions.md) for backend patterns
3. Check the [Database Schema](./database/schema-overview.md) for data relationships
4. See the [Component Guide](./ui-flows/component-guide.md) for UI development

### For Project Managers

1. Start with the [README](./README.md) for project scope
2. Review [User Journeys](./ui-flows/user-journeys.md) for user flows
3. Check [External Integrations](./integrations/README.md) for third-party dependencies

## Documentation Structure

```
docs/quadball-plan/
├── README.md                    # Project overview
├── SUMMARY.md                   # This file
├── architecture/
│   └── overview.md             # System design and tech choices
├── database/
│   └── schema-overview.md      # Database design and relationships
├── api/
│   └── server-functions.md     # Backend implementation guide
├── integrations/
│   └── README.md               # External service configurations
└── ui-flows/
    ├── component-guide.md      # UI component patterns
    └── user-journeys.md        # User flow documentation
```

## Key Principles

### Development Philosophy

1. **Type Safety First** - Leverage TypeScript throughout
2. **Developer Experience** - Clear patterns and good tooling
3. **Performance** - Fast initial loads and smooth interactions
4. **Accessibility** - WCAG compliance built in
5. **Security** - Defense in depth approach

### Documentation Standards

- **Current State** - Docs reflect actual implementation
- **Practical Focus** - How-to guides over theory
- **Living Documents** - Updated as code evolves
- **Single Source of Truth** - Avoid duplication

## Support

For questions or clarifications:

1. Check existing documentation first
2. Review code examples in the codebase
3. Consult team leads for architectural decisions
4. Create issues for documentation improvements

---

**Status**: Documentation simplified and aligned with codebase
**Last Updated**: Current with project state
**Maintained By**: Development team
