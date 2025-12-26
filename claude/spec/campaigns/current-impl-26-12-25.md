# Campaign Feature - Current Implementation (26 Dec 2025)

## Overview

The Campaign feature enables 14Trees to create and track fundraising campaigns with referral tracking, progress monitoring, and champion leaderboards. Campaigns aggregate donations and gift card requests to measure environmental impact and recognize top contributors.

## Database Schema

### Table: `campaigns`

**Location:** Defined via Sequelize ORM model (no dedicated migration file found)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO INCREMENT, UNIQUE | Campaign unique identifier |
| `name` | STRING | NOT NULL | Campaign display name |
| `c_key` | STRING | NOT NULL, UNIQUE | Campaign URL-safe key/slug |
| `description` | STRING | NULLABLE | Campaign description/purpose text |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | Record last update timestamp |

**Related Tables:**
- `referrals` - Links to campaign via `c_key` foreign key
- `donations` - Links indirectly via `referrals.rfr_id`
- `gift_card_requests` - Links indirectly via `referrals.rfr_id`
- `users` - Links to referral users for champion tracking

**Model File:** [apps/api/src/models/campaign.ts](apps/api/src/models/campaign.ts)

### Table: `referrals`

**Location:** Defined via Sequelize ORM model (no dedicated migration file found)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO INCREMENT, UNIQUE | Referral unique identifier |
| `rfr` | STRING | NULLABLE | Referral code (user's unique referral identifier) |
| `c_key` | STRING | NULLABLE, UNIQUE | Campaign key (foreign key to campaigns table) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW | Record last update timestamp |

**Key Relationships:**
- `rfr` links to `users.rfr` - Identifies the referring user
- `c_key` links to `campaigns.c_key` - Associates referral with a campaign (optional)
- `id` is referenced by `donations.rfr_id` - Links donations to referrals
- `id` is referenced by `gift_card_requests.rfr_id` - Links gift cards to referrals

**Business Rules:**
- Personal referrals have `c_key = NULL`
- Campaign referrals have `c_key` pointing to a valid campaign
- A user can have multiple referral records (one per campaign + one personal)
- The combination of (`rfr`, `c_key`) should be unique (enforced in application logic)

**Model File:** [apps/api/src/models/referral.ts](apps/api/src/models/referral.ts)

## Backend Implementation

### API Routes

**Base Path:** `/api/campaigns`

**Route File:** [apps/api/src/routes/campaignRoutes.ts](apps/api/src/routes/campaignRoutes.ts)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | `/` | `createCampaign` | Create new campaign |
| POST | `/list/get` | `listCampaigns` | Get paginated campaigns with filters |
| PUT | `/update/:id` | `updateCampaign` | Update campaign by ID |
| GET | `/:c_key/analytics` | `getCampaignAnalytics` | Get campaign summary and champions |
| GET | `/referralcount` | `getReferralCounts` | Get global referral statistics |
| GET | `/referral/:rfr` | `getReferralDashboard` | Get individual referrer dashboard |

**Base Path:** `/api/referrals`

**Route File:** [apps/api/src/routes/referralRoutes.ts](apps/api/src/routes/referralRoutes.ts)

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| POST | `/` | `createReferral` | Create referral link for user (personal or campaign) |
| POST | `/details` | `getReferralDetails` | Get referral and campaign details by rfr/c_key |
| POST | `/referralname` | `getUserNameByReferral` | Get user name by referral code |

### Controller Layer

**File:** [apps/api/src/controllers/campaignController.ts](apps/api/src/controllers/campaignController.ts)

#### `createCampaign(req, res)`
- **Validates:** `name` and `c_key` are required
- **Checks:** `c_key` uniqueness before creation
- **Returns:** 201 with created campaign object
- **Error:** 400 if key exists or validation fails

#### `listCampaigns(req, res)`
- **Accepts:** Pagination (offset/limit), filters, orderBy
- **Returns:** Paginated response with total count and results
- **Default Sort:** `id DESC`

#### `updateCampaign(req, res)`
- **Accepts:** Campaign ID in params, updateFields mask, data object
- **Updates:** Only fields specified in updateFields array
- **Returns:** Updated campaign object
- **Error:** 400 for invalid ID, 404 if not found

#### `getCampaignAnalytics(req, res)`
- **Fetches:**
  - Campaign details by `c_key`
  - Campaign summary (donations, gifts, amount, trees)
  - Campaign champions (top contributors ranked by amount raised)
- **Returns:** Combined response with campaign, summary, and champion data
- **Error:** 404 if campaign not found

#### `getReferralCounts(req, res)`
- **Returns:**
  - `personalReferrals`: Count where `c_key IS NULL`
  - `campaignReferrals`: Count where `c_key IS NOT NULL`
  - `totalReferrals`: Total count

#### `getReferralDashboard(req, res)`
- **Accepts:** Referral code (rfr) in URL params
- **Returns:**
  - `totalRaised`: Sum of donations + gift card amounts
  - `totalTrees`: Sum of trees from donations + gifts
  - `donations`: Array of donation records with donor details
  - `gifts`: Array of gift card records with gifter details
- **Error:** 400 for invalid referral code format

### Repository Layer

**File:** [apps/api/src/repo/campaignsRepo.ts](apps/api/src/repo/campaignsRepo.ts)

#### `getCampaigns(offset, limit, filters?, orderBy?)`
- **Builds:** Dynamic SQL query with WHERE conditions from filters
- **Supports:**
  - Filter operators (equals, contains, etc.)
  - Multiple sort orders
  - Unlimited results when `limit = -1`
- **Returns:** `PaginatedResponse<Campaign>` with offset, total, results

#### `createCampaign(name, c_key, description?)`
- **Creates:** New campaign record via Sequelize
- **Returns:** Created Campaign instance

#### `updateCampaign(campaignId, updateData)`
- **Updates:** Campaign by ID with partial data
- **Returns:** Updated Campaign instance
- **Error:** Throws if campaign not found or no changes made

#### `getCampaignSummary(c_key)`
- **Complex Query:** Joins referrals, donations, and gift_card_requests
- **Calculates:**
  - Gift card amounts: Public (2000/card), Foundation (3000/card)
  - Total donation count
  - Total gift request count
  - Total amount raised (donations + gifts)
  - Total trees count
- **Returns:** `CampaignSummaryResult` object

#### `getCampaignChampion(c_key)`
- **Complex Query:** Aggregates donations and gifts per referral user
- **Ranks:** Users by total amount raised (DESC)
- **Returns:** Array of top contributors with:
  - User name and email
  - Amount raised
  - Trees sponsored
  - Gift trees count
- **Note:** Returns `null` if no champions found

#### `getReferralCounts()`
- **Query:** Counts referrals using SQL FILTER WHERE clause
- **Returns:** Global counts for personal, campaign, and total referrals

#### `getReferralDashboard(rfr)`
- **Complex Query:** Joins donations and gifts for specific referral code
- **Aggregates:**
  - Total raised from both sources
  - Total trees from both sources
  - Detailed donation records
  - Detailed gift card records
- **Returns:** `ReferralDashboardResult` with totals and itemized lists

**File:** [apps/api/src/controllers/referralController.ts](apps/api/src/controllers/referralController.ts)

#### `createReferral(req, res)`
- **Accepts:** `email` (required), `c_key` (optional)
- **Process:**
  1. Validates user exists by email
  2. Generates referral code if user doesn't have one: `{firstName}-{3-char-random}`
  3. Updates user record with referral code
  4. Validates campaign exists if `c_key` provided
  5. Checks if referral already exists for (rfr, c_key) combination
  6. Creates new referral record if not exists
  7. Sends email with referral links to user
- **Email:** Sends referral dashboard email with donation and plant-memory links
  - Template: `referrer_email.html`
  - Links include `?r={rfr}&c={c_key}` query parameters
- **Returns:** 201 with `{ rfr, c_key }`
- **Error:** 400 if email missing, 404 if user not found

#### `getReferralDetails(req, res)`
- **Accepts:** `rfr` and/or `c_key` in request body
- **Fetches:**
  - User name by referral code (if rfr provided)
  - Campaign name, c_key, and description (if c_key provided)
- **Returns:** Combined object with:
  - `rfr`: Referral code
  - `c_key`: Campaign key
  - `referred_by`: User name who owns the referral code
  - `name`: Campaign name
  - `description`: Campaign description
- **Error:** 400 if neither rfr nor c_key provided

#### `getUserNameByReferral(req, res)`
- **Accepts:** `rfr` in request body
- **Returns:** `{ name }` - User name associated with referral code
- **Error:** 400 if rfr missing, 404 if user not found

### Repository Layer (Referrals)

**File:** [apps/api/src/repo/referralsRepo.ts](apps/api/src/repo/referralsRepo.ts)

#### `getReferrals(whereClause)`
- **Accepts:** Sequelize WHERE clause object
- **Returns:** Array of Referral instances matching the criteria
- **Usage:** Flexible query method for finding referrals by any field combination

#### `createReferece(rfr, c_key)` _(Note: typo in method name)_
- **Creates:** New referral record with given rfr and c_key
- **Returns:** Created Referral instance
- **Note:** Both parameters can be null

## Frontend Implementation

### Type Definitions

**File:** [apps/frontend/src/types/campaign.ts](apps/frontend/src/types/campaign.ts)

```typescript
type Campaign = {
    key: number;
    id: number;
    c_key: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

type CampaignsDataState = {
    loading: boolean;
    totalCampaigns: number;
    campaigns: Record<number, Campaign>;
    paginationMapping: Record<number, number>;
}

type CampaignFormValues = {
    name: string;
    c_key: string;
    description?: string | null;
}
```

### Redux State Management

#### Action Types
**File:** [apps/frontend/src/redux/actionTypes/campaignActionTypes.ts](apps/frontend/src/redux/actionTypes/campaignActionTypes.ts)

Constants for: GET, CREATE, UPDATE, DELETE operations

#### Actions
**File:** [apps/frontend/src/redux/actions/campaignActions.ts](apps/frontend/src/redux/actions/campaignActions.ts)

- `getCampaigns(offset, limit, filters?, orderBy?)` - Fetch paginated campaigns
- `createCampaign(name, c_key, description?)` - Create new campaign
- `updateCampaign(campaignId, updateFields, data)` - Update existing campaign
- _deleteCampaign_ - Commented out

#### Reducer
**File:** [apps/frontend/src/redux/reducers/campaignReducer.ts](apps/frontend/src/redux/reducers/campaignReducer.ts)

Manages `CampaignsDataState` with pagination mapping and campaign cache

### API Client

**File:** [apps/frontend/src/api/apiClient/apiClient.ts](apps/frontend/src/api/apiClient/apiClient.ts)

API client methods:
- `createCampaign(name, c_key, description?)` - POST /campaigns
- `updateCampaign(id, updateFields, data)` - PUT /campaigns/update/{id}
- `getCampaigns(offset, limit, filters?, orderBy?)` - POST /campaigns/list/get
- `getCampaignAnalytics(c_key)` - GET /campaigns/{c_key}/analytics
- `getReferralCounts()` - GET /campaigns/referralcount
- `getReferralDashboard(rfr_code)` - GET /campaigns/referral/{rfr_code}
- `getUserNameByReferral(rfr_code)` - POST /referrals/referralname

### Admin Pages

#### Campaign Management Dashboard
**File:** [apps/frontend/src/pages/admin/campaign/Campaign.tsx](apps/frontend/src/pages/admin/campaign/Campaign.tsx)

**Route:** `/campaigns`

**Features:**
- List all campaigns with pagination
- Search/filter by name, c_key, created_by, created_at
- Sort by any column
- Create new campaigns (opens Add Campaign modal)
- Edit existing campaigns (opens Edit Campaign modal)
- View campaign description in modal
- Open public campaign page in new tab
- Download campaigns to CSV

**State:**
- `loading`, `page`, `pageSize`, `filters`, `orderBy`
- `tableRows`, `totalRecords`
- Modal states for add/edit/description

**Table Columns:**
1. Campaign Name (searchable)
2. Campaign Progress Tracker (link to public page)
3. Display Text (description with badge indicator)
4. Created By (searchable)
5. Created At (date filter)
6. Campaign Key (searchable)
7. Actions (edit button)

#### Add Campaign Modal
**File:** [apps/frontend/src/pages/admin/campaign/AddCampaign.tsx](apps/frontend/src/pages/admin/campaign/AddCampaign.tsx)

Form fields:
- Campaign Key (required)
- Campaign Name (required)
- Description (optional)

#### Edit Campaign Modal
**File:** [apps/frontend/src/pages/admin/campaign/EditCampaign.tsx](apps/frontend/src/pages/admin/campaign/EditCampaign.tsx)

Edits all campaign fields (name, c_key, description)

### Public-Facing Pages

#### Campaign Progress Tracker Page
**File:** [apps/frontend/src/pages/admin/campaign/CampaignsPage.tsx](apps/frontend/src/pages/admin/campaign/CampaignsPage.tsx)

**Route:** `/campaign/:c_key`

**Purpose:** Public-facing campaign dashboard showing progress and impact

**Features:**
- Campaign name in header with 14Trees logo
- Campaign description text display
- Action buttons: "Donate" and "Plant a Memory"
  - Links to donation/gift forms with campaign key parameter
  - Opens in new tab: `https://www.14trees.org/{form-type}?c={c_key}`
- Responsive mobile menu for actions
- Campaign metrics cards (via CampaignCards component)
- Champions leaderboard

**Error Handling:**
- 404 page if campaign not found
- Custom error message: "This campaign seems to have wandered off the trail!"

**Component:** [apps/frontend/src/pages/admin/campaign/component/summary.tsx](apps/frontend/src/pages/admin/campaign/component/summary.tsx)

`CampaignCards` displays:
- Donation Count
- Gift Count
- Amount Raised (₹)
- Trees Count
- Champions table with top contributors

#### Referrals Analytics Page
**File:** [apps/frontend/src/pages/admin/campaign/ReferralsPage.tsx](apps/frontend/src/pages/admin/campaign/ReferralsPage.tsx)

**Route:** `/referrals`

**Purpose:** Global referral statistics dashboard

**Component:** [apps/frontend/src/pages/admin/campaign/component/referralCards.tsx](apps/frontend/src/pages/admin/campaign/component/referralCards.tsx)

`ReferralCards` displays:
- Personal Referrals count
- Campaign Referrals count
- Total Referrals count

#### Individual Referrer Dashboard
**File:** [apps/frontend/src/pages/admin/campaign/ReferralUserPage.tsx](apps/frontend/src/pages/admin/campaign/ReferralUserPage.tsx)

**Route:** `/referral/:rfr`

**Purpose:** Individual referrer's contribution tracking

**Component:** [apps/frontend/src/pages/admin/campaign/component/referraluser.tsx](apps/frontend/src/pages/admin/campaign/component/referraluser.tsx)

`ReferralUserCards` displays:
- Total Raised amount
- Total Trees count
- Donations table: donor name, email, method, trees, amount
- Gifts table: gifted by name, email, trees, amount

## Key Business Logic

### Gift Card Amount Calculation
Gift cards contribute to campaign totals based on category:
- **Public**: ₹2000 per card
- **Foundation**: ₹3000 per card
- Multiply by `no_of_cards` field

### Campaign Champion Ranking
Champions are ranked by total amount raised (donations + gifts) in descending order. Includes:
- User name and email from users table
- Total amount raised
- Total trees sponsored
- Gift card count

### Referral Tracking
Campaigns track two types of referrals:
- **Personal Referrals**: `c_key IS NULL` in referrals table
- **Campaign Referrals**: `c_key IS NOT NULL` in referrals table

All donations and gift cards linked to referrals with a `c_key` contribute to that campaign's metrics.

### Referral Code Generation
When a user creates a referral for the first time:
- Format: `{firstName}-{3-random-chars}`
- Example: `john-a7x`, `sarah-k2p`
- Stored in `users.rfr` field
- Reused for all subsequent referral links (personal + campaign)

### Referral Link Flow
1. User requests referral link via API (provides email, optionally c_key)
2. System generates or retrieves user's referral code
3. Creates referral record in database (rfr + c_key combination)
4. Sends email with personalized referral links:
   - Donation link: `{baseUrl}/donate?r={rfr}&c={c_key}`
   - Gift link: `{baseUrl}/plant-memory?r={rfr}&c={c_key}`
5. When someone uses the link, donation/gift is tracked to that referral record
6. Metrics aggregate via the referral's `id` foreign key

## Integration Points

### External Systems
1. **Donation Forms** - External forms at `https://www.14trees.org/donate`
   - Accepts query parameters: `?r={rfr}&c={c_key}`
   - `r` = referral code, `c` = campaign key
   - Links referrals to campaign and tracks attribution

2. **Plant-a-Memory Forms** - External forms at `https://www.14trees.org/plant-memory`
   - Accepts query parameters: `?r={rfr}&c={c_key}`
   - Creates gift card requests linked to referral and campaign

3. **Email System (SendGrid)**
   - Sends referral links to users via `sendDashboardMail()` service
   - Template: `referrer_email.html`
   - Triggered on referral creation

### Internal Systems
1. **Referrals System** - Core dependency for tracking campaign attributions
   - Links users to campaigns
   - Enables personal vs campaign referral tracking
   - Connects donations and gifts to campaigns
2. **Donations Module** - Aggregated for campaign metrics via `rfr_id`
3. **Gift Cards Module** - Aggregated for campaign metrics via `rfr_id`
4. **Users Module** - Provides:
   - Referral code storage (`users.rfr`)
   - Champion user details (name, email)
   - User validation for referral creation

## File Inventory

### Backend Files

**Routes:**
- [apps/api/src/routes/campaignRoutes.ts](apps/api/src/routes/campaignRoutes.ts) - 6 campaign endpoints
- [apps/api/src/routes/referralRoutes.ts](apps/api/src/routes/referralRoutes.ts) - 3 referral endpoints

**Controllers:**
- [apps/api/src/controllers/campaignController.ts](apps/api/src/controllers/campaignController.ts) - Campaign CRUD and analytics
- [apps/api/src/controllers/referralController.ts](apps/api/src/controllers/referralController.ts) - Referral creation and lookup

**Models:**
- [apps/api/src/models/campaign.ts](apps/api/src/models/campaign.ts) - Campaign schema
- [apps/api/src/models/referral.ts](apps/api/src/models/referral.ts) - Referral schema

**Repository:**
- [apps/api/src/repo/campaignsRepo.ts](apps/api/src/repo/campaignsRepo.ts) - Campaign data access with complex analytics queries
- [apps/api/src/repo/referralsRepo.ts](apps/api/src/repo/referralsRepo.ts) - Referral data access

### Frontend Files

**Types:**
- [apps/frontend/src/types/campaign.ts](apps/frontend/src/types/campaign.ts)

**Redux:**
- [apps/frontend/src/redux/actionTypes/campaignActionTypes.ts](apps/frontend/src/redux/actionTypes/campaignActionTypes.ts)
- [apps/frontend/src/redux/actions/campaignActions.ts](apps/frontend/src/redux/actions/campaignActions.ts)
- [apps/frontend/src/redux/reducers/campaignReducer.ts](apps/frontend/src/redux/reducers/campaignReducer.ts)

**API Client:**
- [apps/frontend/src/api/apiClient/apiClient.ts](apps/frontend/src/api/apiClient/apiClient.ts) (campaign methods)

**Admin Pages:**
- [apps/frontend/src/pages/admin/campaign/Campaign.tsx](apps/frontend/src/pages/admin/campaign/Campaign.tsx) - Main admin dashboard
- [apps/frontend/src/pages/admin/campaign/AddCampaign.tsx](apps/frontend/src/pages/admin/campaign/AddCampaign.tsx) - Create campaign modal
- [apps/frontend/src/pages/admin/campaign/EditCampaign.tsx](apps/frontend/src/pages/admin/campaign/EditCampaign.tsx) - Edit campaign modal

**Public Pages:**
- [apps/frontend/src/pages/admin/campaign/CampaignsPage.tsx](apps/frontend/src/pages/admin/campaign/CampaignsPage.tsx) - Public campaign tracker
- [apps/frontend/src/pages/admin/campaign/ReferralsPage.tsx](apps/frontend/src/pages/admin/campaign/ReferralsPage.tsx) - Global referral stats
- [apps/frontend/src/pages/admin/campaign/ReferralUserPage.tsx](apps/frontend/src/pages/admin/campaign/ReferralUserPage.tsx) - Individual referrer dashboard

**UI Components:**
- [apps/frontend/src/pages/admin/campaign/component/summary.tsx](apps/frontend/src/pages/admin/campaign/component/summary.tsx) - Campaign cards
- [apps/frontend/src/pages/admin/campaign/component/referralCards.tsx](apps/frontend/src/pages/admin/campaign/component/referralCards.tsx) - Referral cards
- [apps/frontend/src/pages/admin/campaign/component/referraluser.tsx](apps/frontend/src/pages/admin/campaign/component/referraluser.tsx) - Referrer cards

## Notable Implementation Details

1. **No Migrations:** Both campaign and referral tables are created via Sequelize model sync, not explicit migrations
2. **Soft Delete:** No soft delete functionality - campaigns and referrals are permanent
3. **Update Mask Pattern:** Update API uses field mask (`updateFields` array) to specify which fields to update
4. **Complex Aggregations:** Campaign analytics use CTEs and complex joins for performance
5. **Dual Referral Types:** System distinguishes between personal and campaign-based referrals via `c_key` field
6. **External Form Integration:** Campaign and referral links propagate to external donation/gift forms via query parameters (`r` and `c`)
7. **Champion Calculation:** Combines both donation and gift card amounts for ranking
8. **Public Page 404:** Custom not-found handling for invalid campaign keys
9. **Referral Code Uniqueness:** User's referral code (`users.rfr`) is generated once and reused across all referral records
10. **Email Automation:** Referral creation automatically triggers email with personalized referral links
11. **Typo in Code:** Repository method `createReferece` should be `createReference` (typo exists in production)
12. **Duplicate Prevention:** System checks for existing (rfr, c_key) combination before creating new referral
13. **User-Referral Linkage:** User referral code stored in `users.rfr`, not in referrals table - referrals table only stores references

## Data Flow Diagram

```
User Registration
    ↓
User record created (users table)
    ↓
User requests referral link (via API or admin panel)
    ↓
Referral code generated/retrieved (users.rfr)
    ↓
Referral record created (referrals table: rfr + c_key)
    ↓
Email sent with referral links
    ↓
External user clicks link → Donates/Gifts
    ↓
Donation/Gift record created (rfr_id points to referrals.id)
    ↓
Campaign analytics aggregate via referrals.id
    ↓
Dashboard shows metrics and champions
```
