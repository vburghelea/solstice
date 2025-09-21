#!/bin/bash

# EVT-3: Event Mutation Time & Metadata Utilities
# This script creates a minimal context bundle for refactoring utilities
# Run from project root: ./repomix-configs/evt-3-utilities.sh

echo "Creating context bundle for EVT-3: Time & Metadata Utilities..."

# Check token count
echo "Checking token count..."
npx repomix@latest \
  --token-count-tree \
  --config repomix-configs/evt-3-utilities.json

echo ""
echo "Generating minimal bundle (target: <20k tokens)..."

# Generate compressed bundle without comments
npx repomix@latest \
  --config repomix-configs/evt-3-utilities.json \
  --compress \
  --header-text "EVT-3: Event Mutation Time & Metadata Utilities - Refactoring Context"

echo "Bundle created: repomix-configs/outputs/evt3-utilities.xml"