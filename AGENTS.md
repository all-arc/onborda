# Repository Guidelines

## Project Structure & Module Organization

This repository is a TypeScript React/Next.js library for onboarding tours. Source files live in `src/`:

- `src/Okido.tsx` contains the main tour overlay component and positioning logic.
- `src/OkidoContext.tsx` provides `OkidoProvider` and the `useOkido` hook.
- `src/types/index.ts` defines the public types exported by the package.
- `src/index.ts` is the package entrypoint.

Compiled package output is committed in `dist/` and is referenced by `package.json` via `main` and `types`. Update `dist/` with a build before release-oriented changes.

## Build, Test, and Development Commands

Use pnpm; the package is pinned with `packageManager: pnpm@9.15.0`.

```bash
pnpm install
pnpm build
pnpm start
```

- `pnpm install` installs dependencies from `pnpm-lock.yaml`.
- `pnpm build` runs `tsc --project tsconfig.json` and emits JavaScript plus declarations to `dist/`.
- `pnpm start` builds and then runs `node dist/index.js`; treat this as a basic smoke command for the library entrypoint.

## Coding Style & Naming Conventions

Write strict TypeScript and React function components. Keep public types in `src/types/index.ts` and export public API from `src/index.ts`. Use PascalCase for components and interfaces such as `OkidoProps`, camelCase for variables, callbacks, and hooks such as `useOkido`.

Existing code uses two-space indentation, double quotes for imports/strings, semicolons, and `"use client"` for client-side React modules. There is no configured formatter or linter, so keep edits consistent with neighboring code.

## Testing Guidelines

No automated test framework is currently configured. For behavior changes, at minimum run:

```bash
pnpm build
```

When adding tests, prefer colocated `*.test.ts` or `*.test.tsx` files under `src/`, and add a `test` script to `package.json` so contributors have a single command to run.

## Commit & Pull Request Guidelines

Recent history mostly uses concise Conventional Commit-style prefixes such as `feat:`, `fix:`, `docs:`, `refactor:`, and `chore:`. Prefer that style, for example `feat: add lifecycle callback` or `docs: clarify custom card props`.

Pull requests should include a short summary, user-facing impact, verification performed, and any README/API updates. Include screenshots or screen recordings for visual tour behavior changes, especially overlay positioning, mobile responsiveness, keyboard navigation, or custom card rendering.
