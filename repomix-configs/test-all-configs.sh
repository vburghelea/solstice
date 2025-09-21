#!/bin/bash

# Test all Repomix configurations and display token counts
# Run from project root: ./repomix-configs/test-all-configs.sh

echo "🔍 Testing all Repomix configurations..."
echo "========================================="
echo ""

# Function to test a config
test_config() {
    local name=$1
    local config=$2
    local target_tokens=$3

    echo "📦 $name (Target: <$target_tokens tokens)"
    echo "-------------------------------------------"

    # Generate the bundle and capture token info
    npx repomix@latest --config "$config" 2>&1 | grep -E "(Total Tokens:|Total Files:|Output:)" | sed 's/^/  /'

    echo ""
}

# Test each configuration
test_config "EVT-1: Event Cancellation" "repomix-configs/evt-1-cancellation.json" "50k"
test_config "EVT-2: Pricing Tests" "repomix-configs/evt-2-pricing-tests.json" "30k"
test_config "EVT-3: Utilities" "repomix-configs/evt-3-utilities.json" "20k"
test_config "APP-1: Router Types" "repomix-configs/app-1-router-types.json" "15k"
test_config "DOC-1: Documentation" "repomix-configs/doc-1-alignment.json" "10k"

echo "✅ All configurations tested!"
echo ""
echo "Generated files are in: repomix-configs/outputs/"
ls -lh repomix-configs/outputs/*.xml 2>/dev/null | awk '{print "  - " $NF " (" $5 ")"}' || echo "  (No files generated yet)"