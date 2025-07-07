# Architecture Overview

## System Architecture

The Quadball Canada platform is built on a modern, type-safe full-stack architecture that prioritizes developer experience, performance, and scalability.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│                                                                  │
│  Browser → TanStack Router → React Components → TanStack Query  │
│                                ↓                                 │
│                         Server Functions                         │
│                                ↓                                 │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Server Layer                              │
│                                                                  │
│  TanStack Start → Better Auth → Business Logic → Drizzle ORM    │
│                                                        ↓         │
│                                                   PostgreSQL     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│                                                                  │
│  Square (Payments) • SendGrid (Email) • Cloudinary (Media)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Why This Architecture?

### TanStack Start (Full-Stack Framework)

We chose TanStack Start as our foundation because:

- **Type Safety**: End-to-end TypeScript from database to UI eliminates entire classes of bugs
- **Server Functions**: RPC-style calls are simpler and safer than REST APIs
- **File-Based Routing**: Intuitive organization that scales with the application
- **SSR/Hydration**: Optimal performance for both SEO and interactivity

### PostgreSQL + Drizzle ORM (Database)

This combination provides:

- **ACID Compliance**: Critical for financial transactions and data integrity
- **Type-Safe Queries**: Drizzle generates TypeScript types from your schema
- **SQL-Like Syntax**: No magic ORM abstractions, just clean SQL operations
- **Serverless Ready**: Neon provides connection pooling perfect for edge deployments

### Better Auth (Authentication)

Better Auth was selected for:

- **Modern Architecture**: Built specifically for serverless/edge environments
- **Database Integration**: Works seamlessly with Drizzle ORM
- **Extensibility**: Easy to add custom fields and authentication methods
- **Session Management**: Secure, performant session handling out of the box

### React Query (State Management)

For server state synchronization:

- **Intelligent Caching**: Reduces unnecessary network requests
- **Optimistic Updates**: Instant UI feedback for better UX
- **Background Refetching**: Keeps data fresh without user intervention
- **Offline Support**: Works seamlessly with spotty connections

## Core Architectural Principles

### 1. Feature-Based Organization

```
src/features/
├── auth/           # Authentication logic
├── teams/          # Team management
├── events/         # Event operations
├── payments/       # Payment processing
└── analytics/      # Reporting & insights
```

Each feature is self-contained with its own:

- Server functions (`.queries.ts`, `.mutations.ts`)
- React components
- Types and schemas
- Tests

### 2. Type Safety Everywhere

From database to UI, types flow through the entire stack:

```typescript
// Database schema (source of truth)
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
});

// Automatically inferred types
type Team = InferSelectModel<typeof teams>;

// Type-safe server function
export const getTeam = serverOnly(async (id: string): Promise<Team> => {
  // Implementation
});

// Type-safe client usage
const { data: team } = useQuery({
  queryKey: ["team", id],
  queryFn: () => getTeam(id), // Full type inference
});
```

### 3. Security First

- **Authentication**: Every server function can access the current user context
- **Authorization**: Role-based access control (RBAC) with hierarchical permissions
- **Data Validation**: Zod schemas validate input at the edge
- **SQL Injection Protection**: Parameterized queries via Drizzle
- **XSS Prevention**: React's built-in protections + CSP headers

### 4. Performance Optimization

- **Edge Deployment**: Functions run close to users via Netlify Edge
- **Connection Pooling**: Neon's pgBouncer handles database connections efficiently
- **Intelligent Caching**: React Query + CDN caching for static assets
- **Code Splitting**: Route-based chunks load on demand
- **Image Optimization**: Cloudinary handles responsive images

## Data Flow

### 1. User Action

```
User clicks "Create Team" button
    ↓
React component calls mutation
    ↓
TanStack Query invokes server function
    ↓
Server function validates input
    ↓
Drizzle ORM executes transaction
    ↓
PostgreSQL stores data
    ↓
Server function returns result
    ↓
React Query updates cache
    ↓
UI reflects new state
```

### 2. External Integration

```
Square webhook received
    ↓
Netlify Edge Function validates signature
    ↓
Server function processes payment
    ↓
Database transaction updates records
    ↓
Email service sends confirmation
    ↓
Audit log records event
```

## Deployment Architecture

### Local Development

- **Vite**: Fast HMR for instant feedback
- **Netlify Dev**: Simulates edge functions locally
- **Docker**: Optional PostgreSQL container

### Production

- **Netlify**: Automatic deployments from Git
- **Neon**: Managed PostgreSQL with automatic scaling
- **Cloudinary**: Global CDN for media files
- **Square**: PCI-compliant payment processing

## Technology Rationale

### Square for Payments

- Full Canadian support with competitive rates
- Hosted checkout eliminates PCI compliance burden
- Robust webhook system for async processing
- E-transfer alternative for bank transfer preference

### SendGrid for Email

- Industry-leading deliverability rates
- Template system for consistent branding
- Detailed analytics and tracking
- Generous free tier for starting out

### Netlify + Neon

- Seamless integration with automatic env injection
- Preview deployments with database branching
- Edge functions for global low latency
- Built-in DDoS protection

### Tailwind + shadcn/ui

- Utility-first CSS keeps bundle size small
- shadcn/ui provides accessible, customizable components
- No runtime CSS-in-JS overhead
- Consistent design system out of the box

## Scalability Considerations

### Database

- Connection pooling handles traffic spikes
- Read replicas for analytics queries (future)
- Partitioning for large tables (future)

### Application

- Serverless functions auto-scale
- CDN serves static assets globally
- React Query prevents thundering herd

### Cost

- Pay-per-use model scales with revenue
- Free tiers cover initial growth
- Predictable pricing as you scale

## Monitoring & Observability

### Application Health

- Sentry for error tracking and performance monitoring
- Netlify Analytics for traffic insights
- Custom dashboards for business metrics

### Business Metrics

- Member growth and retention
- Event participation rates
- Payment success/failure rates
- Feature adoption tracking

## Future Considerations

As the platform grows, we may consider:

### GraphQL API

- For mobile app development
- More efficient data fetching
- Schema introspection

### Real-time Features

- WebSockets for live scores
- Push notifications
- Collaborative editing

### Advanced Analytics

- Data warehouse integration
- Machine learning for predictions
- Advanced reporting tools

The architecture is designed to evolve with the platform's needs while maintaining the core principles of type safety, performance, and developer experience.
