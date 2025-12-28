# Wener Components Registry

A shadcn-compatible component registry.

## Installation

```bash
# Install a component directly
npx shadcn add https://ui-components.wener.me/r/hello-button

# Or configure the registry in your components.json
{
  "registries": {
    "wener": {
      "url": "https://ui-components.wener.me/r"
    }
  }
}

# Then install by name
npx shadcn add wener/hello-button
```

## Available Components

- `hello-button` - A simple hello button component
- `console-layout` - A responsive console layout with Menu, Main, and Dock areas
