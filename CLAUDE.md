# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps + generate Prisma client + run migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Build
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Reset database
npm run db:reset
```

## Architecture

UIGen is a Next.js 15 App Router application that uses Claude AI to generate React components with a live preview. The core data flow is:

1. **Chat** → user describes a component
2. **AI API** (`src/app/api/chat/route.ts`) → streams Claude's response using Vercel AI SDK with two tools: `str_replace_editor` and `file_manager`
3. **Virtual File System** (`src/lib/file-system.ts`) → AI tool calls mutate an in-memory VFS (never touches disk)
4. **Preview** → JSX files in the VFS are transpiled via Babel in-browser and rendered in an `<iframe>` via an ES module import map

### Key abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`): In-memory file tree backed by a `Map<string, FileNode>`. Supports CRUD + rename, plus text-editor-style operations (`viewFile`, `replaceInFile`, `insertInFile`). Serializes/deserializes to plain JSON for API transport and database storage.

**FileSystemContext** (`src/lib/contexts/file-system-context.tsx`): React context that wraps `VirtualFileSystem`, triggers re-renders via a `refreshTrigger` counter, and exposes `handleToolCall` — the bridge between AI tool call responses and VFS mutations.

**AI Tools** (`src/lib/tools/`):
- `str_replace_editor`: Handles `create`, `str_replace`, and `insert` commands on VFS paths
- `file_manager`: Handles `rename` and `delete` commands

**JSX Transform Pipeline** (`src/lib/transform/jsx-transformer.ts`): On every VFS change, `createImportMap` transforms all `.jsx/.tsx` files with Babel standalone, creates Blob URLs for each, builds an ES importmap (with `@/` alias support), and resolves third-party imports via `esm.sh`. `createPreviewHTML` assembles the final iframe `srcdoc`.

**Preview** (`src/components/preview/PreviewFrame.tsx`): Subscribes to `refreshTrigger` from FileSystemContext, calls the transform pipeline, and sets `iframe.srcdoc`. The iframe has `allow-scripts allow-same-origin allow-forms` sandbox flags required for importmap + blob URL support.

### Auth & persistence

The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of data stored in the database.

- JWT-based auth via `jose`, stored in httpOnly cookies (`src/lib/auth.ts`)
- Prisma + SQLite (`prisma/schema.prisma`): two models — `User` and `Project`
- `Project.messages` and `Project.data` are JSON strings (chat history + serialized VFS)
- Only authenticated users have projects saved; anonymous sessions use `src/lib/anon-work-tracker.ts`
- Middleware (`src/middleware.ts`) guards `/api/projects` and `/api/filesystem` routes
- Prisma client is generated to `src/generated/prisma/`

### Provider abstraction

`src/lib/provider.ts` returns a language model — either `claude-sonnet-4-5` (when `ANTHROPIC_API_KEY` is set) or a mock provider. The mock caps `maxSteps` at 4 to avoid repetition.

### Generated components convention

Every AI-generated project must have `/App.jsx` as the entry point with a default export. All cross-file imports use the `@/` alias (e.g., `@/components/Button`). Tailwind CSS (loaded from CDN in the preview iframe) is used for styling — no hardcoded styles.

### Environment

Copy `.env` and set:
```
ANTHROPIC_API_KEY=your-key   # optional; falls back to mock provider
JWT_SECRET=your-secret        # optional; defaults to "development-secret-key"
```
