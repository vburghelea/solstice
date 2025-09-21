#!/bin/bash

# DOC-1: Backlog & Release Notes Alignment
# This script creates a documentation-focused context bundle
# Run from project root: ./repomix-configs/doc-1-alignment.sh

echo "Creating context bundle for DOC-1: Documentation Alignment..."

# Check token count
echo "Checking token count..."
npx repomix@latest \
  --token-count-tree \
  --config repomix-configs/doc-1-alignment.json

echo ""
echo "Generating documentation bundle (target: <10k tokens)..."

# Generate the bundle
npx repomix@latest \
  --config repomix-configs/doc-1-alignment.json \
  --header-text "DOC-1: Backlog & Release Notes Alignment - Documentation Updates"

echo "Bundle created: repomix-configs/outputs/doc1-alignment.xml"