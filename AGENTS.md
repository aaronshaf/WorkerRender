# Agent Development Guidelines

Guidelines for AI coding agents (like Claude Code) working on this project.

## Documentation Style

When writing tutorials and documentation:
- Write in a concise style for impatient engineers
- Get to the point quickly
- Avoid emojis
- Use clear, direct language
- Show code examples early
- Skip unnecessary pleasantries
- Focus on what engineers need to know

## TypeScript Configuration

**IMPORTANT:** Always use `isolatedDeclarations: true` in TypeScript configuration.

This ensures:
- All exported declarations have explicit types
- Better type inference and performance
- Catches type errors earlier in development
- Enables faster incremental builds
- Makes the codebase more maintainable

### Example `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "isolatedDeclarations": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  }
}
```

## Pre-Commit Checks

All commits are automatically validated by a pre-commit hook that:
1. Runs `pnpm build` to check for TypeScript errors
2. Prevents commits if build fails
3. Ensures all packages compile successfully

This catches:
- TypeScript type errors
- Missing exports
- Import/export issues
- JSX/TSX syntax errors

## Code Style

### Keep It Simple
- Avoid over-engineering
- Use straightforward patterns
- Prefer explicit over implicit
- Write code that beginners can understand

### Remix 2 Compatibility
- Use familiar Remix patterns where possible
- Document differences from Remix
- Provide migration examples

### TypeScript Best Practices
- Always provide explicit return types for exported functions
- Use `interface` for object types that may be extended
- Use `type` for unions, intersections, and primitives
- Avoid `any` - use `unknown` and type guards instead
- Use `Array.from()` for NodeList/iterable conversions (ES2020 compatibility)

### JSX/TSX Patterns
- Use `/** @jsx h */` and `/** @jsxFrag Fragment */` pragmas
- Import from `./jsx-runtime` not directly from `hono/jsx`
- Components return `any` (Hono's JSX doesn't have strict Component types)
- Use `h()` function for programmatic element creation

### Browser Compatibility
- Target ES2020 for broadest support
- Use `Array.from()` instead of spread for NodeLists
- Use `.forEach()` instead of `for...of` for URLSearchParams
- Check for feature support before using modern APIs

### DOM Manipulation
- **Always use Idiomorph for DOM updates** instead of setting innerHTML or outerHTML directly
- Idiomorph preserves input state, cursor position, scroll position, and focus
- Use `Idiomorph.morph(oldNode, newNode, { morphStyle: 'innerHTML' })` for content updates
- Use `Idiomorph.morph(oldNode, newNode, { morphStyle: 'outerHTML' })` for element replacement
- Avoid hacks like manual input value save/restore - let Idiomorph handle it

## Architecture

### Three-Bundle Strategy
1. **Client bundle** - Browser navigation and interactivity
2. **Service Worker bundle** - Offline-first rendering
3. **Server bundle** - Initial SSR

Each bundle is optimized for its environment and only includes necessary code.

### Core Principles
- **Unified routes** work in both SSR and Service Worker
- **Offline-first** with stale-while-revalidate
- **Progressive enhancement** with inline scripts
- **Type-safe** with full TypeScript support
- **Lightweight** with minimal dependencies

## Testing

Before committing:
1. Run `pnpm build` to check all packages compile
2. Test in the example app with `pnpm dev`
3. Test the Service Worker in production mode
4. Check mobile responsiveness
5. Verify offline functionality

## Common Pitfalls

### JSX Type Issues
- Hono's JSX types are different from React
- Use `as any` for type casts when needed
- Components return JSXNode which may not match string types

### Context API
- Don't use React-like context - Hono doesn't support it
- Use global state or pass props explicitly
- Keep it simple

### Async Iteration
- Don't use `for...of` with URLSearchParams
- Use `.forEach()` or `Array.from()` instead
- ES2020 target doesn't include all iteration protocols

### Build Errors
- Always test build before committing
- The pre-commit hook will catch build errors
- Fix TypeScript errors immediately

## Resources

- [TypeScript isolatedDeclarations](https://www.typescriptlang.org/tsconfig#isolatedDeclarations)
- [Hono Documentation](https://hono.dev/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Remix Documentation](https://remix.run/docs)

## Questions?

When in doubt:
1. Check existing code patterns
2. Keep it simple
3. Test thoroughly
4. Ask for clarification
