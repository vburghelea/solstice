# Design Document

## Overview

The user profile extension enhances the existing Better Auth user system by adding comprehensive profile fields required for membership management, team participation, and age verification. This design extends the current `user` table with additional columns while maintaining backward compatibility and following established patterns in the codebase.

The solution provides a foundation for profile completion validation, privacy settings management, and audit trail functionality that will support downstream features like membership purchases and team roster management.

## Architecture

### Database Layer Design

The design extends the existing `user` table in `src/db/schema/auth.schema.ts` rather than creating a separate profile table. This approach:

- Maintains referential integrity with existing Better Auth relationships
- Simplifies queries by avoiding joins for basic profile data
- Follows the established pattern of extending core entities
- Supports the existing authentication flow without breaking changes

### Schema Extension Strategy

```typescript
// Additional fields to be added to the existing user table
export const user = pgTable("user", {
  // ... existing fields (id, name, email, etc.)

  // Profile completion tracking
  profileComplete: boolean("profile_complete")
    .$defaultFn(() => false)
    .notNull(),

  // Required profile fields
  dateOfBirth: timestamp("date_of_birth"),
  emergencyContact: text("emergency_contact"), // JSON string

  // Optional profile fields
  gender: text("gender"),
  pronouns: text("pronouns"),
  phone: text("phone"),

  // Privacy and preferences
  privacySettings: text("privacy_settings"), // JSON string

  // Audit and versioning
  profileVersion: integer("profile_version")
    .$defaultFn(() => 1)
    .notNull(),
  profileUpdatedAt: timestamp("profile_updated_at").$defaultFn(() => new Date()),
});
```

### Data Validation Strategy

Profile data will be validated using Zod schemas that enforce:

- Date of birth format validation and reasonable age ranges
- Emergency contact structure (name, relationship, phone/email)
- Privacy settings structure validation
- Optional field constraints (pronouns, gender options)

## Components and Interfaces

### Server Functions Architecture

The design follows the established feature-based organization pattern:

```
src/features/profile/
├── profile.queries.ts     # Read operations
├── profile.mutations.ts   # Write operations
├── profile.types.ts       # TypeScript interfaces
├── profile.schemas.ts     # Zod validation schemas
└── __tests__/
    ├── profile.queries.test.ts
    └── profile.mutations.test.ts
```

### Core Server Functions

#### Query Functions

- `getUserProfile(userId: string)` - Retrieve complete user profile
- `getProfileCompletionStatus(userId: string)` - Check if profile is complete
- `validateProfileData(profileData: ProfileInput)` - Validate profile input

#### Mutation Functions

- `updateUserProfile(userId: string, profileData: ProfileInput)` - Update profile
- `completeUserProfile(userId: string, profileData: ProfileInput)` - Complete initial profile
- `updatePrivacySettings(userId: string, settings: PrivacySettings)` - Update privacy preferences

### Type System Design

```typescript
// Core profile interfaces
interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileComplete: boolean;
  dateOfBirth?: Date;
  emergencyContact?: EmergencyContact;
  gender?: string;
  pronouns?: string;
  phone?: string;
  privacySettings?: PrivacySettings;
  profileVersion: number;
  profileUpdatedAt?: Date;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
}

interface PrivacySettings {
  showEmail: boolean;
  showPhone: boolean;
  showBirthYear: boolean;
  allowTeamInvitations: boolean;
}

// Input types for mutations
interface ProfileInput {
  dateOfBirth: Date;
  emergencyContact: EmergencyContact;
  gender?: string;
  pronouns?: string;
  phone?: string;
  privacySettings?: PrivacySettings;
}
```

## Data Models

### Profile Completion Logic

The system determines profile completion based on required fields:

```typescript
function isProfileComplete(profile: UserProfile): boolean {
  return !!(
    profile.dateOfBirth &&
    profile.emergencyContact?.name &&
    profile.emergencyContact?.relationship &&
    (profile.emergencyContact?.phone || profile.emergencyContact?.email)
  );
}
```

