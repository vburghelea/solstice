#!/bin/bash

# EVT-2: Event Registration Pricing & Payment Tests
# This script creates a focused context bundle for adding test coverage to pricing logic
# Run from project root: ./repomix-configs/evt-2-pricing-tests.sh

echo "Creating context bundle for EVT-2: Registration Pricing Tests..."

# Check token count first
echo "Checking token count..."
npx repomix@latest \
  --token-count-tree 100 \
  --config repomix-configs/evt-2-pricing-tests.json

echo ""
echo "Generating bundle with test focus (target: <40k tokens)..."

# Generate compact bundle focused on testing
npx repomix@latest \
  --config repomix-configs/evt-2-pricing-tests.json \
  --compress \
  --header-text "EVT-2: Event Registration Pricing & Payment Tests - Test Coverage Implementation"

echo "Bundle created: repomix-configs/outputs/evt2-pricing-tests.xml"