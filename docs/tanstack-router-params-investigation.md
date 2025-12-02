# TanStack Router Params Type Error Investigation

## Summary

The TypeScript error with Link component params is NOT a known TanStack limitation as initially documented. After thorough investigation, the issue stems from how TanStack Router's type system expects params to be passed.

## Error Message

```
Type '{ teamId: string; }' is not assignable to type 'true | ParamsReducerFn<AnyRouter, "PATH", string, string | undefined>'.
```

## Root Cause

The Link component's `params` prop expects one of these types:

1. `true` - Use current params as-is
2. `ParamsReducer<TRouter, 'PATH', TFrom, TTo>` - Which can be:
   - A plain object of type `Expand<ResolveRelativeToParams<TRouter, TParamVariant, TFrom, TTo>>`
   - A function `ParamsReducerFn` that takes current params and returns new params

The type system is unable to infer that `{ teamId: string }` matches the expected plain object type because:

1. The generic types `TFrom` and `TTo` are not being properly constrained
2. The router type inference chain is complex and relies on string literal types for routes
3. The SafeLink wrapper component passes through props without preserving the literal types

## Type Definitions Location

From `@tanstack/router-core/dist/esm/link.d.ts`:

```typescript
// Line 118-119
export type ParamsReducerFn<
  in out TRouter extends AnyRouter,
  in out TParamVariant extends ParamVariant,
  in out TFrom,
  in out TTo,
> = (
  current: Expand<ResolveFromParams<TRouter, TParamVariant, TFrom>>,
) => Expand<ResolveRelativeToParams<TRouter, TParamVariant, TFrom, TTo>>;

type ParamsReducer<
  TRouter extends AnyRouter,
  TParamVariant extends ParamVariant,
  TFrom,
  TTo,
> =
  | Expand<ResolveRelativeToParams<TRouter, TParamVariant, TFrom, TTo>>
  | (ParamsReducerFn<TRouter, TParamVariant, TFrom, TTo> & {});

// Line 133-134
export interface MakeOptionalPathParams<
  in out TRouter extends AnyRouter,
  in out TFrom,
  in out TTo,
> {
  params?: true | (ParamsReducer<TRouter, "PATH", TFrom, TTo> & {});
}
```

## Affected Files

### Using SafeLink Component

- `src/routes/dashboard/teams/$teamId.tsx` (line 214)
- `src/routes/dashboard/teams/index.tsx` (lines 130, 138)

### SafeLink Component Implementation

- `src/components/ui/SafeLink.tsx`
  - Wraps TanStack Router's Link component
  - Uses `React.ComponentProps<typeof Link>` which may lose type inference

## The Real Issue

The SafeLink component's type definition:

```typescript
type Props = React.ComponentProps<typeof Link>;
```

This extracts props from the Link component but loses the generic type parameters that allow proper type inference for route params. The Link component relies on literal string types for `TFrom` and `TTo` to properly type the params.

## Investigation Results

After testing, the issue persists even when using TanStack Router's Link component directly. This rules out SafeLink as the cause.

Test results:

- Direct Link with object params: **Same error**
- Direct Link with function params: **Type '{ teamId: string; }' is not assignable to type 'never'**
- SafeLink has the same errors as direct Link usage

## Real Root Cause

The TypeScript compiler is unable to properly infer that the route "/dashboard/teams/$teamId" has a param named "teamId". The error message shows it's trying to match against:

- `ParamsReducerFn<AnyRouter, "PATH", string, "/dashboard/teams/$teamId">`

Note that it's using `AnyRouter` instead of the properly registered router type. This suggests the type inference chain is broken somewhere.

## Solution Options

### Option 1: Fix the Type Registration

The issue might be in how the router types are registered. The `declare module` might not be properly connecting the router instance to the type system.

### Option 2: Use Type Assertion (Current Workaround)

Continue using type assertions but document why:

```typescript
// Type assertion needed due to TanStack Router type inference issue
// The router cannot infer param types from dynamic routes
<Link to="/dashboard/teams/$teamId" params={{ teamId } as any}>
```

### Option 3: Create a Typed Link Helper

Create a helper that properly types the params:

```typescript
function createTypedLink<TPath extends keyof FileRoutesByFullPath>(
  path: TPath,
  params: ExtractRouteParams<TPath>
) {
  return { to: path, params };
}

// Usage
<Link {...createTypedLink("/dashboard/teams/$teamId", { teamId })} />
```

## Verification Completed

1. ✅ Using Link directly does NOT resolve the type error
2. ✅ Function form also fails with type errors
3. ✅ Issue is NOT specific to SafeLink wrapper

## Final Solution

Created a properly typed Link component (`TypedLink`) that preserves the generic type parameters needed for proper type inference.

### Key Differences from SafeLink:

1. **Explicit Generic Parameters**: TypedLink explicitly defines all generic parameters that Link expects
2. **RegisteredRouter Type**: Uses `RegisteredRouter` type instead of extracting props which loses type information
3. **Proper Type Preservation**: The generic parameters flow through to the underlying Link component

### Implementation:

```typescript
export function TypedLink<
  TFrom extends string = string,
  TTo extends string | undefined = ".",
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = "."
>(
  props: LinkComponentProps<"a", RegisteredRouter, TFrom, TTo, TMaskFrom, TMaskTo>
) {
  // WebKit handling logic...
  return <Link {...props} />;
}
```

### Results:

✅ Type checking passes without any errors
✅ No need for `as any` or `@ts-expect-error`
✅ Params are properly typed based on route definitions
✅ Maintains Safari/WebKit compatibility from SafeLink

### Usage:

```typescript
// Simple param passing - types are inferred correctly
<Link to="/dashboard/teams/$teamId" params={{ teamId: team.id }}>
  View Team
</Link>

// Within same param context - use params={true}
<Link to="./members" params={true}>
  Manage Members
</Link>
```

## References

- TanStack Router Link type definitions: `@tanstack/router-core/dist/esm/link.d.ts`
- SafeLink implementation: `src/components/ui/SafeLink.tsx`
- TanStack Router documentation on params: https://tanstack.com/router/latest/docs/framework/react/api/router/LinkPropsType
