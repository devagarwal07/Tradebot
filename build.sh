#!/bin/bash

# Build the frontend
npm run build

# Build the API files for Vercel serverless
esbuild server/index.ts api/index.ts api/server.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
