# Architecture Overview - Quadball Canada Platform

## System Architecture

The Quadball Canada platform extends the Solstice foundation with a feature-driven architecture optimized for sports league management.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Public Site   │  │  Member App  │  │   Admin Panel    │  │
│  │  (SSR + Hydrate)│  │ (Protected)  │  │  (Role-based)    │  │
│  └─────────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┴───────────────────────────────────┐
│                     Netlify Edge Network                         │
│  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Edge Functions  │  │  Static Assets  │  │  CDN Cache    │  │
│  │  (Security)      │  │  (JS/CSS/IMG)   │  │               │  │
│  └──────────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                    TanStack Start Application                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Route Handlers                          │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │  │
│  │  │  Auth   │  │  Teams  │  │ Events  │  │  Payments   │ │  │
│  │  │ Routes  │  │ Routes  │  │ Routes  │  │  Webhooks   │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Feature Modules                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │   Auth   │  │ Profile  │  │  Teams   │  │  Events  │ │  │
│  │  │ (Better  │  │ (Forms)  │  │ (Roster) │  │(Register)│ │  │
│  │  │  Auth)   │  │          │  │          │  │          │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │ Payments │  │Messaging │  │Analytics │  │  Admin   │ │  │
│  │  │ (Square) │  │(SendGrid)│  │ (Charts) │  │  Tools   │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Core Services                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │   RBAC   │  │  Email   │  │ Payment  │  │  Cache   │ │  │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                        Data Layer                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Drizzle ORM                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │   Auth   │  │  Users   │  │  Teams   │  │  Events  │ │  │
│  │  │  Tables  │  │ Profile  │  │ Members  │  │  Regs    │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (Neon Serverless)                  │  │
│  │  ┌─────────────────┐           ┌─────────────────┐        │  │
│  │  │  Pooled Conn    │           │  Unpooled Conn  │        │  │
│  │  │  (API Routes)   │           │  (Migrations)   │        │  │
│  │  └─────────────────┘           └─────────────────┘        │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                    External Services                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Square  │  │ SendGrid │  │   S3/    │  │ Social APIs  │    │
│  │ Payments │  │  Email   │  │Cloudinary│  │ (IG/FB/etc)  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Core Architectural Principles

### 1. Feature-Driven Development

Each major capability is encapsulated in a feature module under `src/features/`:

- **Isolation**: Features contain their own components, hooks, and business logic
- **Composability**: Features expose clean APIs for cross-feature integration
- **Testability**: Each feature can be tested in isolation

### 2. Server-First Architecture

Leveraging TanStack Start's SSR capabilities:

- **Server Functions**: Database queries and business logic run server-side
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Type Safety**: End-to-end type safety from database to UI

### 3. Role-Based Access Control (RBAC)

Hierarchical permission system:

```
global_admin
├── event_coordinator
│   └── team_lead
│       └── player
└── referee
    └── volunteer
```

### 4. Event-Driven Communication

Key actions trigger system events:

- Member registration → Welcome email
- Payment completion → Confirmation + roster update
- Event registration deadline → Reminder notifications

### 5. Data Consistency & Integrity

- **Transactions**: Critical operations (payment + registration) use DB transactions
- **Validation**: Schema validation at API boundary AND database level
- **Audit Trail**: All financial transactions logged with metadata

## Security Architecture

### Authentication & Authorization

- **Better Auth**: Handles session management, OAuth flow
- **JWT Tokens**: Stateless auth for API endpoints
- **Role Middleware**: Route-level permission checks

### Data Protection

- **Encryption**: All PII encrypted at rest
- **HTTPS Only**: Enforced via edge functions
- **CSP Headers**: Prevent XSS attacks
- **Rate Limiting**: Configurable per endpoint

### Payment Security

- **PCI Compliance**: Square handles all card data
- **Webhook Validation**: Cryptographic signature verification
- **Idempotency**: Prevent duplicate charges

## Performance Considerations

### Caching Strategy

1. **CDN Cache**: Static assets, public pages
2. **React Query**: Client-side data caching
3. **Database Pooling**: Connection reuse
4. **Edge Caching**: Frequently accessed data

### Scalability

- **Serverless Functions**: Auto-scale with demand
- **Database Pooling**: Handle concurrent connections
- **Asset Optimization**: Image resizing, lazy loading
- **Code Splitting**: Route-based chunks

## Integration Points

### Payment Processing (Square)

- Hosted checkout for PCI compliance
- Webhook handlers for async events
- Refund API integration

### Email Services (SendGrid/Resend)

- Transactional emails (confirmations)
- Bulk messaging (announcements)
- Template management

### Media Storage (S3/Cloudinary)

- Event photos/videos
- Team logos
- User avatars

### Social Media

- Instagram/Facebook feed embeds
- Event sharing
- Team updates

## Development Workflow

### Local Development

```bash
# Start all services
netlify dev

# Run database migrations
pnpm db:push

# Run tests
pnpm test
```

### Deployment Pipeline

1. PR created → Preview deploy
2. Tests pass → Merge to main
3. Main push → Production deploy
4. Post-deploy → Health checks

## Monitoring & Observability

### Application Monitoring

- **Error Tracking**: Sentry integration
- **Performance**: Core Web Vitals
- **Uptime**: Netlify monitoring

### Business Metrics

- Member growth rate
- Event attendance
- Payment success rate
- User engagement

## Disaster Recovery

### Backup Strategy

- **Database**: Daily automated backups
- **Media Files**: S3 versioning
- **Configuration**: Git-tracked

### Incident Response

1. Alert triggered
2. Rollback if needed
3. Root cause analysis
4. Post-mortem documentation
