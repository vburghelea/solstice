# 🚀 Learn Full-Stack Development with Solstice

Welcome to the Solstice project! This guide will teach you modern full-stack web development through a real-world application. By the end, you'll understand how all the pieces fit together and be ready to contribute.

## 📚 Table of Contents

1. [What is Full-Stack Development?](#what-is-full-stack-development)
2. [The Big Picture: How Everything Connects](#the-big-picture)
3. [Tech Stack Deep Dive](#tech-stack-deep-dive)
4. [Project Architecture](#project-architecture)
5. [Understanding Every File and Folder](#understanding-every-file-and-folder)
6. [Development Workflow](#development-workflow)
7. [Contributing to the Project](#contributing-to-the-project)

## 🎯 What is Full-Stack Development?

Full-stack development means building both the **frontend** (what users see) and **backend** (server logic and data) of a web application. Think of it like building a restaurant:

- **Frontend**: The dining room, menu, and presentation
- **Backend**: The kitchen, recipes, and ingredient storage
- **Database**: The pantry and inventory system
- **Deployment**: The actual restaurant building and location

## 🏗️ The Big Picture: How Everything Connects

Here's how our application works from a bird's-eye view:

```mermaid
graph TB
    subgraph "User's Browser"
        UI[React UI<br/>TanStack Start]
        Auth[Better Auth Client]
    end

    subgraph "Netlify Edge"
        Edge[Edge Functions<br/>Security Headers]
    end

    subgraph "Application Server"
        Server[TanStack Start Server]
        AuthServer[Better Auth Server]
        API[API Routes]
    end

    subgraph "Database"
        Neon[Neon PostgreSQL<br/>Serverless Database]
    end

    UI -->|User Interactions| Server
    Auth -->|Auth Requests| AuthServer
    Server -->|Database Queries| Neon
    AuthServer -->|User Data| Neon
    Edge -->|Secure Delivery| UI

    style UI fill:#e1f5fe
    style Server fill:#fff3e0
    style Neon fill:#e8f5e9
    style Edge fill:#f3e5f5
```

### The Request Flow

1. User visits the website → Netlify serves the app
2. React renders the UI → User interacts
3. Requests go through TanStack Start → Server processes
4. Data is fetched/stored in Neon → Response sent back
5. UI updates with new data → User sees changes

## 🛠️ Tech Stack Deep Dive

Let's understand each technology and why we use it:

### 1. TanStack Start (The Framework)

**What it is**: A full-stack React framework (like Next.js but newer and more flexible)

**Why we use it**:

- Server-side rendering for fast page loads
- File-based routing (pages map to files)
- Built-in data fetching
- Type-safe from frontend to backend

**Think of it as**: The foundation and walls of your house

### 2. Better Auth (Authentication)

**What it is**: A modern authentication library that handles user login/signup

**Why we use it**:

- Secure password handling
- OAuth support (login with Google/GitHub)
- Session management
- Built for edge deployments

**Think of it as**: The security system and door locks

### 3. Neon (Database)

**What it is**: A serverless PostgreSQL database

**Why we use it**:

- Scales automatically
- Pay only for what you use
- PostgreSQL compatibility
- Works great with serverless deployments

**Think of it as**: A smart warehouse that grows/shrinks based on your inventory

### 4. Netlify (Hosting & Deployment)

**What it is**: A platform that hosts and serves your website

**Why we use it**:

- Automatic deployments from GitHub
- Preview deployments for pull requests
- Edge functions for better performance
- Built-in CDN for fast global access

**Think of it as**: The land, utilities, and address for your restaurant

### 5. Supporting Technologies

```mermaid
graph LR
    subgraph "Styling"
        TW[Tailwind CSS v4]
        Shad[shadcn/ui]
    end

    subgraph "Database Tools"
        Drizzle[Drizzle ORM]
        Schema[Type-safe Schema]
    end

    subgraph "Development"
        TS[TypeScript]
        Vite[Vite]
        Vitest[Vitest]
    end

    subgraph "Package Management"
        PNPM[pnpm]
    end

    TW -->|Utility Classes| Shad
    Drizzle -->|Query Builder| Schema
    TS -->|Type Safety| Vite
    Vite -->|Testing| Vitest
```

## 🏛️ Project Architecture

Our project follows a modular, feature-based architecture:

```mermaid
graph TD
    subgraph "Frontend Layer"
        Routes[Routes/Pages]
        Components[Reusable Components]
        Features[Feature Modules]
    end

    subgraph "Shared Layer"
        UI[UI Components]
        Hooks[Custom Hooks]
        Utils[Utilities]
    end

    subgraph "Backend Layer"
        API[API Routes]
        Auth[Auth Logic]
        DB[Database Layer]
    end

    subgraph "Infrastructure"
        Config[Configuration]
        Types[Type Definitions]
        Tests[Test Suite]
    end

    Routes --> Components
    Routes --> Features
    Components --> UI
    Features --> Hooks
    Features --> API
    API --> Auth
    API --> DB

    style Routes fill:#e3f2fd
    style API fill:#fff8e1
    style DB fill:#e8f5e9
    style Config fill:#fce4ec
```

## 📁 Understanding Every File and Folder

Let's go through each root-level file and folder to understand their purpose:

### Configuration Files

| File                 | Purpose                            | When You'll Use It                  |
| -------------------- | ---------------------------------- | ----------------------------------- |
| `package.json`       | Lists all dependencies and scripts | Adding packages, running commands   |
| `pnpm-lock.yaml`     | Locks exact dependency versions    | Ensures everyone has same packages  |
| `tsconfig.json`      | TypeScript configuration           | Adjusting type checking rules       |
| `vite.config.ts`     | Build tool configuration           | Adding plugins, build optimizations |
| `vitest.config.ts`   | Test runner configuration          | Setting up test environment         |
| `drizzle.config.ts`  | Database migration config          | Managing database schema changes    |
| `netlify.toml`       | Netlify deployment settings        | Configuring deployments             |
| `docker-compose.yml` | Local PostgreSQL setup             | Running database locally            |
| `components.json`    | shadcn/ui configuration            | Adding new UI components            |
| `eslint.config.js`   | Code linting rules                 | Maintaining code quality            |
| `.editorconfig`      | Editor formatting rules            | Consistent code style               |
| `.gitignore`         | Files Git should ignore            | Keeping secrets out of repo         |
| `.gitattributes`     | Git file handling rules            | Ensuring consistent line endings    |

### Project Structure Deep Dive

```
solstice/
├── src/                    # All source code lives here
│   ├── routes/            # Pages of your application
│   │   ├── index.tsx      # Home page (/)
│   │   ├── (auth)/        # Auth pages group
│   │   └── dashboard/     # Protected pages
│   │
│   ├── components/        # Reusable UI pieces
│   │   ├── auth/          # Auth-specific components
│   │   └── form-fields/   # Form building blocks
│   │
│   ├── features/          # Feature-specific modules
│   │   └── auth/          # Authentication feature
│   │       ├── components/
│   │       └── __tests__/
│   │
│   ├── lib/               # Core application logic
│   │   ├── auth/          # Authentication setup
│   │   ├── server/        # Server-only code
│   │   └── security/      # Security utilities
│   │
│   ├── db/                # Database layer
│   │   ├── schema/        # Table definitions
│   │   └── connections.ts # Database connections
│   │
│   ├── shared/            # Shared across frontend/backend
│   │   ├── ui/            # Base UI components
│   │   ├── hooks/         # React hooks
│   │   └── lib/           # Utility functions
│   │
│   └── tests/             # Test utilities
│       └── mocks/         # Mock data for tests
│
├── public/                # Static files (images, fonts)
├── netlify/              # Netlify-specific functions
├── scripts/              # Build/utility scripts
└── docs/                 # Documentation
```

### How the Folders Work Together

```mermaid
flowchart LR
    subgraph "User Request Flow"
        User[User] -->|Visits| Routes
        Routes -->|Uses| Features
        Features -->|Calls| Components
        Components -->|Styled with| UI
    end

    subgraph "Data Flow"
        Features -->|Fetches| API[API Routes]
        API -->|Queries| DB
        DB -->|Returns| API
        API -->|Sends| Features
    end

    subgraph "Shared Resources"
        Features -->|Uses| Hooks
        Components -->|Uses| Utils[Lib/Utils]
        API -->|Protected by| Auth
    end
```

## 💻 Development Workflow

### 1. Setting Up Your Environment

```mermaid
graph LR
    A[Clone Repo] --> B[Install pnpm]
    B --> C[Run pnpm install]
    C --> D[Copy .env.example]
    D --> E[Start Database]
    E --> F[Run Migrations]
    F --> G[Start Dev Server]

    style A fill:#e3f2fd
    style G fill:#c8e6c9
```

### 2. Making Changes

1. **Find the right file**:
   - New page? → `src/routes/`
   - New component? → `src/components/` or `src/shared/ui/`
   - API endpoint? → `src/routes/api/`
   - Database schema? → `src/db/schema/`

2. **Follow the patterns**:

   ```typescript
   // Example: Creating a new component
   // src/components/MyComponent.tsx

   import { cn } from "@/shared/lib/utils"

   interface MyComponentProps {
     className?: string
     children: React.ReactNode
   }

   export function MyComponent({ className, children }: MyComponentProps) {
     return (
       <div className={cn("p-4 rounded-lg", className)}>
         {children}
       </div>
     )
   }
   ```

3. **Test your changes**:
   ```bash
   pnpm test           # Run tests
   pnpm lint           # Check code style
   pnpm check-types    # Verify TypeScript
   ```

### 3. The Git Workflow

```mermaid
gitGraph
    commit id: "main branch"
    branch feature/your-feature
    checkout feature/your-feature
    commit id: "Add new component"
    commit id: "Add tests"
    commit id: "Update styles"
    checkout main
    merge feature/your-feature
    commit id: "Deploy to production"
```

## 🤝 Contributing to the Project

### Before You Start

1. **Understand the problem**: Read the issue or requirement carefully
2. **Check existing code**: Look for similar patterns in the codebase
3. **Ask questions**: If unsure, ask in discussions or comments

### Making Your First Contribution

1. **Start small**: Fix a typo, improve documentation, or tackle a "good first issue"
2. **Follow conventions**:
   - Use TypeScript strictly (no `any`)
   - Write tests for new features
   - Keep components small and focused
   - Use meaningful variable names

3. **Submit a PR**:

   ```bash
   # Create a branch
   git checkout -b feature/your-feature-name

   # Make changes and commit
   git add .
   git commit -m "feat: add user profile component"

   # Push and create PR
   git push origin feature/your-feature-name
   ```

### Code Review Checklist

Before submitting, ensure:

- [ ] Tests pass (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Types are correct (`pnpm check-types`)
- [ ] Code follows existing patterns
- [ ] New features have tests
- [ ] Documentation is updated

## 🎓 Learning Resources

### Next Steps in Your Journey

1. **Frontend Deep Dive**:
   - Learn React hooks and state management
   - Master TypeScript for better type safety
   - Understand server-side rendering (SSR)

2. **Backend Mastery**:
   - Study SQL and database design
   - Learn about API design (REST/GraphQL)
   - Understand authentication and security

3. **DevOps Skills**:
   - Learn Git branching strategies
   - Understand CI/CD pipelines
   - Master debugging and monitoring

### Recommended Learning Path

```mermaid
graph TD
    A[HTML/CSS/JS Basics] --> B[React Fundamentals]
    B --> C[TypeScript]
    C --> D[This Project!]
    D --> E[Database Design]
    D --> F[API Development]
    D --> G[Testing Strategies]
    E --> H[System Design]
    F --> H
    G --> H
    H --> I[Full-Stack Expert!]

    style A fill:#ffebee
    style D fill:#e8f5e9
    style I fill:#fff9c4
```

## 🚀 You're Ready!

Congratulations on making it this far! You now understand:

- ✅ How modern full-stack apps are built
- ✅ The role of each technology in our stack
- ✅ Where to find and modify code
- ✅ How to contribute effectively

Remember: Everyone was a beginner once. Don't be afraid to ask questions, make mistakes, and learn from them. The best way to learn is by doing!

Happy coding! 🎉

## 🔐 Deep Dive: Authentication Flow

Understanding authentication is crucial for full-stack development. Here's how Better Auth works in our app:

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant BetterAuth
    participant Database
    participant OAuth

    User->>Browser: Clicks "Sign Up"
    Browser->>Server: POST /api/auth/signup
    Server->>BetterAuth: Create user
    BetterAuth->>BetterAuth: Hash password
    BetterAuth->>Database: Store user + hashed password
    Database-->>BetterAuth: User created
    BetterAuth->>BetterAuth: Create session
    BetterAuth-->>Server: Session token
    Server-->>Browser: Set cookie + redirect
    Browser-->>User: Dashboard access

    Note over User,OAuth: OAuth Flow (Google/GitHub)
    User->>Browser: Clicks "Sign in with Google"
    Browser->>OAuth: Redirect to Google
    OAuth->>User: Google login page
    User->>OAuth: Approves
    OAuth-->>Browser: Redirect with code
    Browser->>Server: Exchange code
    Server->>OAuth: Verify code
    OAuth-->>Server: User data
    Server->>BetterAuth: Create/find user
    BetterAuth->>Database: Store OAuth user
    BetterAuth-->>Server: Session token
    Server-->>Browser: Authenticated!
```

### Session Management

```mermaid
graph LR
    subgraph "Every Request"
        Cookie[Session Cookie] -->|Sent with| Request[API Request]
        Request --> Middleware[Auth Middleware]
        Middleware -->|Validates| Session[Session Check]
        Session -->|Valid| Allow[✅ Allow Request]
        Session -->|Invalid| Deny[❌ Deny Request]
    end
```

## 🛠️ Practical Examples

### Example 1: Adding a New Feature (Todo List)

Let's walk through adding a todo list feature to understand the full-stack flow:

```mermaid
graph TD
    subgraph "1. Database Schema"
        Schema[Create todos table<br/>src/db/schema/todos.ts]
    end

    subgraph "2. API Routes"
        API[Create CRUD endpoints<br/>src/routes/api/todos/]
    end

    subgraph "3. Frontend Components"
        Comp[Build UI components<br/>src/features/todos/]
    end

    subgraph "4. Page Route"
        Page[Create todos page<br/>src/routes/todos/index.tsx]
    end

    Schema --> API
    API --> Comp
    Comp --> Page

    style Schema fill:#e8f5e9
    style API fill:#fff3e0
    style Comp fill:#e3f2fd
    style Page fill:#f3e5f5
```

**Step 1: Database Schema**

```typescript
// src/db/schema/todos.ts
import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Step 2: API Route**

```typescript
// src/routes/api/todos/$.ts
import { createAPIFileRoute } from "@tanstack/start/api";
import { db } from "@/lib/server/db";
import { todos } from "@/db/schema/todos";

export const APIRoute = createAPIFileRoute("/api/todos")({
  GET: async ({ request }) => {
    // Fetch todos
    const userTodos = await db.select().from(todos);
    return Response.json(userTodos);
  },
  POST: async ({ request }) => {
    // Create todo
    const data = await request.json();
    const newTodo = await db.insert(todos).values(data);
    return Response.json(newTodo);
  },
});
```

### Example 2: Adding a New UI Component

```mermaid
flowchart LR
    A[Design Component] --> B[Create Base Component]
    B --> C[Add Styling]
    C --> D[Add Interactivity]
    D --> E[Write Tests]
    E --> F[Use in Pages]

    style A fill:#ffebee
    style F fill:#c8e6c9
```

**Creating a Card Component:**

```typescript
// src/shared/ui/card.tsx
import { cn } from "@/shared/lib/utils"

interface CardProps {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export function Card({ title, description, className, children }: CardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-6 shadow-sm",
      className
    )}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
```

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

| Problem                        | Symptoms                   | Solution                                                                                      |
| ------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------- |
| **Database Connection Failed** | "Connection refused" error | 1. Check DATABASE_URL in .env<br>2. Ensure Docker is running<br>3. Run `docker-compose up -d` |
| **Type Errors**                | Red squiggles in VS Code   | 1. Run `pnpm install`<br>2. Restart TypeScript server<br>3. Check imports                     |
| **Auth Not Working**           | Can't login/signup         | 1. Check auth secrets in .env<br>2. Clear cookies<br>3. Check network tab                     |
| **Styles Not Applied**         | Components look broken     | 1. Check Tailwind classes<br>2. Restart dev server<br>3. Clear .next cache                    |
| **Build Fails**                | Netlify deploy errors      | 1. Check build logs<br>2. Ensure all env vars set<br>3. Test locally first                    |

### Debugging Workflow

```mermaid
graph TD
    A[Issue Occurs] --> B{Type of Issue?}
    B -->|Frontend| C[Open DevTools]
    B -->|Backend| D[Check Server Logs]
    B -->|Database| E[Check DB Connection]

    C --> F[Console Errors?]
    C --> G[Network Tab]
    C --> H[React DevTools]

    D --> I[Error Stack Trace]
    D --> J[API Response]

    E --> K[Connection String]
    E --> L[Migration Status]

    F --> M[Fix Code]
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N[Test Again]

    style A fill:#ffcdd2
    style M fill:#c8e6c9
    style N fill:#fff9c4
```

## 📊 Performance Considerations

### Optimization Strategies

```mermaid
graph LR
    subgraph "Frontend Optimizations"
        A[Code Splitting]
        B[Lazy Loading]
        C[Image Optimization]
        D[Memoization]
    end

    subgraph "Backend Optimizations"
        E[Database Indexes]
        F[Query Optimization]
        G[Caching]
        H[Connection Pooling]
    end

    subgraph "Infrastructure"
        I[CDN Usage]
        J[Edge Functions]
        K[Static Generation]
    end
```

### Monitoring Performance

1. **Frontend Metrics**:
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)
   - Core Web Vitals

2. **Backend Metrics**:
   - API response times
   - Database query duration
   - Memory usage

3. **Tools**:
   - Chrome DevTools Performance tab
   - React DevTools Profiler
   - Netlify Analytics

## 🔧 Environment Setup Details

### Required Software

| Software | Version | Purpose            | Installation                                             |
| -------- | ------- | ------------------ | -------------------------------------------------------- |
| Node.js  | 20.19+  | JavaScript runtime | `brew install node` or [nodejs.org](https://nodejs.org)  |
| pnpm     | Latest  | Package manager    | `npm install -g pnpm`                                    |
| Docker   | Latest  | Database container | [docker.com](https://docker.com)                         |
| Git      | Latest  | Version control    | `brew install git` or [git-scm.com](https://git-scm.com) |
| VS Code  | Latest  | Code editor        | [code.visualstudio.com](https://code.visualstudio.com)   |

### VS Code Extensions

Essential extensions for this project:

- **ESLint**: Linting support
- **Prettier**: Code formatting
- **TypeScript**: Enhanced TS support
- **Tailwind CSS IntelliSense**: Autocomplete for classes
- **Prisma**: Database schema highlighting
- **GitLens**: Git insights

### Environment Variables Explained

```bash
# .env.example with explanations

# Database connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/solstice

# Application base URL (used for redirects, emails, etc.)
VITE_BASE_URL=http://localhost:3000

# Authentication secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-super-secret-key-here

# OAuth providers (from respective developer consoles)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 📚 Additional Learning Resources

### Official Documentation

- [TanStack Start Docs](https://tanstack.com/start/latest/docs/framework/react/overview)
- [Better Auth Docs](https://www.better-auth.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/)
- [Netlify Docs](https://docs.netlify.com/)

### Recommended Tutorials

1. **React Fundamentals**: [React.dev Tutorial](https://react.dev/learn)
2. **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
3. **SQL Basics**: [SQLBolt Interactive Tutorial](https://sqlbolt.com/)
4. **Git & GitHub**: [GitHub Skills](https://skills.github.com/)

### Community Resources

- Join the project's Discord/Slack
- Follow the maintainers on Twitter/X
- Watch the GitHub repo for updates
- Read the blog posts about the tech choices

## 🔒 Security Best Practices

### Security Layers in Our App

```mermaid
graph TB
    subgraph "Input Validation"
        A[Zod Schemas]
        B[Form Validation]
        C[API Validation]
    end

    subgraph "Authentication"
        D[Password Hashing]
        E[Session Management]
        F[CSRF Protection]
    end

    subgraph "Database Security"
        G[Parameterized Queries]
        H[Connection Pooling]
        I[SSL Connections]
    end

    subgraph "Network Security"
        J[HTTPS Only]
        K[Security Headers]
        L[Rate Limiting]
    end

    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
    G --> J
    H --> K
    I --> L

    style A fill:#ffebee
    style D fill:#e3f2fd
    style G fill:#e8f5e9
    style J fill:#fff3e0
```

### Key Security Principles

1. **Never Trust User Input**

   ```typescript
   // Always validate with Zod
   const userSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
   });

   const validated = userSchema.parse(userInput);
   ```

2. **Use Environment Variables for Secrets**

   ```typescript
   // Good: Using env vars
   const secret = process.env.API_SECRET;

   // Bad: Hardcoding secrets
   const secret = "my-secret-key"; // NEVER DO THIS!
   ```

3. **Implement Proper Authentication**
   - Use Better Auth's built-in security features
   - Never store plain text passwords
   - Implement session timeouts
   - Use secure cookies

4. **Database Security**
   - Always use parameterized queries (Drizzle does this)
   - Limit database user permissions
   - Use SSL for database connections
   - Regular backups

## 📋 Quick Reference Guide

### Common Commands

| Task                 | Command                | Description                          |
| -------------------- | ---------------------- | ------------------------------------ |
| **Start dev server** | `pnpm dev`             | Runs app locally on port 3000        |
| **Run tests**        | `pnpm test`            | Executes all test suites             |
| **Type check**       | `pnpm check-types`     | Verifies TypeScript types            |
| **Lint code**        | `pnpm lint`            | Checks code style                    |
| **Build app**        | `pnpm build`           | Creates production build             |
| **Start database**   | `docker-compose up -d` | Runs PostgreSQL locally              |
| **Run migrations**   | `pnpm db:migrate`      | Updates database schema              |
| **Generate types**   | `pnpm db:generate`     | Creates TypeScript types from schema |

### File Naming Conventions

| Type           | Convention        | Example             |
| -------------- | ----------------- | ------------------- |
| **Components** | PascalCase        | `UserProfile.tsx`   |
| **Utilities**  | camelCase         | `formatDate.ts`     |
| **Routes**     | kebab-case        | `user-settings.tsx` |
| **API Routes** | kebab-case with $ | `api/users/$.ts`    |
| **Tests**      | \*.test.ts(x)     | `Button.test.tsx`   |
| **Schemas**    | \*.schema.ts      | `user.schema.ts`    |

### Import Aliases

Our project uses these import aliases for cleaner imports:

```typescript
import { Button } from "@/shared/ui/button"; // Instead of "../../../shared/ui/button"
import { auth } from "@/lib/auth"; // Instead of "../../../lib/auth"
import { db } from "@/lib/server/db"; // Instead of "../../../lib/server/db"
```

### Common Patterns

**Creating a Protected Route:**

```typescript
// src/routes/protected/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useAuthGuard } from '@/features/auth/useAuthGuard'

export const Route = createFileRoute('/protected')({
  beforeLoad: async () => {
    // Server-side auth check
    await requireAuth()
  },
  component: () => {
    // Client-side auth check
    useAuthGuard()
    return <Outlet />
  }
})
```

**Making an API Call:**

```typescript
// Using TanStack Query
import { useQuery } from '@tanstack/react-query'

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <TodoList todos={data} />
}
```

**Creating a Form:**

```typescript
// Using our form utilities
import { useForm } from '@/lib/form'
import { ValidatedInput } from '@/components/form-fields/ValidatedInput'

function MyForm() {
  const form = useForm({
    onSubmit: async (data) => {
      // Handle submission
    }
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <ValidatedInput
        name="email"
        type="email"
        label="Email"
        required
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm check-types`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Environment variables set in Netlify
- [ ] Database migrations run
- [ ] Build succeeds locally (`pnpm build`)
- [ ] Security headers configured
- [ ] OAuth redirect URLs updated
- [ ] Error monitoring set up
- [ ] Analytics configured
