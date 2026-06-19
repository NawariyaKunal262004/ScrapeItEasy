# 🎯 Advanced Features Documentation

## Multi-Platform Data Verification & Cross-Validation System

This document explains the new advanced features that have been added to ScrapeItEasy.

---

## 📋 Overview

The system now supports:

1. **Dynamic Platform Management** - Add/remove scraping platforms via UI
2. **Multi-Platform Data Verification** - Cross-verify lead data accuracy
3. **Organization-Level Customization** - Each organization configures their own setup
4. **Intelligent Data Scoring** - Automatic accuracy calculation
5. **Manual Review Dashboard** - Approve/reject leads based on verification results

---

## 🏗️ Architecture

### Database Models

#### 1. **Platform** (`models/Platform.js`)
Represents a data scraping source.

```javascript
{
  name: "JustDial",                    // Platform name
  description: "Business directory",   // Description
  url: "https://justdial.com",        // Platform URL
  category: "directory",               // Type: directory, api, social, etc.
  scrapingMethod: "web_scrape",       // How data is fetched
  requiredFields: ["businessName", "phone", "email"],  // Must-have fields
  optionalFields: ["ownerName", "address"],            // Nice-to-have fields
  creditsPerScrape: 1,                // Cost to scrape this platform
  rateLimit: {
    requestsPerHour: 100,
    requestsPerDay: 1000
  },
  isActive: true
}
```

#### 2. **VerificationRule** (`models/VerificationRule.js`)
Defines how to verify data across platforms.

```javascript
{
  name: "Phone Match Across 2 Platforms",
  ruleType: "match_across_platforms",      // Type of verification
  fieldToMatch: "phone",                   // Which field to check
  requiredMatches: 2,                      // How many platforms must match
  matchingPlatforms: [platformId1, platformId2],
  confidenceWeight: 2,                     // Importance in scoring
  isActive: true
}
```

#### 3. **Organization** (`models/Organization.js`)
Organization-level configuration.

```javascript
{
  name: "TechCorp Ltd",
  adminEmail: "admin@techcorp.com",
  enabledPlatforms: [platformId1, platformId2],     // Which platforms they use
  verificationRules: [ruleId1, ruleId2],            // Their verification rules
  settings: {
    minAccuracyScoreForApproval: 70,       // Auto-approve if score >= 70%
    requireMultiplePlatformVerification: true,
    autoApproveHighConfidence: false,
    enableFuzzyMatching: true              // Allow similar strings to match
  },
  totalLeadsScraped: 1500,
  totalLeadsVerified: 1200,
  members: [
    {
      email: "user@techcorp.com",
      role: "admin"                        // admin, editor, viewer
    }
  ]
}
```

#### 4. **LeadVerification** (`models/LeadVerification.js`)
Verification results for each lead.

```javascript
{
  leadId: leadObjectId,
  sourcePlatforms: [
    {
      platformName: "JustDial",
      data: { businessName: "Acme Corp", phone: "9876543210" },
      scrapedDate: "2024-01-15"
    },
    {
      platformName: "TradeIndia",
      data: { businessName: "Acme Corp", phone: "9876543210" }
    }
  ],
  verificationStatus: "verified",    // verified | suspicious | unverified | pending
  accuracyScore: 95,                 // 0-100 confidence level
  matchedFields: {
    businessName: 2,                 // 2 platforms have matching business name
    phone: 2,
    email: 1
  },
  flags: ["verified_legitimate", "phone_verified"],
  details: "Lead verified across 2 platforms..."
}
```

---

## 🔄 Verification Process

### How Cross-Verification Works

```
1. Lead Scraped
   ├─ Platform 1: businessName="Acme", phone="9876543210"
   ├─ Platform 2: businessName="Acme Corp", phone="9876543210"
   └─ Platform 3: businessName="Acme", email="contact@acme.com"
   
2. Verification Engine
   ├─ Apply Fuzzy Matching → "Acme" ≈ "Acme Corp" ✓
   ├─ Check Phone Match → 9876543210 in all 3 ✓
   ├─ Check Email Match → contact@acme.com (1 platform)
   └─ Calculate Score:
       • Phone: 40pts (appears in 3 platforms)
       • Business Name: 30pts (matched after fuzzy)
       • Multiple platforms: +10pts bonus
       = 80% Total Confidence
   
3. Status Assignment
   ├─ If score >= 80%: VERIFIED ✓
   ├─ If 50% <= score < 80%: VERIFIED (Requires Manual Review)
   └─ If score < 50%: SUSPICIOUS ⚠️
```

---

## 🎮 API Endpoints

### Platforms

```bash
# Get all platforms
GET /api/platforms

# Create new platform
POST /api/platforms
Body: { name, description, url, category, scrapingMethod }

# Update platform
PUT /api/platforms/:id
Body: { name, isActive, ... }

# Toggle platform status
PATCH /api/platforms/:id/toggle

# Delete platform
DELETE /api/platforms/:id
```

