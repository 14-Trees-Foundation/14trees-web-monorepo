# Plan: Visitor ID-based Event View Tracking with UUID

## Overview
Replace IP+UserAgent fingerprinting with UUID-based visitor IDs stored in localStorage for more reliable unique visitor tracking across sessions.

## User Decisions
- ✅ Use standard UUID v4 format (RFC4122 compliant)
- ✅ Send visitor_id as custom header `x-visitor-id`
- ✅ Keep IP address and User-Agent metadata for analytics/debugging

## Current Implementation
**Backend:**
- `eventsController.ts:914-955` - Creates fingerprint from `hash(IP + UserAgent)`
- `eventsRepo.ts:254-288` - Tracks views using device_fingerprint
- `eventViews.ts` - Model with device_fingerprint, ip_address, user_agent
- `event_views` table - Unique constraint on (event_id, device_fingerprint)

**Frontend:**
- `EventPage.tsx:78-82` - Calls trackEventView on page load
- `eventsApiClient.ts:453-460` - Makes POST request to track endpoint
- No visitor tracking infrastructure currently exists

## Implementation Plan

### 1. Frontend Changes

#### 1.1 Create Visitor Tracking Utility
**File:** `apps/frontend/src/helpers/visitorTracking.ts` (NEW)
```typescript
export const getOrCreateVisitorId = (): string => {
  const key = 'visitor_id';
  const existingId = localStorage.getItem(key);

  if (existingId) {
    return existingId;
  }

  // Generate UUID v4
  const newId = crypto.randomUUID();
  localStorage.setItem(key, newId);
  return newId;
};

export const getVisitorId = (): string | null => {
  return localStorage.getItem('visitor_id');
};
```

#### 1.2 Initialize Visitor ID on App Load
**File:** `apps/frontend/src/App.jsx`
- Add `useEffect` hook to initialize visitor_id early in component lifecycle
- Call `getOrCreateVisitorId()` when app mounts
```typescript
useEffect(() => {
  getOrCreateVisitorId(); // Initialize once on app load
}, []);
```

#### 1.3 Update API Clients to Include visitor_id Header
**File:** `apps/frontend/src/api/apiClient/apiClient.ts:36-43`
- Modify constructor to add `x-visitor-id` header
```typescript
const visitorId = getVisitorId();
headers: {
  'x-visitor-id': visitorId || '',
  'x-user-id': userId ? userId : '',
  // ... existing headers
}
```

**File:** `apps/frontend/src/api/events/eventsApiClient.ts:14-21`
- Same change for EventsApiClient constructor

#### 1.4 Update Event Tracking Call
**File:** `apps/frontend/src/pages/EventDashboard/EventPage.tsx:78-82`
- No changes needed! Header will be automatically included

### 2. Backend Changes

#### 2.1 Update Event Views Database Schema
**File:** `apps/api/migrations/015_update_event_views_for_visitor_id.sql` (NEW)
```sql
-- Rename device_fingerprint to visitor_id
ALTER TABLE event_views RENAME COLUMN device_fingerprint TO visitor_id;

-- Update unique constraint
DROP INDEX IF EXISTS idx_event_views_event_device;
CREATE UNIQUE INDEX idx_event_views_event_visitor ON event_views(event_id, visitor_id);

-- Update index
DROP INDEX IF EXISTS idx_event_views_device_fingerprint;
CREATE INDEX idx_event_views_visitor_id ON event_views(visitor_id);

-- Update comments
COMMENT ON COLUMN event_views.visitor_id IS 'UUID v4 visitor identifier stored in browser localStorage';
```

#### 2.2 Update EventView Model
**File:** `apps/api/src/models/eventViews.ts:14-27`
- Rename `device_fingerprint` to `visitor_id`
```typescript
interface EventViewAttributes {
  id: number;
  event_id: number;
  visitor_id: string;  // Changed from device_fingerprint
  ip_address?: string;
  user_agent?: string;
  viewed_at: Date;
}
```

**Lines 29-34:**
```typescript
@Column({
  type: DataType.STRING(255),
  allowNull: false
})
visitor_id!: string;  // Changed from device_fingerprint
```

#### 2.3 Update Events Controller
**File:** `apps/api/src/controllers/eventsController.ts:914-955`
- Extract visitor_id from request header instead of creating hash
```typescript
export const trackEventView = async (req: Request, res: Response) => {
  try {
    const eventLink = req.params.linkId;

    // Get visitor_id from custom header
    const visitorId = req.headers['x-visitor-id'] as string;

    if (!visitorId) {
      return res.status(status.bad).send({ error: "visitor_id header required" });
    }

    // Get event by link
    const eventResp = await EventRepository.getEvents(0, 1, [
      { columnField: 'link', operatorValue: 'equals', value: eventLink }
    ]);

    if (eventResp.results.length === 0) {
      return res.status(status.notfound).send({ error: "Event not found" });
    }

    const event = eventResp.results[0];

    // Get metadata for analytics
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
                      || req.socket.remoteAddress
                      || 'unknown';

    // Track the view with visitor_id
    await EventRepository.trackEventView(event.id, visitorId, ipAddress, userAgent);

    res.status(status.success).send({
      message: "View tracked successfully",
      total_views: event.total_views || 0,
      unique_views: event.unique_views || 0
    });
  } catch (error: any) {
    console.error("[ERROR] EventsController::trackEventView", error);
    res.status(status.success).send({ message: "View tracking skipped" });
  }
};
```

#### 2.4 Update Events Repository
**File:** `apps/api/src/repo/eventsRepo.ts:254-288`
- Change parameter from `deviceFingerprint` to `visitorId`
```typescript
public static async trackEventView(
  eventId: number,
  visitorId: string,  // Changed from deviceFingerprint
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    const [viewRecord, created] = await EventView.findOrCreate({
      where: {
        event_id: eventId,
        visitor_id: visitorId  // Changed from device_fingerprint
      },
      defaults: {
        event_id: eventId,
        visitor_id: visitorId,  // Changed from device_fingerprint
        ip_address: ipAddress,
        user_agent: userAgent
      }
    });

    // Always increment total_views
    await Event.increment('total_views', { where: { id: eventId } });

    // Only increment unique_views if this is a new visitor
    if (created) {
      await Event.increment('unique_views', { where: { id: eventId } });
    }
  } catch (error) {
    console.error('[ERROR] EventRepository::trackEventView', error);
    throw error;
  }
}
```

## Files to Modify

### Frontend
1. `apps/frontend/src/helpers/visitorTracking.ts` - NEW utility file
2. `apps/frontend/src/App.jsx` - Initialize visitor_id
3. `apps/frontend/src/api/apiClient/apiClient.ts` - Add x-visitor-id header
4. `apps/frontend/src/api/events/eventsApiClient.ts` - Add x-visitor-id header

### Backend
5. `apps/api/migrations/015_update_event_views_for_visitor_id.sql` - NEW migration
6. `apps/api/src/models/eventViews.ts` - Rename column
7. `apps/api/src/controllers/eventsController.ts` - Use visitor_id from header
8. `apps/api/src/repo/eventsRepo.ts` - Update method signature

## Testing Strategy
1. Clear localStorage and verify new visitor_id is created
2. Refresh page and verify same visitor_id is reused
3. Track event view and verify unique_views increments only once
4. Multiple page views should increment total_views but not unique_views
5. Different browser/incognito should create new visitor_id and increment unique_views
6. Verify IP and User-Agent are still stored for existing functionality

## Migration Notes
- Migration will rename existing `device_fingerprint` data to `visitor_id`
- Existing fingerprint data will be preserved (won't match UUIDs but won't break)
- New visits will use UUID format
- Consider data cleanup if you want to reset analytics after migration
