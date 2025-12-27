# Sidebar Navigation Redesign Proposal
## PPM System - Phase 1 Focus

---

## 1. PROPOSED STRUCTURE

### **WORK** (Daily Operations)
*Primary focus for Fitters and Supervisors - Task-oriented workflow*

- **Dashboard** (`/dashboard`)
  - Overview of KPIs, due inspections, open defects
  - Quick access to "My Tasks"
  
- **My Inspections** (`/inspections/my`)
  - Active inspections assigned to current user
  - Due/Overdue indicators
  - Quick filter: Today, This Week, Overdue
  
- **All Inspections** (`/inspections`)
  - Full inspection register (Manager/Supervisor view)
  - Templates & Schedules (`/inspections/templates`) - Admin only
  
- **Open Defects** (`/defects/open`)
  - Active defects requiring attention
  - Filter by: Assigned to Me, Site, Priority
  
- **All Defects** (`/defects`)
  - Complete defect register
  - Historical view

---

### **REGISTER** (Data Management)
*Reference data and entity management - Less frequent but critical*

- **Assets** (`/assets`)
  - Asset register and hierarchy
  - Asset detail views
  - Status management
  
- **Sites & Locations** (`/sites`)
  - Site management
  - Location/zones within sites
  - *Note: Admin/Manager only for creation/edit*

---

### **REPORTS** (Intelligence & Compliance)
*Analytics, compliance tracking, audit trails*

- **Reports** (`/reports`)
  - Compliance Reports (PUWER/LOLER)
  - Inspection History
  - Defect Analysis
  - Asset Status Reports
  
- **Audit Log** (`/audit-log`)
  - System activity tracking
  - Change history

---

### **ADMIN** (Configuration)
*System setup and user management*

- **Users & Roles** (`/users`)
  - User management
  - Role assignments
  - Site assignments
  
- **Inspection Templates** (`/inspections/templates`)
  - Template builder
  - Question management
  - Schedule configuration
  
- **Categories & Tags** (`/categories`)
  - Asset categories
  - Tag management
  
- **Settings** (`/settings`)
  - System configuration
  - Company settings
  - Prefix management

---

## 2. ROLE-BASED ACCESS LOGIC

### **Fitter** (Boots on Ground)
**Visible Sections:**
- ✅ WORK (full access)
  - Dashboard
  - My Inspections
  - Open Defects (filtered to "Assigned to Me")
- ✅ REGISTER (read-only)
  - Assets (view only)
  - Sites & Locations (view only)
- ❌ REPORTS (hidden)
- ❌ ADMIN (hidden)

**Quick Actions Priority:**
1. "My Inspections" - Most frequent task
2. "Raise Defect" - Quick action button in TopBar
3. "Assets" - Reference lookup

---

### **Supervisor** (Site Oversight)
**Visible Sections:**
- ✅ WORK (full access)
  - Dashboard
  - My Inspections
  - All Inspections (site-scoped)
  - Open Defects (site-scoped)
  - All Defects (site-scoped)
- ✅ REGISTER (full access)
  - Assets (site-scoped)
  - Sites & Locations (view assigned sites)
- ✅ REPORTS (limited)
  - Reports (site-scoped)
  - Audit Log (site-scoped)
- ❌ ADMIN (hidden)

**Quick Actions Priority:**
1. "Failed Inspections" - Dashboard widget
2. "Open Defects" - Site oversight
3. "Compliance Reports" - Weekly/monthly review

---

### **Manager** (Multi-Site Oversight)
**Visible Sections:**
- ✅ WORK (full access, all sites)
  - Dashboard
  - All Inspections (all sites)
  - All Defects (all sites)
- ✅ REGISTER (full access, all sites)
  - Assets (all sites)
  - Sites & Locations (all sites)
- ✅ REPORTS (full access)
  - Reports (all sites)
  - Audit Log (all sites)
- ❌ ADMIN (hidden)

**Quick Actions Priority:**
1. "Compliance Reports" - Primary oversight tool
2. "Failed Inspections" - Risk management
3. "Open Defects" - Resource allocation