### Verification Rules

```bash
# Get all verification rules
GET /api/verification-rules

# Create new rule
POST /api/verification-rules
Body: {
  name: "Phone Match Rule",
  ruleType: "match_across_platforms",
  fieldToMatch: "phone",
  requiredMatches: 2,
  matchingPlatforms: [id1, id2]
}

# Update rule
PUT /api/verification-rules/:id

# Delete rule
DELETE /api/verification-rules/:id

# Test rule with data
POST /api/verification-rules/:id/test
Body: { testData: { ... } }
```

### Organizations

```bash
# Get all organizations
GET /api/organizations

# Create organization
POST /api/organizations
Body: {
  name: "TechCorp",
  adminEmail: "admin@techcorp.com",
  enabledPlatforms: [id1, id2],
  verificationRules: [id1]
}

# Add platform to organization
POST /api/organizations/:id/platforms
Body: { platformId }

# Remove platform
DELETE /api/organizations/:id/platforms/:platformId

# Add verification rule
POST /api/organizations/:id/verification-rules
Body: { ruleId }

# Update organization settings
PUT /api/organizations/:id/settings
Body: {
  minAccuracyScoreForApproval: 75,
  enableFuzzyMatching: true
}
```

### Lead Verification

```bash
# Verify single lead
POST /api/lead-verification/:leadId/verify
Body: { organizationId }

# Batch verify leads
POST /api/lead-verification/batch
Body: { leadIds: [id1, id2], organizationId }

# Get verification result
GET /api/lead-verification/:leadId?organizationId=orgId

# Get verification statistics
GET /api/lead-verification/stats/:organizationId

# Get verified leads by status
GET /api/lead-verification/status/:organizationId?status=verified

# Approve lead
PATCH /api/lead-verification/:leadId/approve
Body: { organizationId, approvedBy: userId }

# Reject lead
PATCH /api/lead-verification/:leadId/reject
Body: { organizationId, reason: "Invalid phone" }
```

---

## 🎨 UI Components

### Admin Dashboard (`pages/AdminDashboard.jsx`)

Main admin interface with three tabs:

#### 1. **Platform Management**
- Add new platforms
- Enable/disable platforms
- Delete platforms
- View all available platforms

**Features:**
- Support for 6 platform categories: directory, classifieds, maps, social, api, custom
- Configure scraping method: web_scrape, api, manual, import
- Set rate limits per platform
- Define required and optional fields

#### 2. **Verification Rules Manager**
- Create custom verification rules
- Select which fields to verify (businessName, phone, email, ownerName)
- Choose which platforms to use for verification
- Set confidence weights
- Delete rules

**Rule Types:**
- `match_across_platforms` - Data must match across N platforms
- `field_validation` - Individual field validation
- `fuzzy_match` - Fuzzy string matching
- `custom` - Custom JavaScript validation

#### 3. **Lead Verification Dashboard**
- Real-time verification statistics
- View all verified leads
- Filter by verification status
- Approve/reject leads
- Accuracy score visualization
- Source platform information

**Stats Displayed:**
- Total leads verified
- Verified count (✓)
- Suspicious count (⚠️)
- Unverified count (?)
- Average accuracy score

---

## 🚀 Usage Examples

### Example 1: Add a New Platform

```javascript
// POST /api/platforms
{
  "name": "Google Maps",
  "description": "Business listings from Google Maps",
  "url": "https://maps.google.com",
  "category": "maps",
  "scrapingMethod": "api",
  "requiredFields": ["businessName", "phone", "address"],
  "optionalFields": ["ownerName", "website", "email"],
  "creditsPerScrape": 2,
  "rateLimit": {
    "requestsPerHour": 50,
    "requestsPerDay": 500
  }
}

// Response:
{
  "success": true,
  "message": "Platform created successfully",
  "data": { _id: "507f1f77...", ... }
}
```

### Example 2: Create a Verification Rule

```javascript
// POST /api/verification-rules
{
  "name": "Multi-Platform Phone Verification",
  "description": "Verify that phone appears in at least 2 platforms",
  "ruleType": "match_across_platforms",
  "fieldToMatch": "phone",
  "requiredMatches": 2,
  "matchingPlatforms": ["507f1f77...", "507f1f88..."],
  "confidenceWeight": 3
}
```

### Example 3: Set Up Organization

```javascript
// POST /api/organizations
{
  "name": "TechCorp Sales",
  "adminEmail": "sales@techcorp.com",
  "enabledPlatforms": ["507f1f77...", "507f1f88..."],
  "verificationRules": ["507f2222..."],
  "settings": {
    "minAccuracyScoreForApproval": 70,
    "requireMultiplePlatformVerification": true,
    "autoApproveHighConfidence": false,
    "enableFuzzyMatching": true
  }
}
```

### Example 4: Verify a Lead

