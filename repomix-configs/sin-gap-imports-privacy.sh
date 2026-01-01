#!/bin/bash

# SIN RFP Gap Closure - Imports/Privacy/Retention Bundle (DM-AGG-005, DM-AGG-006)
# Covers: Import wizard, privacy/retention, archival
# ~53k tokens
#
# Run from project root: ./repomix-configs/sin-gap-imports-privacy.sh

echo "Creating context bundle for SIN Gap Closure - Imports/Privacy..."

npx repomix@latest \
  --token-count-tree 50 \
  --config repomix-configs/sin-gap-imports-privacy.json

echo ""
echo "Generating bundle..."

npx repomix@latest \
  --config repomix-configs/sin-gap-imports-privacy.json \
  --header-text "SIN RFP Gap Closure - Imports/Privacy/Retention (DM-AGG-005, DM-AGG-006)"

echo "Bundle created: repomix-configs/outputs/sin-gap-imports-privacy.xml"
