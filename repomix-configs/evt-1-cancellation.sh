#!/bin/bash

# EVT-1: Event Cancellation Communication & Refund Flow
# This script creates a focused context bundle for implementing event cancellation features
# Run from project root: ./repomix-configs/evt-1-cancellation.sh

echo "Creating context bundle for EVT-1: Event Cancellation..."

# First check token count
echo "Checking token count..."
npx repomix@latest \
  --token-count-tree 100 \
  --config repomix-configs/evt-1-cancellation.json

echo ""
echo "Generating bundle (target: <60k tokens)..."

# Generate the bundle with git context
npx repomix@latest \
  --config repomix-configs/evt-1-cancellation.json \
  --include-diffs \
  --include-logs --include-logs-count 20 \
  --header-text "EVT-1: Event Cancellation Communication & Refund Flow - Implementation Context"

echo "Bundle created: repomix-configs/outputs/evt1-cancellation.xml"