```javascript
// POST /api/lead-verification/507f1f77.../verify
{
  "organizationId": "507f3333..."
}

// Response:
{
  "success": true,
  "message": "Lead verified",
  "data": {
    "_id": "507f4444...",
    "leadId": "507f1f77...",
    "verificationStatus": "verified",
    "accuracyScore": 85,
    "matchedFields": {
      "businessName": 2,
      "phone": 3,
      "email": 2
    },
    "flags": ["verified_legitimate", "phone_verified", "business_name_verified"],
    "details": "Lead verified across 3 platforms with 85% confidence"
  }
}
```

---

## 📊 Accuracy Scoring Algorithm

```
Base Score Calculation:
========================

Phone Match (across platforms):
  - Found in 1 platform:  +20pts
  - Found in 2+ platforms: +40pts
  - Perfect match:        +Bonus 10pts

Business Name:
  - Exact match in 1 platform:  +15pts
  - Fuzzy match in 1 platform:  +10pts
  - Match in 2+ platforms:      +30pts

Email:
  - Exact match in 1 platform:  +15pts
  - Match in 2+ platforms:      +30pts

Owner Name:
  - Matched across platforms:   +10pts

Platform Bonus:
  - Data from 3+ platforms:     +10pts
  - Data from 5+ platforms:     +20pts

Final Score = Min(100, Sum of all points)

Confidence Levels:
==================
90-100%: VERIFIED (High confidence) ✓✓✓
70-89%:  VERIFIED (Medium confidence) ✓✓
50-69%:  REQUIRES REVIEW (Manual approval needed)
0-49%:   SUSPICIOUS (Likely invalid)
```

---

## 🔐 Security Considerations

1. **Organization Isolation** - Each organization only sees their own data
2. **Role-Based Access** - admin, editor, viewer roles
3. **Audit Trail** - Track who approved/rejected leads
4. **Data Validation** - All inputs sanitized before verification
5. **Rate Limiting** - Configurable per platform

---

## 🎯 Best Practices

### Setting Up Rules

1. **Phone Verification (Critical)**
   - Require match across at least 2 platforms
   - Weight: 3/10 (highest)
   - Accuracy impact: ~40%

2. **Business Name Verification**
   - Enable fuzzy matching (allow typos)
   - Require match across 2 platforms
   - Weight: 2/10
   - Accuracy impact: ~30%

3. **Email Verification (Nice-to-have)**
   - Optional (not all leads have emails)
   - Weight: 1/10
   - Accuracy impact: ~15%

### Configuring Organizations

```javascript
// Conservative (High accuracy, fewer approvals)
settings: {
  minAccuracyScoreForApproval: 85,
  requireMultiplePlatformVerification: true,
  autoApproveHighConfidence: false,
  enableFuzzyMatching: false
}

// Balanced (Good accuracy, reasonable volume)
settings: {
  minAccuracyScoreForApproval: 70,
  requireMultiplePlatformVerification: true,
  autoApproveHighConfidence: false,
  enableFuzzyMatching: true
}

// Aggressive (High volume, more manual review)
settings: {
  minAccuracyScoreForApproval: 50,
  requireMultiplePlatformVerification: false,
  autoApproveHighConfidence: true,
  enableFuzzyMatching: true
}
```

---

## 📈 Scalability

The system is designed to scale:

- **Horizontal Scaling**: Add more platforms/organizations as needed
- **Database Indexing**: Indexes on frequently queried fields
- **Batch Processing**: Verify multiple leads at once
- **Caching**: Cache platform and rule configurations
- **Rate Limiting**: Prevent abuse and excessive API calls

---

## 🐛 Troubleshooting

### Issue: Low Accuracy Scores

**Cause:** Incomplete data across platforms

**Solution:**
- Add more platforms to your organization
- Lower `requiredMatches` threshold
- Enable fuzzy matching

### Issue: Too Many Suspicious Leads

**Cause:** Verification rules too strict

**Solution:**
- Review your verification rules
- Check if field names match across platforms
- Consider business variations (e.g., "Acme" vs "Acme Corp")

### Issue: All Leads Auto-Approved

**Cause:** `autoApproveHighConfidence` set incorrectly

**Solution:**
- Review accuracy scores
- Adjust `minAccuracyScoreForApproval`
- Manually review rejected leads

---

## 📚 Next Steps

1. **Add Real Platform Scrapers** - Replace mock data in `server/utils/scraper.js`
2. **Implement Custom Rules** - Add domain-specific verification logic
3. **Set Up Organizations** - Create your first org and configure it
4. **Bulk Verify Leads** - Use batch verification for existing leads
5. **Monitor Statistics** - Track verification success rates

---

## 💡 Tips & Tricks

- Use fuzzy matching for business names to handle variations
- Require phone match across at least 2 platforms for reliability
- Set up different verification rules for different lead types
- Regularly audit rejected leads to find patterns
- Use the admin dashboard to monitor data quality trends

---

**Happy verifying!** 🎉
