# @worker-render/core-vite

Vite plugin and utilities for WorkerRender builds.

## Installation

```bash
pnpm add -D @worker-render/core-vite vite
```

## Usage

This package provides helpers for building the 3 bundles (client, SW, worker).

For now, we recommend using **3 separate Vite config files** for full transparency and control:

- `vite.config.ts` — client bundle
- `vite.config.sw.ts` — service worker bundle
- `vite.config.worker.ts` — Cloudflare Worker bundle

See the [examples/basic](../../examples/basic) directory for working configs.

## Future

An automated Vite plugin is planned that will handle all 3 builds automatically.

For now, explicit configs give you full control and visibility.
