import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

// Company schemas
export const createCompanySchema = z.object({
  name: z.string().min(1),
});

export const updateCompanySchema = createCompanySchema.partial();

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1),
  companyId: z.string().uuid(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
});

// Site schemas
export const createSiteSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().uuid(),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1).optional(),
});

// Zone schemas
export const createZoneSchema = z.object({
  name: z.string().min(1),
  siteId: z.string().uuid(),
});

export const updateZoneSchema = z.object({
  name: z.string().min(1).optional(),
});

// AssetType schemas
export const createAssetTypeSchema = z.object({
  name: z.string().min(1),
  prefix: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/),
});

export const updateAssetTypeSchema = createAssetTypeSchema.partial();

// Asset schemas
export const createAssetSchema = z.object({
  name: z.string().min(1),
  assetTypeId: z.string().uuid(),
  siteId: z.string().uuid(),
  zoneId: z.string().uuid().optional(),
  category: z.enum(['Plant', 'Equipment']),
  ownership: z.enum(['Owned', 'Hired']),
  parentAssetId: z.string().uuid().optional().nullable(),
  status: z.enum(['InUse', 'OutOfUse', 'OffHirePending', 'OffHired', 'Quarantined']).default('InUse'),
  description: z.string().optional(),
});

export const updateAssetStatusSchema = z.object({
  status: z.enum(['InUse', 'OutOfUse', 'OffHirePending', 'OffHired', 'Quarantined']),
  reason: z.string().optional(),
});

// Work order schemas
export const createWorkOrderSchema = z.object({
  type: z.enum(['PPM', 'Inspection', 'Breakdown', 'Defect', 'Calibration', 'FireSuppression', 'LOLER', 'PUWER']),
  assetId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  siteId: z.string().uuid(),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum(['Open', 'Assigned', 'InProgress', 'WaitingParts', 'WaitingVendor', 'Completed', 'ApprovedClosed', 'Cancelled']),
  notes: z.string().optional(),
});

export const assignWorkOrderSchema = z.object({
  assignedToId: z.string().uuid(),
});

// Schedule schemas
export const createScheduleSchema = z.object({
  assetId: z.string().uuid(),
  name: z.string().min(1),
  scheduleType: z.enum(['TimeBased', 'HoursBased']),
  intervalDays: z.number().int().positive().optional(),
  intervalHours: z.number().int().positive().optional(),
  checkTemplateId: z.string().uuid(),
  isActive: z.boolean().default(true),
});

export const updateScheduleSchema = createScheduleSchema.partial();

// Check template schemas
export const createCheckTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(z.object({
    question: z.string().min(1),
    type: z.enum(['YesNo', 'Number', 'Text']),
    unit: z.string().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    required: z.boolean().default(true),
    order: z.number().int(),
  })),
});

export const updateCheckTemplateSchema = createCheckTemplateSchema.partial();

// Check submission schemas
export const submitCheckSchema = z.object({
  occurrenceId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.union([z.string(), z.number(), z.boolean()]),
    comment: z.string().optional(),
  })),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['Viewer', 'Fitter', 'Supervisor', 'Manager', 'Admin']),
  siteIds: z.array(z.string().uuid()).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['Viewer', 'Fitter', 'Supervisor', 'Manager', 'Admin']).optional(),
  siteIds: z.array(z.string().uuid()).optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const assetFilterSchema = paginationSchema.extend({
  siteId: z.string().uuid().optional(),
  assetTypeId: z.string().uuid().optional(),
  status: z.enum(['InUse', 'OutOfUse', 'OffHirePending', 'OffHired', 'Quarantined']).optional(),
  category: z.enum(['Plant', 'Equipment']).optional(),
});

export const workOrderFilterSchema = paginationSchema.extend({
  siteId: z.string().uuid().optional(),
  status: z.enum(['Open', 'Assigned', 'InProgress', 'WaitingParts', 'WaitingVendor', 'Completed', 'ApprovedClosed', 'Cancelled']).optional(),
  type: z.enum(['PPM', 'Inspection', 'Breakdown', 'Defect', 'Calibration', 'FireSuppression', 'LOLER', 'PUWER']).optional(),
});

