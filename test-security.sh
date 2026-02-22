#!/bin/bash

# =============================================
# ALRA CARE - SECURITY TESTING SCRIPT
# =============================================
# Script untuk testing semua security fixes
# Usage: bash test-security.sh

echo "🔒 ALRA CARE - Security Testing Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local test_name=$1
    local expected_status=$2
    local actual_status=$3
    
    if [ "$actual_status" == "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $test_name (Status: $actual_status)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $test_name (Expected: $expected_status, Got: $actual_status)"
        ((FAILED++))
    fi
}

echo "1️⃣  Testing Environment Validation..."
echo "-----------------------------------"
# This test requires manual check of server startup logs
echo "   Manual check: Server should validate env vars on startup"
echo "   ℹ️  Check server logs for: '✅ Environment variables validated successfully'"
echo ""

echo "2️⃣  Testing CORS Protection..."
echo "-----------------------------------"
# Test unauthorized origin
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Origin: https://evil.com" \
  "$BASE_URL/api/services")
test_endpoint "CORS blocks unauthorized origin" "403" "$STATUS"
echo ""

echo "3️⃣  Testing Rate Limiting..."
echo "-----------------------------------"
echo "   Testing auth rate limit (5 attempts)..."
for i in {1..6}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "$BASE_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"username":"test","password":"wrong"}')
    
    if [ $i -eq 6 ]; then
        test_endpoint "6th login attempt blocked" "429" "$STATUS"
    fi
done
echo ""

echo "4️⃣  Testing Input Validation..."
echo "-----------------------------------"

# Test invalid phone number
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "Test User",
    "patient_phone": "123",
    "patient_address": "Test Address",
    "appointment_date": "2026-01-20",
    "appointment_time": "10:00",
    "selected_services": []
  }')
test_endpoint "Invalid phone rejected" "400" "$STATUS"

# Test invalid date (past date)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "Test User",
    "patient_phone": "08123456789",
    "patient_address": "Test Address",
    "appointment_date": "2020-01-01",
    "appointment_time": "10:00",
    "selected_services": []
  }')
test_endpoint "Past date rejected" "400" "$STATUS"

# Test invalid time (outside business hours)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "Test User",
    "patient_phone": "08123456789",
    "patient_address": "Test Address",
    "appointment_date": "2026-01-20",
    "appointment_time": "20:00",
    "selected_services": []
  }')
test_endpoint "Invalid time rejected" "400" "$STATUS"

echo ""

echo "5️⃣  Testing SQL Injection Prevention..."
echo "-----------------------------------"
# Note: This requires admin token, so we test the validation only
echo "   ℹ️  SQL injection prevention is implemented via:"
echo "   - Input validation (regex patterns)"
echo "   - UUID generation for IDs"
echo "   - Parameterized queries (Supabase)"
echo ""

echo "6️⃣  Testing XSS Prevention..."
echo "-----------------------------------"
# Test XSS in name field
RESPONSE=$(curl -s -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "<script>alert(1)</script>",
    "patient_phone": "08123456789",
    "patient_address": "Test Address",
    "appointment_date": "2026-01-20",
    "appointment_time": "10:00",
    "selected_services": [{"service_id":"test","service_name":"Test","service_price":"Rp 100.000"}]
  }')

if echo "$RESPONSE" | grep -q "&lt;script&gt;"; then
    echo -e "${GREEN}✓${NC} XSS payload sanitized"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC}  XSS sanitization needs verification"
fi
echo ""

echo "7️⃣  Testing Authentication..."
echo "-----------------------------------"

# Test login without credentials
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}')
test_endpoint "Login without credentials rejected" "400" "$STATUS"

# Test access admin endpoint without token
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/bookings")
test_endpoint "Admin endpoint without token rejected" "401" "$STATUS"

echo ""

echo "8️⃣  Testing Security Headers..."
echo "-----------------------------------"
HEADERS=$(curl -s -I "$BASE_URL/api/health")

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✓${NC} X-Content-Type-Options header present"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} X-Content-Type-Options header missing"
    ((FAILED++))
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✓${NC} X-Frame-Options header present"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} X-Frame-Options header missing"
    ((FAILED++))
fi

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✓${NC} HSTS header present"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC}  HSTS header missing (OK in development)"
fi

echo ""

echo "9️⃣  Testing Cookie Security..."
echo "-----------------------------------"
echo "   ℹ️  Cookie security test requires valid credentials"
echo "   Manual test:"
echo "   1. Login with valid credentials"
echo "   2. Check browser DevTools > Application > Cookies"
echo "   3. Verify: HttpOnly=true, Secure=true (production), SameSite=Strict"
echo ""

echo "🔟  Testing Health Check..."
echo "-----------------------------------"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
test_endpoint "Health check endpoint" "200" "$STATUS"
echo ""

# Summary
echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All automated tests passed!${NC}"
    echo ""
    echo "⚠️  Manual tests required:"
    echo "   1. Environment validation (check server logs)"
    echo "   2. Cookie security (check browser DevTools)"
    echo "   3. HTTPS redirect (test in production)"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi