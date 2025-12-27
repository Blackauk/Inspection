# Defects Module - Implementation Notes

## Overview
This is a comprehensive offline-first Defects module for CoreCheck, built with IndexedDB for local persistence and sync queue for future backend integration.

## Architecture

### Database Layer
- **IndexedDB Schema** (`db/schema.ts`): Defines stores for defects, counters, settings, and sync queue
- **Repository** (`db/repository.ts`): CRUD operations, queries, and business logic
- **Sync Queue** (`db/syncQueue.ts`): Handles offline operations queuing (stubbed for Phase 1)

### State Management
- **Context** (`context/DefectsContext.tsx`): React Context + useReducer for global state
- Provides hooks: `useDefects()` for accessing defect data and operations

### UI Components
- **List Page**: Summary cards, filters, search, table with RAG highlighting
- **Detail Page**: Tabs for Overview, Actions, Comments, Activity Log
- **Form Page**: Create/edit defects with validation

### Permissions
- **Permissions** (`lib/permissions.ts`): Role-based access control
  - Raise: All except Viewer
  - Edit: Supervisor, Manager, Admin
  - Close: All except Viewer
  - Reopen: All except Viewer

## Key Features

### Auto-ID Generation
- Sequential codes: DEF-000001, DEF-000002, etc.
- Stored in IndexedDB counter table
- Collision-safe for offline use

### Severity Models
- **LMH**: Low, Medium, High
- **MMC**: Minor, Major, Critical
- Configurable via settings
- Unsafe flag auto-calculated based on thresholds

### Workflow
- Status flow: Open → Acknowledged → InProgress → Closed
- Can be Deferred
- Reopen increments `reopenedCount`

### Validation
- High severity defects require at least one completed required action before closure
- Before/after photos enforced if `beforeAfterRequired` setting is true

### Offline Support
- All CRUD operations work offline
- Changes queued in sync queue
- UI shows offline badge and pending sync count
- Sync function stubbed (returns success) for Phase 1

## Seed Data
- 10 sample defects covering various statuses, severities, and scenarios
- Only seeds in development mode
- Skips if defects already exist

## Settings
Default settings (configurable):
- `severityModelDefault`: 'LMH'
- `unsafeThresholds`: 
  - LMH: ['High']
  - MMC: ['Critical']
- `beforeAfterRequired`: false

## Future Enhancements (Phase 2)
- Backend API integration
- Real sync queue processing
- Auto-generate work orders from defects
- Notifications and escalation
- Attachment upload/storage
- Advanced filtering and reporting

## Usage

### Accessing Defects
```typescript
import { useDefects } from '../features/defects/context/DefectsContext';

function MyComponent() {
  const { defects, loadDefects, createNewDefect } = useDefects();
  // ...
}
```

### Permissions
```typescript
import { canRaiseDefect, canEditDefect } from '../features/defects/lib/permissions';

const canCreate = canRaiseDefect(user?.role);
const canEdit = canEditDefect(user?.role);
```

## Files Created/Modified

### New Files
- `types.ts` - Comprehensive type definitions
- `db/schema.ts` - IndexedDB schema
- `db/repository.ts` - Data access layer
- `db/syncQueue.ts` - Sync queue management
- `context/DefectsContext.tsx` - State management
- `lib/permissions.ts` - Permission helpers
- `lib/seed.ts` - Seed data
- `components/SeverityBadge.tsx` - UI component
- `components/StatusBadge.tsx` - UI component
- `pages/DefectsListPage.tsx` - List page (rewritten)
- `pages/DefectDetailPage.tsx` - Detail page (rewritten)
- `pages/DefectFormPage.tsx` - Create/edit form

### Modified Files
- `app/providers/AppProviders.tsx` - Added DefectsProvider
- `app/routes/index.tsx` - Added defect routes
- `packages/shared/src/types.ts` - Extended QueueItemType

## Testing
1. Navigate to `/defects` - should show seeded defects
2. Create new defect - should work offline
3. Edit defect - should update locally
4. Close defect - should validate and update
5. Reopen defect - should increment count
6. Check sync queue - should show pending items when offline