---

### **Admin** (System Configuration)
**Visible Sections:**
- ✅ WORK (full access)
- ✅ REGISTER (full access)
- ✅ REPORTS (full access)
- ✅ ADMIN (full access)

**Quick Actions Priority:**
1. "Inspection Templates" - Template builder
2. "Users & Roles" - Access management
3. "Settings" - System configuration

---

## 3. UX RATIONALE & ORDERING

### **Frequency of Use Analysis**

**High Frequency (Multiple times per day):**
1. **My Inspections** - Fitter's primary task
2. **Open Defects** - Reactive work management
3. **Assets** - Reference during inspections
4. **Dashboard** - Daily overview

**Medium Frequency (Daily/Weekly):**
5. **All Inspections** - Supervisor oversight
6. **All Defects** - Historical tracking
7. **Reports** - Weekly compliance review

**Low Frequency (As needed):**
8. **Sites & Locations** - Setup/maintenance
9. **Admin sections** - Configuration tasks

### **Operational Flow Logic**

**Morning Routine (Fitter):**
1. Open Dashboard → See due inspections
2. Navigate to "My Inspections" → Start work
3. During inspection → Reference "Assets" for details
4. Find issue → "Raise Defect" (quick action)

**Oversight Routine (Supervisor):**
1. Open Dashboard → Review KPIs
2. Check "Open Defects" → Prioritize assignments
3. Review "Failed Inspections" → Follow-up actions
4. Weekly: "Reports" → Compliance check

**Configuration Routine (Admin):**
1. "Inspection Templates" → Build new templates
2. "Users & Roles" → Manage access
3. "Settings" → System maintenance

---

## 4. VISUAL DESIGN CUES

### **Iconography Suggestions**

**WORK Section:**
- Dashboard: `📊` (Chart/Overview)
- My Inspections: `✅` (Checkmark/Active work)
- All Inspections: `📋` (Clipboard/Register)
- Open Defects: `⚠️` (Warning/Urgent)
- All Defects: `📝` (Document/History)

**REGISTER Section:**
- Assets: `🔧` (Tool/Equipment)
- Sites & Locations: `📍` (Location pin)

**REPORTS Section:**
- Reports: `📈` (Chart/Analytics)
- Audit Log: `📜` (Scroll/History)

**ADMIN Section:**
- Users & Roles: `👥` (People)
- Inspection Templates: `📐` (Template/Builder)
- Categories & Tags: `🏷️` (Tag)
- Settings: `⚙️` (Gear)

### **State Indicators**

**Active State:**
- Background: `bg-blue-600`
- Text: `text-white`
- Font weight: `font-medium`
- Left border accent (optional): `border-l-4 border-blue-400`

**Hover State:**
- Background: `bg-gray-800`
- Text: `text-white`
- Smooth transition: `transition-colors duration-150`

**Badge Indicators:**
- Due/Overdue counts: Red badge on "My Inspections"
- Open defect count: Orange badge on "Open Defects"
- Failed inspection count: Red badge on "All Inspections" (Supervisor+)

**Collapsed State (Mobile/Tablet):**
- Icon-only display
- Tooltip on hover/tap
- Active state: Blue background circle around icon

---

## 5. MOBILE ADAPTABILITY

### **Tablet (768px - 1024px)**
- **Sidebar Behavior:** Collapsible, default collapsed
- **Toggle:** Hamburger menu in TopBar
- **Width:** 64px collapsed (icons only), 256px expanded
- **Touch Targets:** Minimum 44px height for menu items

### **Mobile (< 768px)**
- **Navigation Pattern:** Bottom Navigation Bar (iOS/Android style)
- **Visible Items (Bottom Bar):**
  1. Dashboard (Home icon)
  2. My Inspections (Checkmark icon)
  3. Open Defects (Warning icon)
  4. Assets (Tool icon)
  5. More (Hamburger) → Opens drawer with full menu

