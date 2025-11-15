# Canvas Sync CLI

This is a CLI tool for downloading files from Canvas.
It uses the [Canvas API](https://canvas.instructure.com/doc/api/files.html)
to download files from a course.

Inspired by [Lominus](https://github.com/Beebeeoii/lominus).

## Development

Navigate to the `/cli` directory and run:

```bash
bun run build
bun link
```

## Usage

```bash
# npx
npx canvas-sync sync
# bun
bunx canvas-sync sync
# pnpm
pnpm dlx canvas-sync sync
```
