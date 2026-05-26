import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle at .next/standalone so the Docker
  // runner image only needs the traced deps, not the full monorepo node_modules.
  output: 'standalone',
  experimental: {
    // In a monorepo, point the file tracer at the workspace root so hoisted
    // deps (e.g. next, react) resolve correctly into the standalone output.
    // (Top-level in Next 15; under `experimental` in 14.x.)
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

export default nextConfig;
