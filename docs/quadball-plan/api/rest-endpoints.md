# REST API Endpoints

## Authentication & Authorization

All protected endpoints require authentication via Better Auth session cookies or Authorization header.

### Role-Based Access Control

- **Public**: No authentication required
- **Authenticated**: Valid session required
- **Member**: Active membership required
- **Team Lead**: Team leadership role required
- **Admin**: Global admin role required

## Authentication Endpoints

### `POST /api/auth/sign-in`

Sign in with email/password

```typescript
interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
  user: User;
  session: Session;
}
```

### `POST /api/auth/sign-up`

Create new account

```typescript
interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

interface SignUpResponse {
  user: User;
  session: Session;
}
```

### `POST /api/auth/oauth/google`

OAuth sign in with Google

```typescript
interface OAuthResponse {
  redirectUrl: string;
}
```

### `POST /api/auth/sign-out`

Sign out current session

```typescript
interface SignOutResponse {
  success: boolean;
}
```

## User Management

### `GET /api/users/me`

Get current user profile

- **Auth**: Authenticated

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  pronouns?: string;
  namePronunciation?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  emergencyContact?: EmergencyContact;
  privacySettings: PrivacySettings;
  demographics?: Demographics;
  profileCompleted: boolean;
  activeRoles: string[];
  activeTags: string[];
  activeMembership?: Membership;
}
```

### `PUT /api/users/me`

Update user profile

- **Auth**: Authenticated

```typescript
interface UpdateProfileRequest {
  name?: string;
  pronouns?: string;
  namePronunciation?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  emergencyContact?: EmergencyContact;
  privacySettings?: PrivacySettings;
  demographics?: Demographics;
}
```

### `GET /api/users/:id`

Get user profile (limited by privacy settings)

- **Auth**: Authenticated

```typescript
interface PublicUserProfile {
  id: string;
  name: string;
  pronouns?: string;
  // Other fields based on privacy settings
}
```

## Membership Management

### `GET /api/memberships/types`

Get available membership types

- **Auth**: Public

```typescript
interface MembershipType {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  validFromDate: string;
  validToDate: string;
  benefits: Record<string, any>;
}
```

### `GET /api/memberships/my`

Get current user's memberships

- **Auth**: Authenticated

```typescript
interface Membership {
  id: string;
  membershipType: MembershipType;
  status: string;
  purchaseDate: string;
  expiresAt: string;
  paidAmountCents: number;
  paymentId?: string;
}
```

### `POST /api/memberships/purchase`

Purchase membership

- **Auth**: Authenticated

```typescript
interface PurchaseMembershipRequest {
  membershipTypeId: string;
  paymentMethodId?: string;
}

interface PurchaseMembershipResponse {
  checkoutUrl: string;
  paymentId: string;
}
```

## Team Management

### `GET /api/teams`

List all teams

- **Auth**: Public

```typescript
interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  location?: string;
  foundedYear?: number;
  memberCount: number;
  isActive: boolean;
}
```

### `GET /api/teams/:id`

Get team details

- **Auth**: Public

```typescript
interface TeamDetails extends Team {
  primaryColor?: string;
  secondaryColor?: string;
  maxRosterSize: number;
  associatedTeamId?: string;
  associationType?: string;
  members: TeamMember[];
  recentGames: Game[];
}
```

### `POST /api/teams`

Create new team

- **Auth**: Team Lead or Admin

```typescript
interface CreateTeamRequest {
  name: string;
  slug: string;
  description?: string;
  location?: string;
  foundedYear?: number;
  primaryColor?: string;
  secondaryColor?: string;
  maxRosterSize?: number;
  associatedTeamId?: string;
  associationType?: string;
}
```

### `PUT /api/teams/:id`

Update team

- **Auth**: Team Lead or Admin

```typescript
interface UpdateTeamRequest {
  name?: string;
  description?: string;
  location?: string;
  primaryColor?: string;
  secondaryColor?: string;
  maxRosterSize?: number;
  associatedTeamId?: string;
  associationType?: string;
}
```

### `GET /api/teams/:id/members`

Get team roster

- **Auth**: Public

```typescript
interface TeamMember {
  id: string;
  user: PublicUserProfile;
  role: string;
  jerseyNumber?: number;
  position?: string;
  joinedAt: string;
  status: string;
}
```

### `POST /api/teams/:id/members`

Add team member

- **Auth**: Team Lead or Admin

```typescript
interface AddTeamMemberRequest {
  userId: string;
  role: string;
  jerseyNumber?: number;
  position?: string;
}
```

### `PUT /api/teams/:id/members/:memberId`

Update team member

- **Auth**: Team Lead or Admin

```typescript
interface UpdateTeamMemberRequest {
  role?: string;
  jerseyNumber?: number;
  position?: string;
  status?: string;
  notes?: string;
}
```

### `DELETE /api/teams/:id/members/:memberId`

Remove team member

- **Auth**: Team Lead or Admin

## Event Management

### `GET /api/events`

List events

- **Auth**: Public

```typescript
interface EventListItem {
  id: string;
  name: string;
  slug: string;
  eventType: string;
  location: string;
  startDate: string;
  endDate: string;
  feeCents: number;
  maxParticipants?: number;
  currentParticipants: number;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  status: string;
}
```

### `GET /api/events/:slug`

Get event details

- **Auth**: Public

```typescript
interface EventDetails extends EventListItem {
  description: string;
  locationDetails: Record<string, any>;
  customFields: Record<string, any>;
  registrationForm: FormField[];
  games: Game[];
  officials: Official[];
  canRegister: boolean;
  userRegistration?: EventRegistration;
}
```

### `POST /api/events`

Create event

- **Auth**: Event Coordinator or Admin

```typescript
interface CreateEventRequest {
  name: string;
  slug: string;
  description: string;
  eventType: string;
  location: string;
  locationDetails?: Record<string, any>;
  startDate: string;
  endDate: string;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  maxParticipants?: number;
  feeCents?: number;
  customFields?: Record<string, any>;
}
```

### `PUT /api/events/:id`

Update event

- **Auth**: Event Coordinator or Admin

```typescript
interface UpdateEventRequest {
  name?: string;
  description?: string;
  location?: string;
  locationDetails?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  maxParticipants?: number;
  feeCents?: number;
  customFields?: Record<string, any>;
  status?: string;
}
```

### `POST /api/events/:id/register`

Register for event

- **Auth**: Member

```typescript
interface EventRegistrationRequest {
  teamId?: string;
  registrationData: Record<string, any>;
}

