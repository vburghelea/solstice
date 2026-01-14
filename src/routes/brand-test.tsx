import { createFileRoute } from "@tanstack/react-router";
import { createPageHead } from "~/shared/lib/page-head";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  AlertCircle,
  Bell,
  Check,
  ChevronRight,
  FileText,
  Home,
  Info,
  Settings,
  Upload,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/brand-test")({
  head: () => createPageHead("Brand Test Page"),
  component: BrandTestPage,
});

function BrandTestPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              S
            </div>
            <span className="text-lg font-semibold">Brand Test</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Home className="mr-1 size-4" />
              Home
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="mr-1 size-4" />
              Settings
            </Button>
            <Button size="sm">Sign In</Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 p-8">
        {/* viaSport Brand Colors Section */}
        <section>
          <h1 className="mb-6 text-3xl font-bold">viaSport Brand Colors</h1>
          <p className="mb-4 text-muted-foreground">
            Official viaSport brand colors from the brand guidelines.
          </p>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
            <ColorSwatch
              name="Dark Teal"
              hex="#003B4D"
              className="bg-[#003B4D] text-white"
            />
            <ColorSwatch name="Teal" hex="#00675B" className="bg-[#00675B] text-white" />
            <ColorSwatch
              name="Bright Blue"
              hex="#0071CE"
              className="bg-[#0071CE] text-white"
            />
            <ColorSwatch
              name="Bright Green"
              hex="#00BC70"
              className="bg-[#00BC70] text-white"
            />
            <ColorSwatch
              name="Lime Green"
              hex="#93D500"
              className="bg-[#93D500] text-black"
            />
          </div>
          <h3 className="mt-8 mb-4 text-lg font-medium">Background Colors</h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <ColorSwatch
              name="White"
              hex="#FFFFFF"
              className="bg-white text-black border"
            />
            <ColorSwatch
              name="Light Mint"
              hex="#DCF6EC"
              className="bg-[#DCF6EC] text-[#003B4D]"
            />
            <ColorSwatch
              name="Light Sage"
              hex="#ACDECB"
              className="bg-[#ACDECB] text-[#003B4D]"
            />
            <ColorSwatch
              name="Off-White"
              hex="#FBFBFB"
              className="bg-[#FBFBFB] text-black border"
            />
          </div>
        </section>

        <Separator />

        {/* Color Palette Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Theme Color Palette</h2>
          <p className="mb-4 text-muted-foreground">
            CSS variable-based colors that respond to the current tenant theme.
          </p>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
            {/* Primary Colors */}
            <ColorSwatch name="Primary" className="bg-primary text-primary-foreground" />
            <ColorSwatch
              name="Secondary"
              className="bg-secondary text-secondary-foreground"
            />
            <ColorSwatch name="Accent" className="bg-accent text-accent-foreground" />
            <ColorSwatch name="Muted" className="bg-muted text-muted-foreground" />
            <ColorSwatch name="Destructive" className="bg-destructive text-white" />
            <ColorSwatch name="Card" className="bg-card text-card-foreground border" />
            {/* Brand Colors */}
            <ColorSwatch name="Brand (Primary)" className="bg-brand-red text-white" />
            <ColorSwatch name="Brand Dark" className="bg-brand-dark text-white" />
            <ColorSwatch name="Admin Primary" className="bg-admin-primary text-white" />
            <ColorSwatch
              name="Admin Secondary"
              className="bg-admin-secondary text-admin-text-primary"
            />
            {/* Chart Colors */}
            <ColorSwatch name="Chart 1" className="bg-chart-1 text-white" />
            <ColorSwatch name="Chart 2" className="bg-chart-2 text-white" />
          </div>
        </section>

        <Separator />

        {/* Buttons Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Buttons</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-lg font-medium text-muted-foreground">
                Standard Variants
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-medium text-muted-foreground">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Settings className="size-4" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-medium text-muted-foreground">
                Brand Buttons (CSS Classes)
              </h3>
              <div className="flex flex-wrap gap-3">
                <button className="btn-brand-primary rounded-md px-4 py-2 text-sm font-medium">
                  Brand Primary
                </button>
                <button className="btn-brand-secondary rounded-md px-4 py-2 text-sm font-medium">
                  Brand Secondary
                </button>
                <button className="btn-admin-primary rounded-md px-4 py-2 text-sm font-medium">
                  Admin Primary
                </button>
                <button className="btn-admin-secondary rounded-md px-4 py-2 text-sm font-medium">
                  Admin Secondary
                </button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-medium text-muted-foreground">
                With Icons
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button>
                  <Upload className="size-4" />
                  Upload File
                </Button>
                <Button variant="outline">
                  <Bell className="size-4" />
                  Notifications
                </Button>
                <Button variant="secondary">
                  Continue
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Badges Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Badges</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="success">Success</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="status-active">Active</Badge>
              <Badge className="status-inactive">Inactive</Badge>
            </div>
          </div>
        </section>

        <Separator />

        {/* Alerts Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Alerts</h2>
          <div className="space-y-4">
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                This is an informational alert with default styling.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                This is a destructive alert for errors or warnings.
              </AlertDescription>
            </Alert>
            {/* Custom success-style alert using viaSport green */}
            <Alert className="border-[#00BC70]/30 bg-[#E8F7F1] text-[#00675B]">
              <Check className="size-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                This is a custom success alert using viaSport brand green.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        <Separator />

        {/* Cards Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Cards</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>A simple card with header and content.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Card content goes here. This demonstrates the default card styling.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Hover Card</CardTitle>
                <CardDescription>Uses the card-hover class.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Hover over this card to see the elevation effect.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Highlighted Card</CardTitle>
                <CardDescription>With primary accent styling.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Custom card with primary color accent.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Forms Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Form Elements</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled">Disabled</Label>
                  <Input id="disabled" disabled placeholder="Disabled input" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms" className="text-sm">
                    Accept terms and conditions
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="newsletter" defaultChecked />
                  <Label htmlFor="newsletter" className="text-sm">
                    Subscribe to newsletter
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Tabs Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Tabs</h2>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Overview tab content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    Analytics tab content goes here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reports" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Reports tab content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Settings tab content goes here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* Table Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Table</h2>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">John Doe</TableCell>
                    <TableCell>
                      <Badge variant="success">Active</Badge>
                    </TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Jane Smith</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell>User</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bob Wilson</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Inactive</Badge>
                    </TableCell>
                    <TableCell>Viewer</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Loading States Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Loading States</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card Skeleton</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-24" />
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Navigation Pattern Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Navigation Patterns</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="mb-4 text-lg font-medium">Sidebar Navigation Items</h3>
                <nav className="w-64 space-y-1 rounded-lg border p-2">
                  <a href="#" className="nav-item-active">
                    <Home className="size-4" />
                    Dashboard
                  </a>
                  <a href="#" className="nav-item">
                    <Users className="size-4" />
                    Organizations
                  </a>
                  <a href="#" className="nav-item">
                    <FileText className="size-4" />
                    Forms
                  </a>
                  <a href="#" className="nav-item">
                    <Settings className="size-4" />
                    Settings
                  </a>
                </nav>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Sidebar Colors Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Sidebar Theme</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
            <ColorSwatch
              name="Sidebar"
              className="bg-sidebar text-sidebar-foreground border"
            />
            <ColorSwatch
              name="Sidebar Primary"
              className="bg-sidebar-primary text-sidebar-primary-foreground"
            />
            <ColorSwatch
              name="Sidebar Accent"
              className="bg-sidebar-accent text-sidebar-accent-foreground"
            />
            <ColorSwatch
              name="Sidebar Border"
              className="bg-sidebar-border text-foreground"
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <p>Brand Test Page - Not for production use</p>
          <p className="mt-2">
            Edit{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">
              src/routes/brand-test.tsx
            </code>{" "}
            to test color changes
          </p>
        </footer>
      </main>
    </div>
  );
}

function ColorSwatch({
  name,
  className,
  hex,
}: {
  name: string;
  className: string;
  hex?: string;
}) {
  return (
    <div className="space-y-2">
      <div
        className={`flex h-20 flex-col items-center justify-center rounded-lg text-xs font-medium ${className}`}
      >
        <span>{name}</span>
        {hex && <span className="mt-1 opacity-75">{hex}</span>}
      </div>
      <p className="text-center text-xs text-muted-foreground">{name}</p>
    </div>
  );
}
