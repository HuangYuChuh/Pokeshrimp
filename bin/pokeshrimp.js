#!/usr/bin/env node

// Thin loader that bootstraps tsx so TypeScript + path aliases work at runtime.
// This lets `npx pokeshrimp` (or `npx pokeshrimp chat`) launch the CLI REPL
// without a separate compile step.

const path = require("path");

// Register tsx so Node can import .ts files with tsconfig paths support.
require("tsx/cjs");

// Load the actual CLI entry point.
require(path.resolve(__dirname, "..", "src", "cli", "index.ts"));
