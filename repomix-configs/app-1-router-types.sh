#!/bin/bash

# APP-1: Router Event Type Coverage & Diagnostics
# This script creates a minimal context bundle for router type improvements
# Run from project root: ./repomix-configs/app-1-router-types.sh

echo "Creating context bundle for APP-1: Router Type Coverage..."

# Check token count
echo "Checking token count..."
npx repomix@latest \
  --token-count-tree \
  --config repomix-configs/app-1-router-types.json

echo ""
echo "Generating compact bundle (target: <15k tokens)..."

# Generate the bundle
npx repomix@latest \
  --config repomix-configs/app-1-router-types.json \
  --header-text "APP-1: Router Event Type Coverage & Diagnostics - TypeScript Enhancement"

echo "Bundle created: repomix-configs/outputs/app1-router-types.xml"