interface EventRegistrationResponse {
  registrationId: string;
  checkoutUrl?: string;
  paymentId?: string;
}
```

### `GET /api/events/:id/registrations`

Get event registrations

- **Auth**: Event Coordinator or Admin

```typescript
interface EventRegistration {
  id: string;
  user: PublicUserProfile;
  team?: Team;
  registrationData: Record<string, any>;
  status: string;
  feePaidCents: number;
  paymentId?: string;
  registeredAt: string;
}
```

## Payment Management

### `GET /api/payments/my`

Get user's payments

- **Auth**: Authenticated

```typescript
interface Payment {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  items: PaymentItem[];
  receiptUrl?: string;
  createdAt: string;
}
```

### `GET /api/payments/:id`

Get payment details

- **Auth**: Owner or Admin

```typescript
interface PaymentDetails extends Payment {
  providerPaymentId: string;
  metadata: Record<string, any>;
}
```

### `POST /api/payments/webhook/square`

Square webhook handler

- **Auth**: Webhook signature validation

```typescript
interface SquareWebhookPayload {
  merchant_id: string;
  location_id: string;
  event_type: string;
  data: Record<string, any>;
}
```

## Shopping Cart

### `GET /api/cart`

Get current cart

- **Auth**: Authenticated

```typescript
interface ShoppingCart {
  id: string;
  items: CartItem[];
  totalCents: number;
  expiresAt: string;
  status: string;
}
```

### `POST /api/cart/items`

Add item to cart

- **Auth**: Authenticated

```typescript
interface AddCartItemRequest {
  itemType: string;
  itemId: string;
  quantity?: number;
}
```

### `PUT /api/cart/items/:id`

Update cart item

- **Auth**: Authenticated

```typescript
interface UpdateCartItemRequest {
  quantity: number;
}
```

### `DELETE /api/cart/items/:id`

Remove item from cart

- **Auth**: Authenticated

### `POST /api/cart/checkout`

Checkout cart

- **Auth**: Authenticated

```typescript
interface CheckoutRequest {
  paymentMethodId?: string;
}

interface CheckoutResponse {
  checkoutUrl: string;
  paymentId: string;
}
```

## Administration

### `GET /api/admin/users`

List all users

- **Auth**: Admin

```typescript
interface AdminUserList {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### `PUT /api/admin/users/:id/roles`

Update user roles

- **Auth**: Admin

```typescript
interface UpdateUserRolesRequest {
  roles: Array<{
    role: string;
    scope?: string;
    expiresAt?: string;
  }>;
}
```

### `PUT /api/admin/users/:id/tags`

Update user tags

- **Auth**: Admin

```typescript
interface UpdateUserTagsRequest {
  tags: Array<{
    tag: string;
    value?: string;
  }>;
}
```

### `GET /api/admin/analytics`

Get system analytics

- **Auth**: Admin

```typescript
interface Analytics {
  userStats: {
    totalUsers: number;
    activeMembers: number;
    newThisMonth: number;
  };
  membershipStats: {
    totalRevenue: number;
    activeSubscriptions: number;
    expiringThisMonth: number;
  };
  eventStats: {
    totalEvents: number;
    upcomingEvents: number;
    totalParticipants: number;
  };
}
```

## Error Responses

All endpoints return consistent error responses:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  path: string;
}
```

### Common Error Codes

- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `INTERNAL_ERROR` - Server error

## Rate Limiting

Rate limiting is not implemented initially but can be added later if needed.

## Webhooks

### Square Payment Webhooks

- `payment.created` - Payment initiated
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded

### Email Webhooks (SendGrid)

- `delivered` - Email delivered
- `opened` - Email opened
- `clicked` - Link clicked
- `bounced` - Email bounced
- `unsubscribed` - User unsubscribed

## API Versioning

All endpoints are versioned using URL path:

- Current version: `/api/v1/`
- All endpoints documented above assume v1

### Version Headers

```
API-Version: 1.0
Accept: application/json
Content-Type: application/json
```
