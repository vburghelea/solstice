#!/bin/bash

# SIN RFP Gap Closure - BI/SQL Workbench Bundle (DM-AGG-003)
# Covers: Admin DB explorer, SQL Workbench schema browser
# ~45k tokens
#
# Run from project root: ./repomix-configs/sin-gap-bi.sh

echo "Creating context bundle for SIN Gap Closure - BI/SQL Workbench..."

npx repomix@latest \
  --token-count-tree 50 \
  --config repomix-configs/sin-gap-bi.json

echo ""
echo "Generating bundle..."

npx repomix@latest \
  --config repomix-configs/sin-gap-bi.json \
  --header-text "SIN RFP Gap Closure - BI/SQL Workbench (DM-AGG-003)"

echo "Bundle created: repomix-configs/outputs/sin-gap-bi.xml"
