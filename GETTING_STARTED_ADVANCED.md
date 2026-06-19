# 🚀 Getting Started with Advanced Features

## Quick Implementation Guide

This guide will help you get started with the new multi-platform verification system.

---

## Phase 1: Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd server
npm install
```

This installs `js-levenshtein` which is needed for fuzzy matching.

### Step 2: Update Your App.jsx

Add the Admin Dashboard to your React app navigation:

```jsx
// In client/src/App.jsx
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/admin" element={<AdminDashboard />} />  {/* Add this */}
      </Routes>
    </div>
  );
}
```

### Step 3: Add Navigation Link

```jsx
// In client/src/components/Navbar.jsx
<nav>
  <Link to="/">Dashboard</Link>
  <Link to="/history">History</Link>
  <Link to="/leads">Leads</Link>
  <Link to="/admin">Admin</Link>  {/* Add this */}
</nav>
```

### Step 4: Restart Your Servers

```bash
# Terminal 1: Start backend
npm --prefix server start

# Terminal 2: Start frontend
npm --prefix client run dev
```

Visit: `http://localhost:5173/admin`

---

## Phase 2: Create Platforms (2 minutes)

### In Admin Dashboard → Platforms Tab:

1. **Add JustDial Platform**
   ```
   Name: JustDial
   Category: Directory
   Method: web_scrape
   Description: Business directory with verified listings
   URL: https://justdial.com
   ```

2. **Add TradeIndia Platform**
   ```
   Name: TradeIndia
   Category: Directory
   Method: web_scrape
   Description: Business-to-business portal
   URL: https://tradeindia.com
   ```

3. **Add Google Maps Platform**
   ```
   Name: Google Maps
   Category: Maps
   Method: api
   Description: Business listings from Google
   URL: https://maps.google.com
   ```

---

## Phase 3: Create Verification Rules (3 minutes)

### In Admin Dashboard → Verification Rules Tab:

1. **Create Phone Verification Rule**
   ```
   Name: Multi-Platform Phone Match
   Type: Match Across Platforms
   Field: Phone
   Required Matches: 2
   Select Platforms: JustDial, TradeIndia, Google Maps
   ```

2. **Create Business Name Rule**
   ```
   Name: Business Name Fuzzy Match
   Type: Fuzzy Match
   Field: Business Name
   Required Matches: 2
   Select Platforms: JustDial, TradeIndia
   ```

3. **Create Email Rule**
   ```
   Name: Email Verification
   Type: Match Across Platforms
   Field: Email
   Required Matches: 1
   Select Platforms: All selected
   ```

---

## Phase 4: Create Organization (2 minutes)

### Via API (Using Postman or curl):

```bash
POST http://localhost:5000/api/organizations

Body:
{
  "name": "Your Company Name",
  "description": "Our sales lead verification",
  "adminEmail": "your-email@company.com",
  "enabledPlatforms": ["platform-id-1", "platform-id-2"],
  "verificationRules": ["rule-id-1", "rule-id-2"],
  "settings": {
    "minAccuracyScoreForApproval": 70,
    "requireMultiplePlatformVerification": true,
    "autoApproveHighConfidence": false,
    "enableFuzzyMatching": true
  }
}
```

Save the returned `_id` - you'll need it for verification!

---

## Phase 5: Verify Your First Lead (1 minute)

### Via API:

```bash
POST http://localhost:5000/api/lead-verification/{lead-id}/verify

Body:
{
  "organizationId": "your-org-id-here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationStatus": "verified",
    "accuracyScore": 85,
    "matchedFields": {
      "businessName": 2,
      "phone": 3
    },
    "flags": ["verified_legitimate", "phone_verified"],
    "details": "Lead verified across 3 platforms..."
  }
}
```

### View Results in Dashboard:

1. Go to `/admin` → Lead Verification tab
2. Enter your Organization ID
3. Click "Set Organization"
4. View all verified leads with status and accuracy

---

## 🎯 Common Workflows

### Workflow 1: Verify All Scraped Leads

```bash
# Get all recent leads
GET /api/leads

# Batch verify them
POST /api/lead-verification/batch

Body:
{
  "leadIds": ["id1", "id2", "id3"],
  "organizationId": "your-org-id"
}
```

### Workflow 2: Review & Approve Leads

```bash
# Get suspicious leads
GET /api/lead-verification/status/your-org-id?status=suspicious

# Review each one and approve if valid
PATCH /api/lead-verification/{leadId}/approve

Body:
{
  "organizationId": "your-org-id",
  "approvedBy": "user-id"
}

# Or reject if invalid
PATCH /api/lead-verification/{leadId}/reject

Body:
{
  "organizationId": "your-org-id",
  "reason": "Invalid phone number"
}
```

### Workflow 3: Get Verification Statistics

```bash
# Get statistics for your organization
GET /api/lead-verification/stats/your-org-id

# Response:
{
  "total": 150,
  "verified": 125,      (83%)
  "suspicious": 15,     (10%)
  "unverified": 10,     (7%)
  "averageAccuracy": 78
}
```

---

