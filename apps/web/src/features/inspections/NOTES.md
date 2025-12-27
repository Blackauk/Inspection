# Inspections Module - Implementation Notes

## Overview
Comprehensive offline-first Inspections module for CoreCheck, supporting structured checklists, automatic defect creation, and full audit trails.

## Architecture

### Database Layer
- **IndexedDB Schema** (`db/schema.ts`): Stores for inspections, templates, counters, settings, sync queue
- **Repository** (`db/repository.ts`): CRUD operations, validation, defect auto-creation, result calculation
- **Sync Queue** (`db/syncQueue.ts`): Handles offline operations queuing (stubbed for Phase 1)

### State Management
- **Context** (`context/InspectionsContext.tsx`): React Context + useReducer for global state
- Provides hooks: `useInspections()` for accessing inspection data and operations

### UI Components
- **List Page**: Summary tiles (6), filters, search, table with overdue highlighting
- **Detail Page**: Tabs for Overview, Checklist (interactive), Activity Log
- **Form Page**: Start new inspection by selecting template and asset/location

### Permissions
- **Permissions** (`lib/permissions.ts`): Role-based access control
  - Create/Perform: Fitter, Supervisor, Manager, Admin
  - Edit After Submission: Supervisor, Manager, Admin only
  - Approve: Supervisor, Manager, Admin
  - Close: Supervisor, Manager, Admin

## Key Features

### Inspection Types
- Plant Acceptance Checks
- Daily Inspections
- Weekly Inspections
- Monthly Inspections
- Pre-use Inspections
- Time-based Inspections

### Template System
- **Hierarchy**: Asset Type + Inspection Type + optional Site-specific
- **Versioning**: Templates support versioning (v1, v2, etc.)
- **Sections**: Checklist items can be grouped into sections
- **Item Types**: Pass/Fail, Pass/Fail/N/A, Number, Text
- **Critical Items**: Mark items as critical (failure fails entire inspection)
- **Photo on Fail**: Items can require photos when failed
- **Severity Defaults**: Items can specify default severity for defect creation

### Auto-ID Generation
- Sequential codes: INSP-000001, INSP-000002, etc.
- Stored in IndexedDB counter table
- Collision-safe for offline use

### Workflow & Statuses
- **Draft** → **InProgress** → **Submitted** → **Approved** → **Closed**
- Can be reopened (creates revision)
- Full audit trail for all status changes

### Defect Auto-Creation
- **Trigger**: When inspection is submitted with failed items
- **Auto-fills**: Asset, Location, Inspection reference, Severity (from item), Compliance tags
- **Validation**: Cannot submit if failed items don't generate defects (if setting enabled)
- **Multiple Defects**: One defect per failed item

### Checklist Features
- **Pass/Fail/N/A**: Three-state answers
- **Numeric Input**: With units, min/max validation
- **Text Comments**: Free-form text
- **Photo Capture**: Required on fail (if item marked)
- **Comments**: Mandatory on fail (if setting enabled)
- **Critical Items**: Failure of critical item fails entire inspection

### Evidence & Signatures
- **Attachments**: Photos, Videos, Documents (inspection-level)
- **Signatures**: Inspector and Supervisor sign-off (configurable methods)
- **Before/After**: Configurable requirement for photos

### Offline Support
- All CRUD operations work offline
- Changes queued in sync queue
- UI shows offline badge and pending sync count
- Sync function stubbed (returns success) for Phase 1

### Validation Rules
- Must link to at least one Asset or Location
- All required items must be answered before submission
- Comments required on failed items (if setting enabled)
- Photos required on failed items marked as photo-required (if setting enabled)
- Defects must be created for failed items (if setting enabled)

## Settings
Default settings (configurable):
- `requireCommentOnFail`: true
- `requirePhotoOnFail`: true
- `requireDefectOnFail`: true
- `enableApprovals`: true
- `enableSignatures`: true
- `checklistItemSeverityDefaults`: true
- `conflictResolution`: 'last-write-wins'

## Seed Data
- 3 sample templates covering different inspection types
- Templates include sections and various item types
- Only seeds in development mode
- Skips if templates already exist

## Usage

### Accessing Inspections
```typescript
import { useInspections } from '../features/inspections/context/InspectionsContext';

function MyComponent() {
  const { inspections, loadInspections, createNewInspection } = useInspections();
  // ...
}
```

### Permissions
```typescript
import { canCreateInspection, canEditInspection } from '../features/inspections/lib/permissions';

const canCreate = canCreateInspection(user?.role);
const canEdit = canEditInspection(user?.role, inspection);
```

### Starting an Inspection
1. Navigate to `/inspections/new`
2. Select a template
3. Select asset or location (at least one required)
4. Set inspection date and optional due date
5. Click "Start Inspection"
6. Complete checklist items
7. Save answers (moves to InProgress)
8. Submit inspection (creates defects for failures)
9. Supervisor approves (if enabled)

## Files Created/Modified

### New Files
- `types.ts` - Comprehensive type definitions
- `db/schema.ts` - IndexedDB schema
- `db/repository.ts` - Data access layer with defect auto-creation
- `db/syncQueue.ts` - Sync queue management
- `context/InspectionsContext.tsx` - State management
- `lib/permissions.ts` - Permission helpers
- `lib/seed.ts` - Template seed data
- `pages/InspectionsListPage.tsx` - List page (rewritten)
- `pages/InspectionDetailPage.tsx` - Detail page (rewritten)
- `pages/InspectionFormPage.tsx` - Start inspection form

### Modified Files
- `app/providers/AppProviders.tsx` - Added InspectionsProvider
- `app/routes/index.tsx` - Added `/inspections/new` route

## Integration with Defects Module
- Inspections automatically create defects when submitted with failures
- Defects are linked back to inspections
- Defect severity and compliance tags come from checklist items
- Defect auto-creation respects inspection settings

## Future Enhancements (Phase 2)
- Backend API integration
- Real sync queue processing
- Advanced recurrence rules
- Work Order auto-generation
- Notifications and escalation
- Attachment upload/storage
- Calendar/schedule view
- Advanced reporting and analytics

## Testing
1. Navigate to `/inspections` - should show empty or seeded inspections
2. Create new inspection - select template, asset, start
3. Complete checklist - answer items, add comments
4. Submit inspection - should validate and create defects for failures
5. Approve inspection - supervisor can approve
6. Check linked defects - defects should be created and linked
7. Check sync queue - should show pending items when offline
