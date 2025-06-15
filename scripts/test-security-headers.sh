#!/bin/bash

# Test security headers
# Usage: ./scripts/test-security-headers.sh [URL]

URL="${1:-http://localhost:8888}"

echo "Testing security headers at: $URL"
echo "=================================="

# Function to check header
check_header() {
    local header_name="$1"
    local expected_value="$2"
    local actual_value=$(curl -s -I "$URL" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r\n')
    
    if [ -n "$actual_value" ]; then
        echo "✅ $header_name: $actual_value"
        if [ -n "$expected_value" ] && [[ "$actual_value" != *"$expected_value"* ]]; then
            echo "   ⚠️  Expected to contain: $expected_value"
        fi
    else
        echo "❌ $header_name: Not found"
    fi
}

# Test all security headers
check_header "Content-Security-Policy"
check_header "X-Frame-Options" "DENY"
check_header "X-Content-Type-Options" "nosniff"
check_header "Referrer-Policy" "strict-origin-when-cross-origin"
check_header "X-XSS-Protection" "1; mode=block"
check_header "Permissions-Policy"
check_header "Strict-Transport-Security"

echo ""
echo "Full headers:"
echo "============="
curl -s -I "$URL" | grep -E "^(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|X-XSS-Protection|Permissions-Policy|Strict-Transport-Security):"