- **Drawer Menu:**
  - Slides in from left/right
  - Full menu structure with sections
  - Overlay backdrop
  - Close on selection or backdrop tap

### **Offline Indicator**
- Sync status badge in sidebar header (mobile) or TopBar (desktop)
- Color coding: Green (online), Yellow (syncing), Red (offline)
- Pending sync count badge

---

## 6. SCALABILITY FOR PHASE 2

### **Future "Work Orders" Integration**

**Option A: Add to WORK Section**
```
WORK
  - Dashboard
  - My Inspections
  - All Inspections
  - My Work Orders      ← NEW
  - All Work Orders     ← NEW
  - Open Defects
  - All Defects
```

**Option B: Separate "Work Orders" Section**
```
WORK
  - Dashboard
  - Inspections
  - Defects

WORK ORDERS              ← NEW SECTION
  - My Work Orders
  - All Work Orders
  - Work Order Templates
```

**Recommendation:** Option A - Keep workflow unified. Work Orders are part of the same operational flow as Inspections and Defects.

### **Future "Inventory" Integration**

**Option: Add to REGISTER Section**
```
REGISTER
  - Assets
  - Sites & Locations
  - Inventory            ← NEW (Phase 2)
  - Suppliers            ← NEW (Phase 2)
```

**Note:** Keep "Stock & Purchasing" out of Phase 1 as specified.

---

## 7. IMPLEMENTATION NOTES

### **Naming Conventions**
- ✅ **"My Inspections"** - Personal, task-oriented
- ✅ **"Open Defects"** - Action-oriented, clear urgency
- ✅ **"Sites & Locations"** - Descriptive, not just "Sites"
- ✅ **"Reports"** - Simple, replaces "Intelligence"
- ✅ **"Inspection Templates"** - Specific, not "Templates"

### **URL Structure**
```
/dashboard
/inspections/my          ← Personal view
/inspections             ← Full register
/inspections/templates   ← Admin only
/defects/open            ← Active work
/defects                 ← Full register
/assets
/assets/:id
/sites
/sites/:id
/reports
/audit-log
/users
/categories
/settings
```

### **Active Route Matching**
- `/inspections/my` should highlight "My Inspections" when active
- `/inspections/:id` should highlight "All Inspections" when active
- `/defects/:id` should highlight "Open Defects" or "All Defects" based on defect status

---

## 8. KEY IMPROVEMENTS OVER CURRENT STRUCTURE

1. **Task-Oriented Grouping:** "WORK" section puts daily operations first
2. **Personal Views:** "My Inspections" and "Open Defects" prioritize user's active work
3. **Clearer Naming:** "Reports" instead of "Intelligence", "Sites & Locations" instead of just "Sites"
4. **Role-Appropriate:** Fitters see minimal, focused menu; Admins see full structure
5. **Mobile-First:** Bottom navigation for mobile, collapsible sidebar for tablet
6. **Scalable:** Clear place for Work Orders in Phase 2 without restructuring

---

## 9. QUESTIONS FOR CLARIFICATION

1. **"My Inspections" vs "All Inspections":** Should "My Inspections" be a filtered view of `/inspections?assignedTo=me` or a separate route?

2. **Defect Grouping:** Should "Open Defects" be a filtered view (`/defects?status=open`) or separate route (`/defects/open`)?

3. **Inspection Templates:** Should templates live under Inspections (`/inspections/templates`) or in Admin section?

4. **PM Schedules:** Currently in navigation but not in Phase 1 scope - should this be hidden or moved to Admin?

5. **Help/Support:** Keep in navigation or move to user profile menu?

---

## 10. RECOMMENDED NEXT STEPS

1. **Review & Approve** this structure
2. **Clarify** questions above
3. **Implement** SideMenu component with new structure
4. **Add** role-based filtering logic
5. **Implement** mobile bottom navigation
6. **Test** with user personas (Fitter, Supervisor, Manager, Admin)
7. **Iterate** based on feedback

---

**Document Version:** 1.0  
**Date:** 2024  
**Author:** Senior UI/UX Designer (AI Assistant)
