export type OperationalStatus = 'InUse' | 'OutOfUse' | 'OffHirePending' | 'OffHired' | 'Quarantined' | 'Archived';
export type LifecycleStatus = 'Active' | 'Expected' | 'Decommissioned' | 'Disposed';
export type ComplianceRAG = 'Red' | 'Amber' | 'Green';
export type Ownership = 'Owned' | 'Hired';
export type Criticality = 'Low' | 'Medium' | 'High';

export interface Asset {
  id: string; // System Asset ID (AST-000001)
  assetTypeId: string;
  assetTypeCode: string; // e.g., MEWP, EX, MSV
  assetTypeName: string;
  internalClientAssetNumber?: string;
  manufacturer: string;
  make: string;
  model: string;
  manufacturerModelNumber?: string;
  supplierSerialNumber?: string;
  siteId: string;
  siteName: string;
  location?: string;
  operationalStatus: OperationalStatus;
  lifecycleStatus: LifecycleStatus;
  complianceRAG: ComplianceRAG;
  ownership: Ownership;
  hireCompany?: string;
  commissionDate?: string;
  dateBroughtToSite?: string; // ISO date string - when asset was brought to site
  hours?: number;
  mileage?: number;
  responsibleTeam?: string;
  criticality: Criticality;
  lastServiceCompletedDate?: string;
  lastInspectionPassedDate?: string;
  lastOnSiteAt?: string; // ISO date string - used for auto-archive logic
  expectedArrivalDate?: string; // ISO date string - for Expected lifecycle status
  notes?: string;
  knownIssues?: string;
  isQuarantined: boolean;
  relatedAssetIds: string[];
  attachments?: Array<{
    id: string;
    filename: string;
    type: 'photo' | 'document';
    uri: string;
    uploadedAt: string;
  }>;
  // Mock fields for Open Checks/Issues (will be computed from real data later)
  openChecksCount?: number; // Count of checks that are Due or Overdue
  openIssuesCount?: number; // Count of open defects/issues (not resolved/closed)
  // Compliance flags
  requiresLoler?: boolean;
  requiresPuwer?: boolean;
  hasFireSuppression?: boolean;
}

export interface AssetType {
  id: string;
  code: string; // e.g., MEWP, EX, MSV
  name: string;
}

export type ComplianceType = 'PUWER' | 'LOLER' | 'FIRE_SUPPRESSION' | 'Custom';

export interface ComplianceItem {
  id: string;
  assetId: string;
  complianceType: ComplianceType;
  itemName: string; // e.g., "LOLER Thorough Examination", "Fire suppression service"
  frequencyValue: number; // e.g., 6
  frequencyUnit: 'days' | 'weeks' | 'months' | 'years'; // e.g., "months"
  lastDoneDate?: string;
  nextDueDate: string;
  ragStatus: ComplianceRAG;
  evidenceDocumentId?: string; // Reference to document/attachment
  evidenceDocumentName?: string;
  notes?: string;
  performedBy?: string;
  standardReference?: string; // e.g., "LOLER", "PUWER"
  createdAt: string;
  updatedAt: string;
}

export interface AssetFilter {
  search?: string;
  siteId?: string | string[];
  assetTypeId?: string | string[];
  operationalStatus?: OperationalStatus | OperationalStatus[];
  lifecycleStatus?: LifecycleStatus | LifecycleStatus[];
  complianceRAG?: ComplianceRAG | ComplianceRAG[];
  ownership?: Ownership | Ownership[];
  responsibleTeam?: string | string[];
  criticality?: Criticality | Criticality[];
  includeArchived?: boolean;
}

export type RelationshipType = 'DEPENDENCY';

export interface AssetRelationship {
  id: string;
  parentAssetId: string;
  childAssetId: string;
  relationshipType: RelationshipType;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}
