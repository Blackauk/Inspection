# Sites & Locations Module - Implementation Notes

## Overview
Sites & Locations module provides a controlled hierarchy representing physical work environments. It enables consistent asset allocation, inspection context, defect reporting, access control, and reporting.

## Architecture

### Database Layer
- **IndexedDB Schema** (`db/schema.ts`): Stores for sites and locations
- **Repository** (`db/repository.ts`): CRUD operations, hierarchy validation, bulk operations
- **Read-only offline**: Sites and locations are read-only when offline (Phase 1)

### State Management
- **Context** (`context/SitesContext.tsx`): React Context + useReducer for global state
- Provides hooks: `useSites()` for accessing site/location data and operations

### UI Components
- **List Page**: Tree view and Table view (switchable), filters, search, bulk actions
- **Detail Page**: Site details with locations hierarchy
- **Form Pages**: Create/edit sites and locations

### Permissions
- **Permissions** (`lib/permissions.ts`): Role-based access control
  - Create Site: Admin only
  - Edit Site: Admin only
  - Archive Site: Admin only
  - Create Location: Admin + Manager
  - Edit Location: Admin + Manager
  - Archive Location: Admin only
  - View: Users see only assigned sites (unless Admin/Manager)

## Key Features

### Site Definition
- **Mandatory**: Name, Status
- **Optional**: Code (manually entered, unique if provided), Address, Site Manager, Notes
- **Statuses**: Active, Inactive, Closed, Archived
- **Lifecycle**: Sites are archived, not deleted
- **Archived sites**: Remain for historical records, cannot be selected for new records, can only be reactivated by Admin

### Location Hierarchy
- **Structure**: Site → Zone → Area (3 levels max)
- **Zone and Area are optional**: Areas can be directly under Site
- **Location names**: Can repeat across different sites
- **Statuses**: Active, Restricted, Closed
- **No codes**: Locations identified internally by UUID

### Tree View
- Expand/collapse hierarchy
- Shows Site → Zones → Areas structure
- Checkboxes for bulk selection
- Quick actions per item

### Table View
- Flat list with filters
- Separate tables for Sites and Locations
- Checkboxes for bulk selection
- Optimized for bulk actions

### Search & Filters
- **Sites**: By name, code, address, status
- **Locations**: By name, type, status, site, parent
- Search works across visible sites only (respects user assignments)

### Bulk Actions
- **Bulk create**: Rapid setup of multiple Zones/Areas
- **Bulk edit**: Update multiple sites/locations
- **Bulk archive**: Archive multiple items at once

### Offline Behavior
- **Read-only**: Sites and locations are read-only when offline
- **Selection**: Users can still select existing locations when creating records
- **No offline writes**: Non-admin users cannot edit sites/locations offline
- **Conflict prevention**: System prevents offline writes to avoid Phase-1 conflicts

## Summary Stats
Dashboard indicators:
- Total sites
- Active sites
- Locations with open defects
- Locations with overdue work orders

## Seed Data
- 3 sample sites (Site A, B, C)
- Multiple zones and areas demonstrating hierarchy
- Only seeds in development mode
- Skips if sites already exist

## Usage

### Accessing Sites
```typescript
import { useSites } from '../features/sites/context/SitesContext';

function MyComponent() {
  const { sites, locations, loadSites } = useSites();
  // ...
}
```

### Permissions
```typescript
import { canCreateSite, canEditLocation } from '../features/sites/lib/permissions';

const canCreate = canCreateSite(user?.role);
const canEdit = canEditLocation(user?.role);
```

### Creating a Site
1. Navigate to `/sites/new`
2. Enter site name (required)
3. Optionally enter code, address, manager, notes
4. Set status
5. Click "Create Site"

### Creating a Location
1. Navigate to `/sites/{siteId}/locations/new`
2. Enter location name (required)
3. Select type (Zone or Area)
4. If Area, optionally select parent Zone
5. Set status and order
6. Click "Create Location"

## Files Created/Modified

### New Files
- `types.ts` - Type definitions
- `db/schema.ts` - IndexedDB schema
- `db/repository.ts` - Data access layer with hierarchy validation
- `context/SitesContext.tsx` - State management
- `lib/permissions.ts` - Permission helpers
- `lib/seed.ts` - Seed data
- `pages/SitesPage.tsx` - List page with tree/table views
- `pages/SiteDetailPage.tsx` - Site detail page
- `pages/SiteFormPage.tsx` - Create/edit site form
- `pages/LocationFormPage.tsx` - Create/edit location form

### Modified Files
- `app/providers/AppProviders.tsx` - Added SitesProvider
- `app/routes/index.tsx` - Added site and location routes

## Phase-1 Exclusions
The following features are explicitly NOT implemented:
- GPS / geolocation
- Maps or visual layouts
- QR codes for sites or locations
- Geofencing or automated access control

## Future Enhancements (Phase 2)
- Backend API integration
- Location history tracking
- Maps integration
- QR code support
- Geolocation features
- Advanced reporting

## Testing
1. Navigate to `/sites` - should show seeded sites
2. Switch between Tree and Table views
3. Create new site - Admin only
4. Create new location - Admin/Manager only
5. Edit site/location - permissions enforced
6. Archive site - Admin only
7. Test hierarchy - Area under Zone, Area directly under Site
8. Test filters and search
9. Test bulk selection
10. Verify user site assignments filter correctly
