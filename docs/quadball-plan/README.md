# Quadball Canada Registration & Events Platform

The Quadball Canada platform is a comprehensive web application for managing sports league memberships, team rosters, event registrations, and payments. Built on modern web technologies, it provides a seamless experience for players, teams, and administrators to organize and participate in Quadball activities across Canada.

## Technical Approach

This project uses **TanStack Start's server functions** for type-safe client-server communication, not a traditional REST API. Server functions provide end-to-end type safety between the frontend and backend, eliminating entire classes of bugs and making development faster and more reliable.

## Key Documentation

### Getting Started

- [Architecture Overview](./architecture/overview.md) - System design, technology choices, and architectural decisions
- [Server Functions Guide](./api/server-functions.md) - How to create and use server functions
- [Database Schema](./database/schema-overview.md) - Data model relationships and RBAC design

### Developer Guides

- [Creating New Features](./implementation/feature-development.md) - Step-by-step guide for adding functionality
- [UI Component Guide](./ui-flows/component-guide.md) - Project-specific components and patterns
- [Integration Guide](./integrations/README.md) - External service configurations

### Project Structure

```
src/
├── features/           # Feature modules (auth, teams, events, etc.)
├── db/                # Database schema and connections
├── routes/            # File-based routing (TanStack Router)
├── shared/            # Shared UI components and utilities
└── lib/               # Core infrastructure and configuration
```

## Core Features

1. **Member Management** - User registration, profiles, and membership tiers
2. **Team Operations** - Team creation, roster management, and player assignments
3. **Event System** - Tournament and event creation with flexible registration
4. **Payment Processing** - Square integration for memberships and event fees
5. **Role-Based Access** - Granular permissions for different user types
6. **Communications** - Email notifications and in-app messaging
7. **Analytics** - Reporting dashboards for administrators

## Technology Stack

Built on the Solstice foundation:

- **TanStack Start** - Full-stack React framework with SSR
- **Better Auth** - Authentication with email/OAuth providers
- **Drizzle ORM** - Type-safe database operations with PostgreSQL
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling with shadcn/ui components
- **Square SDK** - Payment processing
- **Netlify** - Hosting with edge functions

## Development Workflow

1. **Server Functions** - All backend logic is implemented as server functions in feature directories
2. **Type Safety** - End-to-end type safety from database to UI
3. **Feature-Based** - Code organized by feature for better maintainability
4. **Database-First** - Schema defined in Drizzle, migrations managed automatically

For detailed implementation guidance, see the [Architecture Overview](./architecture/overview.md).
