# AGENTS.md - Coding Agent Guidelines for Solstice

## Build/Lint/Test Commands

- `pnpm dev` - Start Vite dev server (port 5173)
- `netlify dev` - Start with edge functions (port 8888, recommended)
- `pnpm lint` - Run ESLint
- `pnpm check-types` - TypeScript type checking
- `pnpm format` - Format with Prettier
- `pnpm test` - Run all tests
- `pnpm test path/to/file.test.tsx` - Run single test file
- `pnpm test -t "test name"` - Run tests matching pattern
- `pnpm test:watch` - Run tests in watch mode

## Code Style Guidelines

- **Imports**: Use `~/` alias for src imports, organize with prettier-plugin-organize-imports
- **Formatting**: 2 spaces, semicolons, double quotes, trailing commas, 90 char line width
- **Types**: Strict TypeScript, avoid `any`, use type inference where possible
- **Components**: Function components only, use shadcn/ui from `~/shared/ui/`
- **Naming**: PascalCase components, camelCase functions/variables, kebab-case files
- **Error Handling**: Use try-catch with proper error types, display user-friendly messages
- **Testing**: Vitest + Testing Library, mock external deps, test user behavior not implementation
- **Architecture**: Features in `src/features/`, shared code in `src/shared/`, thin route files

## Important Notes

- Read Better Auth docs at https://www.better-auth.com/llms.txt when working with auth
- Use `serverOnly()` wrapper for server-side code in TanStack Start
- Always run `pnpm lint` and `pnpm check-types` before completing tasks
