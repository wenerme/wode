# @wener/ui

Shared Wener UI primitives built with Base UI and Tailwind CSS.

## Current primitives

- `Button` wraps `@base-ui/react/button` with shadcn-style variants.
- `Input` and `Textarea` wrap native form controls with shared Tailwind classes.
- `Dialog` and `Popover` wrap Base UI compound parts with default layout classes.
- `PrimitiveShowcase` provides a minimal example that exercises all primitives.

This package is intentionally small. App-specific console/resource/applet behavior should stay in `apps/console` or `packages/wener-console` until it becomes a stable reusable pattern.