## 📊 Example: Full Setup with cURL

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"

# 1. Create platforms
PLATFORM_1=$(curl -X POST "$BASE_URL/api/platforms" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "JustDial",
    "category": "directory",
    "scrapingMethod": "web_scrape"
  }' | jq -r '.data._id')

PLATFORM_2=$(curl -X POST "$BASE_URL/api/platforms" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TradeIndia",
    "category": "directory",
    "scrapingMethod": "web_scrape"
  }' | jq -r '.data._id')

# 2. Create verification rule
RULE_ID=$(curl -X POST "$BASE_URL/api/verification-rules" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Phone Match\",
    \"ruleType\": \"match_across_platforms\",
    \"fieldToMatch\": \"phone\",
    \"requiredMatches\": 2,
    \"matchingPlatforms\": [\"$PLATFORM_1\", \"$PLATFORM_2\"]
  }" | jq -r '.data._id')

# 3. Create organization
ORG_ID=$(curl -X POST "$BASE_URL/api/organizations" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"TechCorp\",
    \"adminEmail\": \"admin@techcorp.com\",
    \"enabledPlatforms\": [\"$PLATFORM_1\", \"$PLATFORM_2\"],
    \"verificationRules\": [\"$RULE_ID\"],
    \"settings\": {
      \"minAccuracyScoreForApproval\": 70,
      \"requireMultiplePlatformVerification\": true
    }
  }" | jq -r '.data._id')

echo "Organization created: $ORG_ID"
echo "Save this ID for verification!"
```

---

## 🔍 Testing Your Setup

### Test 1: Verify Setup Completeness

```bash
# Check platforms created
curl http://localhost:5000/api/platforms

# Check rules created
curl http://localhost:5000/api/verification-rules

# Check organization created
curl http://localhost:5000/api/organizations
```

### Test 2: Verify a Lead

```bash
# Get a lead ID first
LEAD_ID=$(curl http://localhost:5000/api/leads | jq -r '.data[0]._id')

# Verify it
curl -X POST "http://localhost:5000/api/lead-verification/$LEAD_ID/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "your-org-id"
  }' | jq '.'
```

---

## 🚀 Advanced: Custom Verification Rules

Create a custom rule for specific requirements:

```javascript
// Create a rule in the database (or via API):
{
  name: "Custom: Whitelist Check",
  description: "Only approve leads from whitelisted companies",
  ruleType: "custom",
  customValidation: `
    function validate(lead, platforms) {
      const whitelist = ['acme', 'techcorp', 'megacorp'];
      const name = lead.businessName.toLowerCase();
      return whitelist.some(w => name.includes(w));
    }
  `,
  organizationId: "org-id"
}
```

---

## 📚 File Structure Reference

```
ScrapeItEasy/
├── server/
│   ├── models/
│   │   ├── Platform.js ..................... Platform definitions
│   │   ├── VerificationRule.js ............ Verification rules
│   │   ├── Organization.js ............... Organization settings
│   │   ├── LeadVerification.js ........... Verification results
│   │   └── Lead.js ...................... Lead data model
│   ├── routes/
│   │   ├── platforms.js ................. Platform CRUD
│   │   ├── verification-rules.js ........ Rule CRUD
│   │   ├── organizations.js ............ Org management
│   │   ├── lead-verification.js ........ Verify leads
│   │   └── scrape.js .................. Scraping logic
│   ├── services/
│   │   └── verificationService.js ...... Verification engine
│   └── index.js
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   └── AdminDashboard.jsx ...... Admin UI
│   │   ├── components/
│   │   │   ├── PlatformManagement.jsx
│   │   │   ├── VerificationRulesManager.jsx
│   │   │   └── LeadVerificationDashboard.jsx
│   │   └── styles/
│   │       └── admin-dashboard.css
└── ADVANCED_FEATURES.md ..................... Full documentation
```

---

## ✅ Checklist: Is Everything Set Up?

- [ ] Dependencies installed (`npm install` in server)
- [ ] Admin Dashboard added to App.jsx
- [ ] Navigation link added
- [ ] At least 2 platforms created
- [ ] At least 1 verification rule created
- [ ] Organization created and ID saved
- [ ] Can access `/admin` page
- [ ] Can see statistics in Lead Verification tab

---

## 🆘 Troubleshooting

### "Cannot find module 'js-levenshtein'"
```bash
# Fix:
cd server
npm install js-levenshtein
```

### "Organization not found" error
- Make sure you saved the Organization ID correctly
- Check MongoDB is running and connected
- Verify the ID in your request matches

### Verification scores always 0%
- Check that you have at least 2 platforms enabled
- Verify leads have data from multiple platforms
- Check that verification rules are activated

---

## 🎓 Next Learning Steps

1. **Advanced Configurations** - Read `ADVANCED_FEATURES.md`
2. **API Reference** - Check detailed endpoint docs
3. **Custom Rules** - Implement domain-specific verification
4. **Scaling** - Set up multiple organizations
5. **Analytics** - Build reports on verification trends

---

**You're ready to go!** Start verifying leads now! 🎉
