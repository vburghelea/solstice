# Technology Stack & Rationale

## Core Framework: TanStack Start

### Why TanStack Start?

- **Full-stack React**: Single codebase for frontend and backend
- **File-based routing**: Intuitive route organization
- **Server functions**: Type-safe RPC-style API calls
- **SSR/SSG hybrid**: Optimal performance for public and dynamic pages

### Benefits for Quadball Canada

- Fast initial page loads for event discovery
- SEO-friendly public pages
- Real-time updates for live scores
- Progressive enhancement for accessibility

## Authentication: Better Auth

### Why Better Auth?

- **Built for modern stacks**: First-class support for serverless
- **Database adapter**: Direct Drizzle ORM integration
- **OAuth ready**: Google provider included
- **Extensible**: Custom fields, hooks, middleware

### Implementation Details

```typescript
// Clean session augmentation
declare module "better-auth" {
  interface Session {
    user: User & {
      roles: string[];
      tags: string[];
      activeTeamId?: string;
    };
  }
}
```

## Database: PostgreSQL + Drizzle ORM

### Why PostgreSQL?

- **ACID compliance**: Critical for financial transactions
- **JSON support**: Flexible schema for custom forms
- **Full-text search**: Event and member search
- **Row-level security**: Future multi-tenant support

### Why Drizzle?

- **Type safety**: Schema as source of truth
- **Performance**: Minimal overhead, prepared statements
- **Migrations**: Version-controlled schema changes
- **SQL-like**: Familiar syntax, no magic

### Neon Serverless PostgreSQL

- **Connection pooling**: Built-in pgBouncer
- **Serverless scaling**: Pay per usage
- **Branching**: Preview deploys get isolated DBs
- **Point-in-time recovery**: 30-day backup retention

## Hosting: Netlify

### Why Netlify?

- **Edge functions**: Global low-latency responses
- **Preview deploys**: Automatic PR environments
- **Native Neon integration**: DATABASE_URL injection
- **DDoS protection**: Built-in security

### Edge Functions Use Cases

- Security headers injection
- Geolocation for event discovery
- A/B testing for UX improvements
- Request rate limiting

## Payment Processing: Square

### Why Square?

- **Canadian support**: Full feature parity
- **Competitive rates**: 2.9% + 30¢ per transaction
- **Hosted checkout**: PCI compliance handled
- **Developer-friendly**: Excellent SDKs and docs
- **Alternative payment**: E-transfer option for users who prefer manual transfer

### Integration Architecture

```typescript
// Webhook handler pattern
export async function handleSquareWebhook(event: SquareEvent) {
  // Verify signature
  const isValid = await verifyWebhookSignature(event);

  // Process in transaction
  await db.transaction(async (tx) => {
    // Update payment record
    // Update membership status
    // Send confirmation email
  });
}
```

## UI Framework: Tailwind CSS + shadcn/ui

### Why This Combo?

- **Tailwind**: Utility-first, small bundle size
- **shadcn/ui**: Copy-paste components, full control
- **Radix UI**: Accessible primitives
- **TypeScript**: Type-safe props and variants

### Component Architecture

```typescript
// Composable, accessible components
<Card>
  <CardHeader>
    <CardTitle>Team Roster</CardTitle>
  </CardHeader>
  <CardContent>
    <DataTable columns={columns} data={players} />
  </CardContent>
</Card>
```

## State Management: TanStack Query + Zustand

### Why TanStack Query?

- **Server state**: Cache, refetch, optimistic updates
- **DevTools**: Inspect cache and queries
- **Suspense ready**: Streaming SSR support

### Why Zustand (for client state)?

- **Minimal boilerplate**: Simple stores
- **TypeScript first**: Inferred types
- **Devtools support**: Time-travel debugging

## Email Service: SendGrid

### Why SendGrid?

- **Deliverability**: Industry-leading inbox rates
- **Templates**: Drag-drop editor for non-devs
- **Analytics**: Open rates, click tracking
- **Scale**: 100k emails/month on free tier
- **Reliability**: Single provider simplifies integration

## File Storage: Cloudinary

### Why Cloudinary?

- **On-the-fly transformations**: Resize, crop, optimize
- **CDN delivery**: Global edge locations
- **Upload widget**: Drop-in file upload UI
- **Free tier**: 25GB storage, 25GB bandwidth

### Use Cases

- Team logos with consistent sizing
- Event photos with watermarks
- Video highlights with streaming
- Member avatars with privacy options

## Testing Stack

### Vitest

- **Fast**: ESBuild-powered
- **Compatible**: Jest-like API
- **UI Mode**: Interactive test runner

### Testing Library

- **User-centric**: Test behavior, not implementation
- **Accessible**: Encourages a11y best practices
- **Framework agnostic**: Works with any renderer

### Playwright (E2E)

- **Cross-browser**: Chrome, Firefox, Safari
- **Auto-wait**: Reliable, flake-free tests
- **Tracing**: Debug with screenshots/videos

## Development Tools

### TypeScript

- **Strict mode**: Catch errors at compile time
- **Project references**: Modular compilation
- **Path aliases**: Clean imports

### ESLint + Prettier

- **Consistent style**: Auto-formatting
- **Best practices**: React rules, a11y checks
- **Git hooks**: Format on commit

### pnpm

- **Disk efficient**: Shared dependency storage
- **Fast**: Parallel installation
- **Workspaces**: Monorepo support (future)

## Monitoring & Analytics

### Sentry (Errors)

- **Real-time alerts**: Slack/email notifications
- **Source maps**: Readable stack traces
- **Performance**: Core Web Vitals tracking

### Posthog (Analytics)

- **Privacy-first**: GDPR compliant
- **Feature flags**: Gradual rollouts
- **Session recording**: Debug user issues

### Datadog (APM)

- **Distributed tracing**: Full request lifecycle
- **Custom metrics**: Business KPIs
- **Log aggregation**: Centralized debugging

## Future Considerations

### GraphQL (Potential)

- Consider for mobile app API
- Efficient data fetching
- Schema stitching for microservices

### Redis (Potential)

- Session storage at scale
- Rate limiting state
- Real-time leaderboards

### WebSockets (Potential)

- Live score updates
- Real-time notifications
- Collaborative team management
