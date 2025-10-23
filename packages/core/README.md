# @worker-render/core

Core package for WorkerRender — JSX runtime, routing, and islands system.

## Installation

```bash
pnpm add @worker-render/core
```

## Usage

### JSX Runtime

```tsx
/** @jsxImportSource @worker-render/core */

function MyComponent({ name }: { name: string }) {
  return <h1>Hello {name}</h1>;
}
```

### Routes

```ts
import { defineRoute } from '@worker-render/core';

const route = defineRoute({
  path: '/hello/:name',
  async loader({ params }) {
    return { name: params.name };
  },
  Page({ data }) {
    return <h1>Hello {data.name}</h1>;
  },
  title: (d) => `Hello ${d.name}`
});
```

### Islands

```ts
import { island } from '@worker-render/core';

// In your Page component
const counterIsland = island({
  name: 'Counter',
  module: '/client/chunks/Counter.js',
  props: { initial: 0 }
});

return <div dangerouslySetInnerHTML={{ __html: counterIsland }} />;
```

## API

See the [main README](../../README.md) for full documentation.
