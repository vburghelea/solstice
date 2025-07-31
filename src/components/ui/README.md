# UI Components

This directory contains shadcn/ui components that have been customized for the Quadball Canada platform.

## Base Components (from shadcn/ui)

These components are copied from shadcn/ui and can be customized as needed:

### Core Components

- **Button** (`button.tsx`) - Primary interactive element with variants
- **Card** (`card.tsx`) - Content container with header, content, and footer sections
- **Input** (`input.tsx`) - Form input with consistent styling
- **Label** (`label.tsx`) - Accessible form labels

### Icon System

- **Icons** (`icons.tsx`) - Re-exported Lucide React icons for consistency

## Usage

```tsx
import { Button } from "~/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";

// Example usage
<Card>
  <CardHeader>
    <CardTitle>Login</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" />
      </div>
      <Button type="submit">Sign In</Button>
    </div>
  </CardContent>
</Card>;
```

## Adding New Components

To add a new shadcn/ui component:

```bash
npx shadcn-ui@latest add [component-name]
```

This will copy the component into this directory where it can be customized.

## Customization

All components use CSS variables for theming, defined in `src/styles.css`. The theme automatically adjusts for light/dark mode based on the `ThemeProvider` context.

## Documentation

For detailed component documentation and examples, see:

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Component Guide](../../../docs/quadball-plan/ui-flows/component-guide.md)