### Privacy Settings Structure

Privacy settings use a structured approach with sensible defaults:

```typescript
const defaultPrivacySettings: PrivacySettings = {
  showEmail: false,
  showPhone: false,
  showBirthYear: true,
  allowTeamInvitations: true,
};
```

### Emergency Contact Validation

Emergency contact data is stored as JSON text and validated for completeness:

```typescript
const emergencyContactSchema = z
  .object({
    name: z.string().min(1, "Emergency contact name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine(
    (data) => data.phone || data.email,
    "Either phone or email is required for emergency contact",
  );
```

## Error Handling

### Validation Error Strategy

The design implements comprehensive error handling:

- **Field-level validation**: Individual field constraints and format validation
- **Cross-field validation**: Ensuring emergency contact has at least one contact method
- **Business rule validation**: Age verification, reasonable date ranges
- **Database constraint errors**: Handling unique constraints and foreign key violations

### Error Response Format

```typescript
interface ProfileError {
  field?: string;
  message: string;
  code:
    | "VALIDATION_ERROR"
    | "MISSING_REQUIRED_FIELD"
    | "INVALID_FORMAT"
    | "DATABASE_ERROR";
}

interface ProfileOperationResult {
  success: boolean;
  data?: UserProfile;
  errors?: ProfileError[];
}
```

### Graceful Degradation

The system handles partial profile data gracefully:

- Allows saving incomplete profiles with `profileComplete: false`
- Provides clear indication of missing required fields
- Supports incremental profile completion

## Testing Strategy

### Unit Testing Approach

Each server function will have comprehensive unit tests covering:

#### Query Function Tests

- Valid user ID returns complete profile data
- Invalid user ID returns appropriate error
- Profile completion status calculation accuracy
- Privacy settings retrieval and defaults

#### Mutation Function Tests

- Valid profile data updates successfully
- Invalid data returns validation errors
- Profile completion status updates correctly
- Version tracking increments properly
- Audit trail timestamps update

#### Validation Tests

- Date of birth format and range validation
- Emergency contact completeness validation
- Privacy settings structure validation
- Cross-field validation rules

### Integration Testing

Database integration tests will verify:

- Schema migration applies correctly
- Indexes perform as expected
- Constraint violations handled properly
- Transaction rollback on errors

### Test Data Strategy

Test utilities will provide:

- Valid profile data fixtures
- Invalid data scenarios for error testing
- Partial profile data for completion testing
- Privacy settings variations

## Migration Strategy

### Database Migration Plan

The migration will be implemented as a single Drizzle migration file:

```sql
-- Add profile fields to existing user table
ALTER TABLE "user"
ADD COLUMN "profile_complete" boolean DEFAULT false NOT NULL,
ADD COLUMN "date_of_birth" timestamp,
ADD COLUMN "emergency_contact" text,
ADD COLUMN "gender" text,
ADD COLUMN "pronouns" text,
ADD COLUMN "phone" text,
ADD COLUMN "privacy_settings" text,
ADD COLUMN "profile_version" integer DEFAULT 1 NOT NULL,
ADD COLUMN "profile_updated_at" timestamp DEFAULT now();

-- Create indexes for common queries
CREATE INDEX "user_profile_complete_idx" ON "user" ("profile_complete");
CREATE INDEX "user_date_of_birth_idx" ON "user" ("date_of_birth");
```

### Backward Compatibility

The migration maintains full backward compatibility:

- All new fields are nullable or have defaults
- Existing user records remain functional
- Authentication flows continue unchanged
- Profile completion defaults to `false` for existing users

### Data Integrity Measures

- Profile version tracking prevents concurrent update conflicts
- Timestamp tracking provides audit trail
- JSON validation ensures structured data storage
- Soft validation allows incremental profile building
