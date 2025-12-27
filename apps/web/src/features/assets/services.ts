import type { Asset, AssetType, ComplianceItem, AssetFilter, ComplianceType, OperationalStatus, Ownership, Criticality, ComplianceRAG } from './types';

// Mock asset types
const assetTypes: AssetType[] = [
  { id: '1', code: 'MEWP', name: 'Mobile Elevating Work Platform' },
  { id: '2', code: 'EX', name: 'Excavator' },
  { id: '3', code: 'MSV', name: 'Mobile Service Vehicle' },
  { id: '4', code: 'CR', name: 'Crane' },
  { id: '5', code: 'FL', name: 'Forklift' },
  { id: '6', code: 'GEN', name: 'Generator' },
  { id: '7', code: 'COM', name: 'Compressor' },
  { id: '8', code: 'PU', name: 'Pump' },
];

// Mock assets - using let so we can add to it
let mockAssets: Asset[] = [
  {
    id: 'AST-000001',
    assetTypeId: '2',
    assetTypeCode: 'EX',
    assetTypeName: 'Excavator',
    internalClientAssetNumber: 'CLIENT-EX-001',
    manufacturer: 'Caterpillar',
    make: 'Caterpillar',
    model: '320D',
    manufacturerModelNumber: 'CAT-320D-2020',
    supplierSerialNumber: 'SN-EX-001-2020',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 1',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2020-01-15',
    hours: 2450,
    responsibleTeam: 'Plant Team',
    criticality: 'High',
    lastServiceCompletedDate: '2025-11-15',
    lastInspectionPassedDate: '2025-11-20',
    lastOnSiteAt: '2025-12-15', // Recent
    notes: 'Regular maintenance required',
    knownIssues: 'Minor hydraulic leak',
    isQuarantined: false,
    relatedAssetIds: ['AST-000002', 'AST-000009'],
    openChecksCount: 2,
    openIssuesCount: 1,
    requiresLoler: true, // Excavator may have lifting attachments
    requiresPuwer: true, // All plant requires PUWER
    hasFireSuppression: false,
  },
  {
    id: 'AST-000002',
    assetTypeId: '1',
    assetTypeCode: 'MEWP',
    assetTypeName: 'Mobile Elevating Work Platform',
    internalClientAssetNumber: 'CLIENT-MEWP-001',
    manufacturer: 'JLG',
    make: 'JLG',
    model: '600S',
    manufacturerModelNumber: 'JLG-600S-2021',
    supplierSerialNumber: 'SN-MEWP-001-2021',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 2',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2021-03-10',
    hours: 1820,
    responsibleTeam: 'Plant Team',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-01',
    lastInspectionPassedDate: '2025-12-05',
    lastOnSiteAt: '2025-12-14', // Recent
    isQuarantined: false,
    relatedAssetIds: ['AST-000001'],
    openChecksCount: 0,
    openIssuesCount: 0,
  },
  {
    id: 'AST-000003',
    assetTypeId: '4',
    assetTypeCode: 'CR',
    assetTypeName: 'Crane',
    internalClientAssetNumber: 'CLIENT-CR-005',
    manufacturer: 'Liebherr',
    make: 'Liebherr',
    model: 'LTM 1100',
    manufacturerModelNumber: 'LIE-LTM1100-2019',
    supplierSerialNumber: 'SN-CR-005-2019',
    siteId: '2',
    siteName: 'Site B',
    location: 'Crane Pad',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Red',
    ownership: 'Owned',
    commissionDate: '2019-06-20',
    hours: 3120,
    responsibleTeam: 'Crane Team',
    criticality: 'High',
    lastServiceCompletedDate: '2025-11-10',
    lastInspectionPassedDate: '2025-10-15',
    lastOnSiteAt: '2025-12-10',
    notes: 'Requires regular inspection',
    isQuarantined: false,
    relatedAssetIds: [],
    openChecksCount: 3,
    openIssuesCount: 2,
  },
  {
    id: 'AST-000004',
    assetTypeId: '4',
    assetTypeCode: 'CR',
    assetTypeName: 'Crane',
    internalClientAssetNumber: 'CLIENT-CR-005',
    manufacturer: 'Liebherr',
    make: 'Liebherr',
    model: 'LTM 1050',
    manufacturerModelNumber: 'LIE-LTM1050-2019',
    supplierSerialNumber: 'SN-CR-005-2019',
    siteId: '2',
    siteName: 'Site B',
    location: 'Main Site',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Red',
    ownership: 'Owned',
    commissionDate: '2019-06-20',
    hours: 3200,
    responsibleTeam: 'Heavy Plant',
    criticality: 'High',
    lastServiceCompletedDate: '2025-10-15',
    lastInspectionPassedDate: '2025-10-10',
    lastOnSiteAt: '2025-12-10', // Recent
    notes: 'LOLER certificate expiring soon',
    knownIssues: 'LOLER certificate due',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000004',
    assetTypeId: '5',
    assetTypeCode: 'FL',
    assetTypeName: 'Forklift',
    internalClientAssetNumber: 'CLIENT-FL-023',
    manufacturer: 'Toyota',
    make: 'Toyota',
    model: '8FBE20',
    manufacturerModelNumber: 'TOY-8FBE20-2022',
    supplierSerialNumber: 'SN-FL-023-2022',
    siteId: '3',
    siteName: 'Site C',
    location: 'Warehouse',
    operationalStatus: 'Quarantined',
    lifecycleStatus: 'Active',
    complianceRAG: 'Red',
    ownership: 'Owned',
    commissionDate: '2022-02-14',
    hours: 1560,
    responsibleTeam: 'Warehouse',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-11-20',
    lastInspectionPassedDate: '2025-11-18',
    lastOnSiteAt: '2025-11-18', // Recent
    notes: 'Brake system repair required',
    knownIssues: 'Brake system failure - quarantined',
    isQuarantined: true,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000005',
    assetTypeId: '6',
    assetTypeCode: 'GEN',
    assetTypeName: 'Generator',
    internalClientAssetNumber: 'CLIENT-GEN-012',
    manufacturer: 'Cummins',
    make: 'Cummins',
    model: 'QSK60',
    manufacturerModelNumber: 'CUM-QSK60-2020',
    supplierSerialNumber: 'SN-GEN-012-2020',
    siteId: '1',
    siteName: 'Site A',
    location: 'Power Station',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Hired',
    hireCompany: 'Hire Co Ltd',
    commissionDate: '2020-08-05',
    hours: 4200,
    responsibleTeam: 'Electrical',
    criticality: 'High',
    lastServiceCompletedDate: '2025-12-10',
    lastInspectionPassedDate: '2025-12-08',
    lastOnSiteAt: '2025-12-12', // Recent
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000006',
    assetTypeId: '7',
    assetTypeCode: 'COM',
    assetTypeName: 'Compressor',
    internalClientAssetNumber: 'CLIENT-COM-015',
    manufacturer: 'Atlas Copco',
    make: 'Atlas Copco',
    model: 'GA90',
    manufacturerModelNumber: 'ATL-GA90-2021',
    supplierSerialNumber: 'SN-COM-015-2021',
    siteId: '1',
    siteName: 'Site A',
    location: 'Workshop',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2021-04-12',
    hours: 2890,
    responsibleTeam: 'Workshop',
    criticality: 'Low',
    lastServiceCompletedDate: '2025-11-25',
    lastInspectionPassedDate: '2025-11-22',
    lastOnSiteAt: '2025-12-13', // Recent
    notes: 'Weekly checks required',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000007',
    assetTypeId: '8',
    assetTypeCode: 'PU',
    assetTypeName: 'Pump',
    internalClientAssetNumber: 'CLIENT-PU-042',
    manufacturer: 'Grundfos',
    make: 'Grundfos',
    model: 'CR 32-4',
    manufacturerModelNumber: 'GRU-CR32-4-2022',
    supplierSerialNumber: 'SN-PU-042-2022',
    siteId: '3',
    siteName: 'Site C',
    location: 'Pump House',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2022-05-18',
    hours: 1980,
    responsibleTeam: 'Maintenance',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-05',
    lastInspectionPassedDate: '2025-12-03',
    lastOnSiteAt: '2025-12-11', // Recent
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000008',
    assetTypeId: '3',
    assetTypeCode: 'MSV',
    assetTypeName: 'Mobile Service Vehicle',
    internalClientAssetNumber: 'CLIENT-MSV-001',
    manufacturer: 'Ford',
    make: 'Ford',
    model: 'Transit',
    manufacturerModelNumber: 'FOR-TRANSIT-2023',
    supplierSerialNumber: 'SN-MSV-001-2023',
    siteId: '2',
    siteName: 'Site B',
    location: 'Fleet Yard',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2023-01-20',
    mileage: 45200,
    responsibleTeam: 'Fleet',
    criticality: 'Low',
    lastServiceCompletedDate: '2025-11-30',
    lastInspectionPassedDate: '2025-11-28',
    lastOnSiteAt: '2025-12-09', // Recent
    isQuarantined: false,
    relatedAssetIds: [],
  },
  // Additional 30 assets for testing
  {
    id: 'AST-000009',
    assetTypeId: '2',
    assetTypeCode: 'EX',
    assetTypeName: 'Excavator',
    internalClientAssetNumber: 'CLIENT-EX-002',
    manufacturer: 'Komatsu',
    make: 'Komatsu',
    model: 'PC220LC-8',
    manufacturerModelNumber: 'KOM-PC220LC8-2021',
    supplierSerialNumber: 'SN-EX-002-2021',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 1',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2021-05-10',
    hours: 2100,
    responsibleTeam: 'Plant Team',
    criticality: 'High',
    lastServiceCompletedDate: '2025-12-08',
    lastInspectionPassedDate: '2025-12-06',
    lastOnSiteAt: '2025-12-14',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000010',
    assetTypeId: '5',
    assetTypeCode: 'FL',
    assetTypeName: 'Forklift',
    internalClientAssetNumber: 'CLIENT-FL-024',
    manufacturer: 'Caterpillar',
    make: 'Caterpillar',
    model: 'EP16K',
    manufacturerModelNumber: 'CAT-EP16K-2020',
    supplierSerialNumber: 'SN-FL-024-2020',
    siteId: '1',
    siteName: 'Site A',
    location: 'Warehouse',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2020-07-22',
    hours: 3200,
    responsibleTeam: 'Warehouse',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-11-28',
    lastInspectionPassedDate: '2025-11-25',
    lastOnSiteAt: '2025-12-12',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000011',
    assetTypeId: '4',
    assetTypeCode: 'CR',
    assetTypeName: 'Crane',
    internalClientAssetNumber: 'CLIENT-CR-006',
    manufacturer: 'Grove',
    make: 'Grove',
    model: 'RT540E',
    manufacturerModelNumber: 'GRV-RT540E-2018',
    supplierSerialNumber: 'SN-CR-006-2018',
    siteId: '2',
    siteName: 'Site B',
    location: 'Main Site',
    operationalStatus: 'OutOfUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Red',
    ownership: 'Owned',
    commissionDate: '2018-09-15',
    hours: 5800,
    responsibleTeam: 'Heavy Plant',
    criticality: 'High',
    lastServiceCompletedDate: '2025-09-20',
    lastInspectionPassedDate: '2025-09-15',
    lastOnSiteAt: '2025-10-10', // 66 days ago - should be archived
    notes: 'Requires major service',
    knownIssues: 'Hydraulic system issues',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000012',
    assetTypeId: '1',
    assetTypeCode: 'MEWP',
    assetTypeName: 'Mobile Elevating Work Platform',
    internalClientAssetNumber: 'CLIENT-MEWP-002',
    manufacturer: 'Genie',
    make: 'Genie',
    model: 'SX-180',
    manufacturerModelNumber: 'GEN-SX180-2022',
    supplierSerialNumber: 'SN-MEWP-002-2022',
    siteId: '2',
    siteName: 'Site B',
    location: 'Yard 2',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Hired',
    hireCompany: 'Access Hire Ltd',
    commissionDate: '2022-03-05',
    hours: 1450,
    responsibleTeam: 'Electrical',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-02',
    lastInspectionPassedDate: '2025-12-01',
    lastOnSiteAt: '2025-12-15',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000013',
    assetTypeId: '6',
    assetTypeCode: 'GEN',
    assetTypeName: 'Generator',
    internalClientAssetNumber: 'CLIENT-GEN-013',
    manufacturer: 'Perkins',
    make: 'Perkins',
    model: '4006-23TRS1',
    manufacturerModelNumber: 'PER-4006-23TRS1-2019',
    supplierSerialNumber: 'SN-GEN-013-2019',
    siteId: '3',
    siteName: 'Site C',
    location: 'Backup Power',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2019-11-08',
    hours: 3800,
    responsibleTeam: 'Electrical',
    criticality: 'High',
    lastServiceCompletedDate: '2025-12-07',
    lastInspectionPassedDate: '2025-12-05',
    lastOnSiteAt: '2025-12-13',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000014',
    assetTypeId: '7',
    assetTypeCode: 'COM',
    assetTypeName: 'Compressor',
    internalClientAssetNumber: 'CLIENT-COM-016',
    manufacturer: 'Ingersoll Rand',
    make: 'Ingersoll Rand',
    model: 'SSR EP200',
    manufacturerModelNumber: 'IR-SSREP200-2020',
    supplierSerialNumber: 'SN-COM-016-2020',
    siteId: '1',
    siteName: 'Site A',
    location: 'Workshop',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2020-06-12',
    hours: 2650,
    responsibleTeam: 'Workshop',
    criticality: 'Low',
    lastServiceCompletedDate: '2025-11-30',
    lastInspectionPassedDate: '2025-11-28',
    lastOnSiteAt: '2025-12-10',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000015',
    assetTypeId: '8',
    assetTypeCode: 'PU',
    assetTypeName: 'Pump',
    internalClientAssetNumber: 'CLIENT-PU-043',
    manufacturer: 'Flygt',
    make: 'Flygt',
    model: 'N3069',
    manufacturerModelNumber: 'FLY-N3069-2021',
    supplierSerialNumber: 'SN-PU-043-2021',
    siteId: '2',
    siteName: 'Site B',
    location: 'Pump Station',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2021-08-20',
    hours: 2200,
    responsibleTeam: 'Maintenance',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-04',
    lastInspectionPassedDate: '2025-12-02',
    lastOnSiteAt: '2025-12-14',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000016',
    assetTypeId: '2',
    assetTypeCode: 'EX',
    assetTypeName: 'Excavator',
    internalClientAssetNumber: 'CLIENT-EX-003',
    manufacturer: 'Volvo',
    make: 'Volvo',
    model: 'EC210D',
    manufacturerModelNumber: 'VOL-EC210D-2022',
    supplierSerialNumber: 'SN-EX-003-2022',
    siteId: '3',
    siteName: 'Site C',
    location: 'Yard 1',
    operationalStatus: 'OffHired',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Hired',
    hireCompany: 'Plant Hire Co',
    commissionDate: '2022-04-18',
    hours: 1800,
    responsibleTeam: 'Plant Team',
    criticality: 'High',
    lastServiceCompletedDate: '2025-10-25',
    lastInspectionPassedDate: '2025-10-22',
    lastOnSiteAt: '2025-10-15', // 61 days ago - should be archived
    notes: 'Returned to hire company',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000017',
    assetTypeId: '5',
    assetTypeCode: 'FL',
    assetTypeName: 'Forklift',
    internalClientAssetNumber: 'CLIENT-FL-025',
    manufacturer: 'Linde',
    make: 'Linde',
    model: 'E20',
    manufacturerModelNumber: 'LIN-E20-2021',
    supplierSerialNumber: 'SN-FL-025-2021',
    siteId: '1',
    siteName: 'Site A',
    location: 'Warehouse',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2021-09-14',
    hours: 1950,
    responsibleTeam: 'Warehouse',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-06',
    lastInspectionPassedDate: '2025-12-04',
    lastOnSiteAt: '2025-12-15',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000018',
    assetTypeId: '4',
    assetTypeCode: 'CR',
    assetTypeName: 'Crane',
    internalClientAssetNumber: 'CLIENT-CR-007',
    manufacturer: 'Terex',
    make: 'Terex',
    model: 'RT 780',
    manufacturerModelNumber: 'TER-RT780-2017',
    supplierSerialNumber: 'SN-CR-007-2017',
    siteId: '1',
    siteName: 'Site A',
    location: 'Main Site',
    operationalStatus: 'OutOfUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Red',
    ownership: 'Owned',
    commissionDate: '2017-12-05',
    hours: 7200,
    responsibleTeam: 'Heavy Plant',
    criticality: 'High',
    lastServiceCompletedDate: '2025-08-10',
    lastInspectionPassedDate: '2025-08-05',
    lastOnSiteAt: '2025-09-20', // 87 days ago - should be archived
    notes: 'Major overhaul required',
    knownIssues: 'Engine issues, awaiting parts',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000019',
    assetTypeId: '1',
    assetTypeCode: 'MEWP',
    assetTypeName: 'Mobile Elevating Work Platform',
    internalClientAssetNumber: 'CLIENT-MEWP-003',
    manufacturer: 'JLG',
    make: 'JLG',
    model: '800AJ',
    manufacturerModelNumber: 'JLG-800AJ-2023',
    supplierSerialNumber: 'SN-MEWP-003-2023',
    siteId: '3',
    siteName: 'Site C',
    location: 'Yard 1',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2023-02-10',
    hours: 980,
    responsibleTeam: 'Electrical',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-01',
    lastInspectionPassedDate: '2025-11-29',
    lastOnSiteAt: '2025-12-14',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000020',
    assetTypeId: '6',
    assetTypeCode: 'GEN',
    assetTypeName: 'Generator',
    internalClientAssetNumber: 'CLIENT-GEN-014',
    manufacturer: 'Cummins',
    make: 'Cummins',
    model: 'QSK19',
    manufacturerModelNumber: 'CUM-QSK19-2020',
    supplierSerialNumber: 'SN-GEN-014-2020',
    siteId: '2',
    siteName: 'Site B',
    location: 'Power Station',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Hired',
    hireCompany: 'Power Solutions Ltd',
    commissionDate: '2020-09-25',
    hours: 4100,
    responsibleTeam: 'Electrical',
    criticality: 'High',
    lastServiceCompletedDate: '2025-12-09',
    lastInspectionPassedDate: '2025-12-07',
    lastOnSiteAt: '2025-12-15',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000021',
    assetTypeId: '7',
    assetTypeCode: 'COM',
    assetTypeName: 'Compressor',
    internalClientAssetNumber: 'CLIENT-COM-017',
    manufacturer: 'Atlas Copco',
    make: 'Atlas Copco',
    model: 'GA37',
    manufacturerModelNumber: 'ATL-GA37-2021',
    supplierSerialNumber: 'SN-COM-017-2021',
    siteId: '3',
    siteName: 'Site C',
    location: 'Workshop',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2021-07-08',
    hours: 2400,
    responsibleTeam: 'Workshop',
    criticality: 'Low',
    lastServiceCompletedDate: '2025-11-27',
    lastInspectionPassedDate: '2025-11-25',
    lastOnSiteAt: '2025-12-11',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000022',
    assetTypeId: '8',
    assetTypeCode: 'PU',
    assetTypeName: 'Pump',
    internalClientAssetNumber: 'CLIENT-PU-044',
    manufacturer: 'Grundfos',
    make: 'Grundfos',
    model: 'CR 64-3',
    manufacturerModelNumber: 'GRU-CR64-3-2022',
    supplierSerialNumber: 'SN-PU-044-2022',
    siteId: '1',
    siteName: 'Site A',
    location: 'Pump House',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2022-06-14',
    hours: 1750,
    responsibleTeam: 'Maintenance',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-03',
    lastInspectionPassedDate: '2025-12-01',
    lastOnSiteAt: '2025-12-13',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000023',
    assetTypeId: '3',
    assetTypeCode: 'MSV',
    assetTypeName: 'Mobile Service Vehicle',
    internalClientAssetNumber: 'CLIENT-MSV-002',
    manufacturer: 'Mercedes',
    make: 'Mercedes',
    model: 'Sprinter',
    manufacturerModelNumber: 'MER-SPRINTER-2022',
    supplierSerialNumber: 'SN-MSV-002-2022',
    siteId: '2',
    siteName: 'Site B',
    location: 'Fleet Yard',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2022-05-22',
    mileage: 38500,
    responsibleTeam: 'Fleet',
    criticality: 'Low',
    lastServiceCompletedDate: '2025-11-28',
    lastInspectionPassedDate: '2025-11-26',
    lastOnSiteAt: '2025-12-12',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000024',
    assetTypeId: '2',
    assetTypeCode: 'EX',
    assetTypeName: 'Excavator',
    internalClientAssetNumber: 'CLIENT-EX-004',
    manufacturer: 'Hitachi',
    make: 'Hitachi',
    model: 'ZX210LC-6',
    manufacturerModelNumber: 'HIT-ZX210LC6-2020',
    supplierSerialNumber: 'SN-EX-004-2020',
    siteId: '2',
    siteName: 'Site B',
    location: 'Yard 1',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2020-10-18',
    hours: 2900,
    responsibleTeam: 'Plant Team',
    criticality: 'High',
    lastServiceCompletedDate: '2025-11-22',
    lastInspectionPassedDate: '2025-11-20',
    lastOnSiteAt: '2025-12-09',
    notes: 'Regular service due',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000025',
    assetTypeId: '5',
    assetTypeCode: 'FL',
    assetTypeName: 'Forklift',
    internalClientAssetNumber: 'CLIENT-FL-026',
    manufacturer: 'Yale',
    make: 'Yale',
    model: 'ERP16VT',
    manufacturerModelNumber: 'YAL-ERP16VT-2019',
    supplierSerialNumber: 'SN-FL-026-2019',
    siteId: '3',
    siteName: 'Site C',
    location: 'Warehouse',
    operationalStatus: 'Quarantined',
    lifecycleStatus: 'Active',
    complianceRAG: 'Red',
    ownership: 'Owned',
    commissionDate: '2019-04-30',
    hours: 4500,
    responsibleTeam: 'Warehouse',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-11-15',
    lastInspectionPassedDate: '2025-11-12',
    lastOnSiteAt: '2025-11-12',
    notes: 'Safety inspection failed',
    knownIssues: 'Mast alignment issue',
    isQuarantined: true,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000026',
    assetTypeId: '4',
    assetTypeCode: 'CR',
    assetTypeName: 'Crane',
    internalClientAssetNumber: 'CLIENT-CR-008',
    manufacturer: 'Manitowoc',
    make: 'Manitowoc',
    model: 'Grove GMK4100L',
    manufacturerModelNumber: 'MAN-GMK4100L-2016',
    supplierSerialNumber: 'SN-CR-008-2016',
    siteId: '3',
    siteName: 'Site C',
    location: 'Main Site',
    operationalStatus: 'OffHired',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Hired',
    hireCompany: 'Crane Hire Ltd',
    commissionDate: '2016-08-12',
    hours: 9800,
    responsibleTeam: 'Heavy Plant',
    criticality: 'High',
    lastServiceCompletedDate: '2025-09-30',
    lastInspectionPassedDate: '2025-09-28',
    lastOnSiteAt: '2025-10-01', // 75 days ago - should be archived
    notes: 'Returned to hire company',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000027',
    assetTypeId: '1',
    assetTypeCode: 'MEWP',
    assetTypeName: 'Mobile Elevating Work Platform',
    internalClientAssetNumber: 'CLIENT-MEWP-004',
    manufacturer: 'Genie',
    make: 'Genie',
    model: 'Z-45/25',
    manufacturerModelNumber: 'GEN-Z45-25-2021',
    supplierSerialNumber: 'SN-MEWP-004-2021',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 2',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2021-11-05',
    hours: 1650,
    responsibleTeam: 'Electrical',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-05',
    lastInspectionPassedDate: '2025-12-03',
    lastOnSiteAt: '2025-12-14',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000028',
    assetTypeId: '6',
    assetTypeCode: 'GEN',
    assetTypeName: 'Generator',
    internalClientAssetNumber: 'CLIENT-GEN-015',
    manufacturer: 'Kohler',
    make: 'Kohler',
    model: 'SDMO',
    manufacturerModelNumber: 'KOH-SDMO-2022',
    supplierSerialNumber: 'SN-GEN-015-2022',
    siteId: '3',
    siteName: 'Site C',
    location: 'Backup Power',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2022-01-15',
    hours: 1200,
    responsibleTeam: 'Electrical',
    criticality: 'High',
    lastServiceCompletedDate: '2025-12-08',
    lastInspectionPassedDate: '2025-12-06',
    lastOnSiteAt: '2025-12-15',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000029',
    assetTypeId: '7',
    assetTypeCode: 'COM',
    assetTypeName: 'Compressor',
    internalClientAssetNumber: 'CLIENT-COM-018',
    manufacturer: 'Kaeser',
    make: 'Kaeser',
    model: 'SM 11',
    manufacturerModelNumber: 'KAE-SM11-2020',
    supplierSerialNumber: 'SN-COM-018-2020',
    siteId: '2',
    siteName: 'Site B',
    location: 'Workshop',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2020-12-08',
    hours: 3100,
    responsibleTeam: 'Workshop',
    criticality: 'Low',
    lastServiceCompletedDate: '2025-11-29',
    lastInspectionPassedDate: '2025-11-27',
    lastOnSiteAt: '2025-12-10',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000030',
    assetTypeId: '8',
    assetTypeCode: 'PU',
    assetTypeName: 'Pump',
    internalClientAssetNumber: 'CLIENT-PU-045',
    manufacturer: 'Flygt',
    make: 'Flygt',
    model: 'N3085',
    manufacturerModelNumber: 'FLY-N3085-2021',
    supplierSerialNumber: 'SN-PU-045-2021',
    siteId: '1',
    siteName: 'Site A',
    location: 'Pump Station',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2021-09-28',
    hours: 2300,
    responsibleTeam: 'Maintenance',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-06',
    lastInspectionPassedDate: '2025-12-04',
    lastOnSiteAt: '2025-12-12',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000031',
    assetTypeId: '2',
    assetTypeCode: 'EX',
    assetTypeName: 'Excavator',
    internalClientAssetNumber: 'CLIENT-EX-005',
    manufacturer: 'JCB',
    make: 'JCB',
    model: '220X',
    manufacturerModelNumber: 'JCB-220X-2023',
    supplierSerialNumber: 'SN-EX-005-2023',
    siteId: '1',
    siteName: 'Site A',
    location: 'Yard 1',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2023-03-20',
    hours: 850,
    responsibleTeam: 'Plant Team',
    criticality: 'High',
    lastServiceCompletedDate: '2025-12-10',
    lastInspectionPassedDate: '2025-12-08',
    lastOnSiteAt: '2025-12-15',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000032',
    assetTypeId: '5',
    assetTypeCode: 'FL',
    assetTypeName: 'Forklift',
    internalClientAssetNumber: 'CLIENT-FL-027',
    manufacturer: 'Hyster',
    make: 'Hyster',
    model: 'H40-70XM',
    manufacturerModelNumber: 'HYS-H40-70XM-2020',
    supplierSerialNumber: 'SN-FL-027-2020',
    siteId: '2',
    siteName: 'Site B',
    location: 'Warehouse',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2020-11-12',
    hours: 3400,
    responsibleTeam: 'Warehouse',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-07',
    lastInspectionPassedDate: '2025-12-05',
    lastOnSiteAt: '2025-12-13',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000033',
    assetTypeId: '4',
    assetTypeCode: 'CR',
    assetTypeName: 'Crane',
    internalClientAssetNumber: 'CLIENT-CR-009',
    manufacturer: 'Liebherr',
    make: 'Liebherr',
    model: 'LTM 1060',
    manufacturerModelNumber: 'LIE-LTM1060-2019',
    supplierSerialNumber: 'SN-CR-009-2019',
    siteId: '1',
    siteName: 'Site A',
    location: 'Main Site',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2019-07-25',
    hours: 5100,
    responsibleTeam: 'Heavy Plant',
    criticality: 'High',
    lastServiceCompletedDate: '2025-11-18',
    lastInspectionPassedDate: '2025-11-15',
    lastOnSiteAt: '2025-12-11',
    notes: 'LOLER due soon',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000034',
    assetTypeId: '1',
    assetTypeCode: 'MEWP',
    assetTypeName: 'Mobile Elevating Work Platform',
    internalClientAssetNumber: 'CLIENT-MEWP-005',
    manufacturer: 'JLG',
    make: 'JLG',
    model: '600AJ',
    manufacturerModelNumber: 'JLG-600AJ-2022',
    supplierSerialNumber: 'SN-MEWP-005-2022',
    siteId: '3',
    siteName: 'Site C',
    location: 'Yard 2',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Hired',
    hireCompany: 'Platform Hire Co',
    commissionDate: '2022-08-14',
    hours: 1100,
    responsibleTeam: 'Electrical',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-04',
    lastInspectionPassedDate: '2025-12-02',
    lastOnSiteAt: '2025-12-14',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000035',
    assetTypeId: '6',
    assetTypeCode: 'GEN',
    assetTypeName: 'Generator',
    internalClientAssetNumber: 'CLIENT-GEN-016',
    manufacturer: 'Perkins',
    make: 'Perkins',
    model: '4008-30TRS2',
    manufacturerModelNumber: 'PER-4008-30TRS2-2021',
    supplierSerialNumber: 'SN-GEN-016-2021',
    siteId: '2',
    siteName: 'Site B',
    location: 'Power Station',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2021-10-30',
    hours: 3600,
    responsibleTeam: 'Electrical',
    criticality: 'High',
    lastServiceCompletedDate: '2025-12-11',
    lastInspectionPassedDate: '2025-12-09',
    lastOnSiteAt: '2025-12-15',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000036',
    assetTypeId: '7',
    assetTypeCode: 'COM',
    assetTypeName: 'Compressor',
    internalClientAssetNumber: 'CLIENT-COM-019',
    manufacturer: 'Atlas Copco',
    make: 'Atlas Copco',
    model: 'GA55',
    manufacturerModelNumber: 'ATL-GA55-2022',
    supplierSerialNumber: 'SN-COM-019-2022',
    siteId: '3',
    siteName: 'Site C',
    location: 'Workshop',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Amber',
    ownership: 'Owned',
    commissionDate: '2022-07-05',
    hours: 1950,
    responsibleTeam: 'Workshop',
    criticality: 'Low',
    lastServiceCompletedDate: '2025-12-01',
    lastInspectionPassedDate: '2025-11-29',
    lastOnSiteAt: '2025-12-12',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000037',
    assetTypeId: '8',
    assetTypeCode: 'PU',
    assetTypeName: 'Pump',
    internalClientAssetNumber: 'CLIENT-PU-046',
    manufacturer: 'Grundfos',
    make: 'Grundfos',
    model: 'CR 95-4',
    manufacturerModelNumber: 'GRU-CR95-4-2020',
    supplierSerialNumber: 'SN-PU-046-2020',
    siteId: '2',
    siteName: 'Site B',
    location: 'Pump Station',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2020-09-10',
    hours: 2800,
    responsibleTeam: 'Maintenance',
    criticality: 'Medium',
    lastServiceCompletedDate: '2025-12-08',
    lastInspectionPassedDate: '2025-12-06',
    lastOnSiteAt: '2025-12-14',
    isQuarantined: false,
    relatedAssetIds: [],
  },
  {
    id: 'AST-000038',
    assetTypeId: '3',
    assetTypeCode: 'MSV',
    assetTypeName: 'Mobile Service Vehicle',
    internalClientAssetNumber: 'CLIENT-MSV-003',
    manufacturer: 'Ford',
    make: 'Ford',
    model: 'Ranger',
    manufacturerModelNumber: 'FOR-RANGER-2023',
    supplierSerialNumber: 'SN-MSV-003-2023',
    siteId: '1',
    siteName: 'Site A',
    location: 'Fleet Yard',
    operationalStatus: 'InUse',
    lifecycleStatus: 'Active',
    complianceRAG: 'Green',
    ownership: 'Owned',
    commissionDate: '2023-04-12',
    mileage: 28500,
    responsibleTeam: 'Fleet',
    criticality: 'Low',
    lastServiceCompletedDate: '2025-12-02',
    lastInspectionPassedDate: '2025-11-30',
    lastOnSiteAt: '2025-12-15',
    isQuarantined: false,
    relatedAssetIds: [],
  },
];

// Mock compliance items
let mockComplianceItems: ComplianceItem[] = [
  {
    id: 'comp-001',
    assetId: 'AST-000001',
    complianceType: 'PUWER',
    itemName: 'PUWER Inspection',
    frequencyValue: 12,
    frequencyUnit: 'months',
    lastDoneDate: '2025-01-15',
    nextDueDate: '2026-01-15',
    ragStatus: 'Green',
    standardReference: 'PUWER',
    notes: 'Annual PUWER inspection completed',
    performedBy: 'External Inspector',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2025-01-15T14:30:00Z',
  },
  {
    id: 'comp-002',
    assetId: 'AST-000001',
    complianceType: 'LOLER',
    itemName: 'LOLER Thorough Examination',
    frequencyValue: 6,
    frequencyUnit: 'months',
    lastDoneDate: '2025-06-20',
    nextDueDate: '2025-12-20',
    ragStatus: 'Amber',
    standardReference: 'LOLER',
    notes: '6-monthly thorough examination',
    performedBy: 'LOLER Inspector',
    createdAt: '2024-06-20T10:00:00Z',
    updatedAt: '2025-06-20T11:00:00Z',
  },
  {
    id: 'comp-003',
    assetId: 'AST-000002',
    complianceType: 'LOLER',
    itemName: 'LOLER Thorough Examination',
    frequencyValue: 6,
    frequencyUnit: 'months',
    lastDoneDate: '2025-06-05',
    nextDueDate: '2025-12-05',
    ragStatus: 'Green',
    standardReference: 'LOLER',
    createdAt: '2024-06-05T10:00:00Z',
    updatedAt: '2025-06-05T10:00:00Z',
  },
  {
    id: 'comp-004',
    assetId: 'AST-000003',
    complianceType: 'LOLER',
    itemName: 'LOLER Certificate',
    frequencyValue: 12,
    frequencyUnit: 'months',
    lastDoneDate: '2024-10-10',
    nextDueDate: '2025-10-10',
    ragStatus: 'Red',
    standardReference: 'LOLER',
    createdAt: '2023-10-10T10:00:00Z',
    updatedAt: '2024-10-10T10:00:00Z',
  },
  {
    id: 'comp-005',
    assetId: 'AST-000003',
    complianceType: 'PUWER',
    itemName: 'PUWER Assessment',
    frequencyValue: 12,
    frequencyUnit: 'months',
    lastDoneDate: '2024-10-15',
    nextDueDate: '2025-10-15',
    ragStatus: 'Red',
    standardReference: 'PUWER',
    createdAt: '2023-10-15T10:00:00Z',
    updatedAt: '2024-10-15T10:00:00Z',
  },
  {
    id: 'comp-006',
    assetId: 'AST-000005',
    complianceType: 'FIRE_SUPPRESSION',
    itemName: 'Fire Suppression System Service',
    frequencyValue: 12,
    frequencyUnit: 'months',
    lastDoneDate: '2025-06-08',
    nextDueDate: '2026-06-08',
    ragStatus: 'Green',
    standardReference: 'Fire Safety',
    createdAt: '2024-06-08T10:00:00Z',
    updatedAt: '2025-06-08T10:00:00Z',
  },
];

let complianceCounter = mockComplianceItems.length;

export function getAssetTypes(): AssetType[] {
  return assetTypes;
}

export function getAssetTypeById(id: string): AssetType | undefined {
  return assetTypes.find((type) => type.id === id);
}

export function getAssets(filter?: AssetFilter): Asset[] {
  let filtered = [...mockAssets];

  // Apply auto-archive logic (compute effective status)
  filtered = filtered.map((asset) => ({
    ...asset,
    operationalStatus: getEffectiveOperationalStatus(asset),
  }));

  // Exclude archived by default unless includeArchived is true
  // Also exclude Expected lifecycle assets from default view (they're not on site yet)
  if (!filter?.includeArchived) {
    filtered = filtered.filter((asset) => 
      asset.operationalStatus !== 'Archived' && asset.lifecycleStatus !== 'Expected'
    );
  }

  if (!filter) {
    return filtered;
  }

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(
      (asset) =>
        asset.id.toLowerCase().includes(searchLower) ||
        asset.internalClientAssetNumber?.toLowerCase().includes(searchLower) ||
        asset.manufacturer.toLowerCase().includes(searchLower) ||
        asset.make.toLowerCase().includes(searchLower) ||
        asset.model.toLowerCase().includes(searchLower) ||
        asset.manufacturerModelNumber?.toLowerCase().includes(searchLower) ||
        asset.supplierSerialNumber?.toLowerCase().includes(searchLower)
    );
  }

  // Site filter (multi-select)
  if (filter.siteId) {
    const siteIds = Array.isArray(filter.siteId) ? filter.siteId : [filter.siteId];
    filtered = filtered.filter((asset) => siteIds.includes(asset.siteId));
  }

  // Asset type filter (multi-select)
  if (filter.assetTypeId) {
    const typeIds = Array.isArray(filter.assetTypeId) ? filter.assetTypeId : [filter.assetTypeId];
    filtered = filtered.filter((asset) => typeIds.includes(asset.assetTypeId));
  }

  // Operational status filter (multi-select)
  if (filter.operationalStatus) {
    const statuses = Array.isArray(filter.operationalStatus)
      ? filter.operationalStatus
      : [filter.operationalStatus];
    filtered = filtered.filter((asset) => statuses.includes(asset.operationalStatus));
  }

  // Lifecycle status filter (multi-select)
  if (filter.lifecycleStatus) {
    const statuses = Array.isArray(filter.lifecycleStatus)
      ? filter.lifecycleStatus
      : [filter.lifecycleStatus];
    filtered = filtered.filter((asset) => statuses.includes(asset.lifecycleStatus));
  }

  // Compliance RAG filter (multi-select)
  if (filter.complianceRAG) {
    const rags = Array.isArray(filter.complianceRAG) ? filter.complianceRAG : [filter.complianceRAG];
    filtered = filtered.filter((asset) => rags.includes(asset.complianceRAG));
  }

  // Ownership filter (multi-select)
  if (filter.ownership) {
    const ownerships = Array.isArray(filter.ownership) ? filter.ownership : [filter.ownership];
    filtered = filtered.filter((asset) => ownerships.includes(asset.ownership));
  }

  // Responsible team filter (multi-select)
  if (filter.responsibleTeam) {
    const teams = Array.isArray(filter.responsibleTeam) ? filter.responsibleTeam : [filter.responsibleTeam];
    filtered = filtered.filter((asset) => teams.includes(asset.responsibleTeam || ''));
  }

  // Criticality filter (multi-select)
  if (filter.criticality) {
    const criticalities = Array.isArray(filter.criticality) ? filter.criticality : [filter.criticality];
    filtered = filtered.filter((asset) => criticalities.includes(asset.criticality));
  }

  return filtered;
}

export function getAssetById(id: string): Asset | undefined {
  return mockAssets.find((asset) => asset.id === id);
}

/**
 * Update an existing asset
 */
export function updateAsset(id: string, updates: Partial<Asset>): Asset {
  const assetIndex = mockAssets.findIndex((a) => a.id === id);
  if (assetIndex === -1) {
    throw new Error(`Asset ${id} not found`);
  }

  const asset = mockAssets[assetIndex];
  
  // Update site name if siteId changed
  let siteName = asset.siteName;
  if (updates.siteId && updates.siteId !== asset.siteId) {
    const site = mockSites.find((s) => s.id === updates.siteId);
    if (site) {
      siteName = site.name;
    }
  }

  // Update asset type info if assetTypeId changed
  let assetTypeCode = asset.assetTypeCode;
  let assetTypeName = asset.assetTypeName;
  if (updates.assetTypeId && updates.assetTypeId !== asset.assetTypeId) {
    const assetType = assetTypes.find((t) => t.id === updates.assetTypeId);
    if (assetType) {
      assetTypeCode = assetType.code;
      assetTypeName = assetType.name;
    }
  }

  const updatedAsset: Asset = {
    ...asset,
    ...updates,
    siteName,
    assetTypeCode,
    assetTypeName,
    isQuarantined: updates.operationalStatus === 'Quarantined' || asset.isQuarantined,
  };

  mockAssets[assetIndex] = updatedAsset;
  return updatedAsset;
}

/**
 * Bulk update assets
 */
export function bulkUpdateAssets(
  assetIds: string[],
  updates: Partial<Asset>
): { updated: number; errors: Array<{ id: string; error: string }> } {
  const errors: Array<{ id: string; error: string }> = [];
  let updated = 0;

  assetIds.forEach((id) => {
    try {
      updateAsset(id, updates);
      updated++;
    } catch (error) {
      errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return { updated, errors };
}

/**
 * Generate next asset ID (AST-000XXX format)
 */
function generateNextAssetId(): string {
  const existingIds = mockAssets.map((a) => a.id);
  const maxNum = existingIds.reduce((max, id) => {
    const match = id.match(/AST-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 0);
  
  const nextNum = maxNum + 1;
  return `AST-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Create a new asset
 */
export function createAsset(assetData: Partial<Asset> & {
  assetTypeId: string;
  make: string;
  model: string;
  siteId: string;
  operationalStatus: OperationalStatus;
  ownership: Ownership;
  criticality: Criticality;
}): Asset {
  // Try to find asset type by ID first, then by code
  let assetType = assetTypes.find((t) => t.id === assetData.assetTypeId);
  if (!assetType) {
    assetType = assetTypes.find((t) => t.code.toUpperCase() === assetData.assetTypeId.toUpperCase());
  }
  if (!assetType) {
    throw new Error(`Invalid asset type: ${assetData.assetTypeId}`);
  }

  const site = mockSites.find((s) => s.id === assetData.siteId);
  if (!site) {
    throw new Error('Invalid site');
  }

  // Generate ID if not provided
  const assetId = assetData.id || generateNextAssetId();
  
  // Check for duplicate ID
  if (mockAssets.some((a) => a.id === assetId)) {
    throw new Error(`Asset ID ${assetId} already exists`);
  }

  const newAsset: Asset = {
    id: assetId,
    assetTypeId: assetData.assetTypeId,
    assetTypeCode: assetType.code,
    assetTypeName: assetType.name,
    internalClientAssetNumber: assetData.internalClientAssetNumber,
    manufacturer: assetData.manufacturer || assetData.make,
    make: assetData.make,
    model: assetData.model,
    manufacturerModelNumber: assetData.manufacturerModelNumber,
    supplierSerialNumber: assetData.supplierSerialNumber,
    siteId: assetData.siteId,
    siteName: site.name,
    location: assetData.location,
    operationalStatus: assetData.operationalStatus,
    lifecycleStatus: assetData.lifecycleStatus || 'Active',
    complianceRAG: assetData.complianceRAG || 'Green',
    ownership: assetData.ownership,
    hireCompany: assetData.hireCompany,
    commissionDate: assetData.commissionDate,
    dateBroughtToSite: assetData.dateBroughtToSite,
    hours: assetData.hours,
    mileage: assetData.mileage,
    responsibleTeam: assetData.responsibleTeam,
    criticality: assetData.criticality,
    lastServiceCompletedDate: assetData.lastServiceCompletedDate,
    lastInspectionPassedDate: assetData.lastInspectionPassedDate,
    lastOnSiteAt: assetData.lastOnSiteAt || (assetData.lifecycleStatus !== 'Expected' ? new Date().toISOString().split('T')[0] : undefined),
    expectedArrivalDate: assetData.expectedArrivalDate,
    notes: assetData.notes,
    knownIssues: assetData.knownIssues,
    isQuarantined: assetData.operationalStatus === 'Quarantined',
    relatedAssetIds: assetData.relatedAssetIds || [],
    attachments: assetData.attachments || [],
    openChecksCount: assetData.openChecksCount ?? Math.floor(Math.random() * 4), // Mock: random 0-3
    openIssuesCount: assetData.openIssuesCount ?? Math.floor(Math.random() * 3), // Mock: random 0-2
  };

  mockAssets.push(newAsset);
  return newAsset;
}

/**
 * Create multiple assets (for bulk import)
 */
export function createAssets(assetsData: Array<Partial<Asset> & {
  assetTypeId: string;
  make: string;
  model: string;
  siteId: string;
  operationalStatus: OperationalStatus;
  ownership: Ownership;
  criticality: Criticality;
}>): { created: Asset[]; errors: Array<{ row: number; error: string }> } {
  const created: Asset[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  assetsData.forEach((assetData, index) => {
    try {
      const asset = createAsset(assetData);
      created.push(asset);
    } catch (error) {
      errors.push({
        row: index + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return { created, errors };
}

export function getComplianceItemsByAssetId(assetId: string): ComplianceItem[] {
  const asset = getAssetById(assetId);
  if (!asset) return [];

  // Auto-create compliance items based on asset flags if they don't exist
  const existing = mockComplianceItems.filter((item) => item.assetId === assetId);
  const existingTypes = existing.map((item) => item.complianceType);

  // Auto-create PUWER if required and doesn't exist
  if (asset.requiresPuwer && !existingTypes.includes('PUWER')) {
    const puwerItem: ComplianceItem = {
      id: `comp-auto-${assetId}-puwer`,
      assetId,
      complianceType: 'PUWER',
      itemName: 'PUWER Inspection',
      frequencyValue: 12,
      frequencyUnit: 'months',
      lastDoneDate: undefined,
      nextDueDate: new Date().toISOString().split('T')[0], // Due immediately if never done
      ragStatus: 'Red',
      standardReference: 'PUWER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockComplianceItems.push(puwerItem);
    existing.push(puwerItem);
  }

  // Auto-create LOLER if required and doesn't exist
  if (asset.requiresLoler && !existingTypes.includes('LOLER')) {
    const lolerItem: ComplianceItem = {
      id: `comp-auto-${assetId}-loler`,
      assetId,
      complianceType: 'LOLER',
      itemName: 'LOLER Thorough Examination',
      frequencyValue: 6,
      frequencyUnit: 'months',
      lastDoneDate: undefined,
      nextDueDate: new Date().toISOString().split('T')[0], // Due immediately if never done
      ragStatus: 'Red',
      standardReference: 'LOLER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockComplianceItems.push(lolerItem);
    existing.push(lolerItem);
  }

  // Auto-create Fire Suppression if required and doesn't exist
  if (asset.hasFireSuppression && !existingTypes.includes('FIRE_SUPPRESSION')) {
    const fireItem: ComplianceItem = {
      id: `comp-auto-${assetId}-fire`,
      assetId,
      complianceType: 'FIRE_SUPPRESSION',
      itemName: 'Fire Suppression System Service',
      frequencyValue: 12,
      frequencyUnit: 'months',
      lastDoneDate: undefined,
      nextDueDate: new Date().toISOString().split('T')[0], // Due immediately if never done
      ragStatus: 'Red',
      standardReference: 'Fire Safety',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockComplianceItems.push(fireItem);
    existing.push(fireItem);
  }

  return existing;
}

export function calculateComplianceRAG(nextDueDate: string, thresholdDays: number = 30): ComplianceRAG {
  const today = new Date();
  const due = new Date(nextDueDate);
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return 'Red'; // Overdue
  } else if (daysUntil <= thresholdDays) {
    return 'Amber'; // Due soon
  } else {
    return 'Green'; // Compliant
  }
}

// Calculate next due date from last done date and frequency
function calculateNextDueDate(
  lastDoneDate: string,
  frequencyValue: number,
  frequencyUnit: 'days' | 'weeks' | 'months' | 'years'
): string {
  const lastDone = new Date(lastDoneDate);
  const nextDue = new Date(lastDone);

  switch (frequencyUnit) {
    case 'days':
      nextDue.setDate(nextDue.getDate() + frequencyValue);
      break;
    case 'weeks':
      nextDue.setDate(nextDue.getDate() + frequencyValue * 7);
      break;
    case 'months':
      nextDue.setMonth(nextDue.getMonth() + frequencyValue);
      break;
    case 'years':
      nextDue.setFullYear(nextDue.getFullYear() + frequencyValue);
      break;
  }

  return nextDue.toISOString().split('T')[0];
}

// Create a new compliance item
export function createComplianceItem(
  assetId: string,
  data: {
    complianceType: ComplianceItem['complianceType'];
    itemName: string;
    frequencyValue: number;
    frequencyUnit: ComplianceItem['frequencyUnit'];
    standardReference?: string;
    notes?: string;
    lastDoneDate?: string;
    nextDueDate?: string;
  }
): ComplianceItem {
  const lastDone = data.lastDoneDate || new Date().toISOString().split('T')[0];
  const nextDue = data.nextDueDate || calculateNextDueDate(lastDone, data.frequencyValue, data.frequencyUnit);
  const ragStatus = calculateComplianceRAG(nextDue);

  const item: ComplianceItem = {
    id: `comp-${String(complianceCounter + 1).padStart(6, '0')}`,
    assetId,
    complianceType: data.complianceType,
    itemName: data.itemName,
    frequencyValue: data.frequencyValue,
    frequencyUnit: data.frequencyUnit,
    lastDoneDate: lastDone,
    nextDueDate: nextDue,
    ragStatus,
    standardReference: data.standardReference,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockComplianceItems.push(item);
  complianceCounter++;
  return item;
}

// Update a compliance item
export function updateComplianceItem(
  id: string,
  updates: Partial<ComplianceItem>
): ComplianceItem {
  const index = mockComplianceItems.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error('Compliance item not found');
  }

  const existing = mockComplianceItems[index];
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate RAG if next due date changed
  if (updates.nextDueDate) {
    updated.ragStatus = calculateComplianceRAG(updates.nextDueDate);
  }

  mockComplianceItems[index] = updated;
  return updated;
}

// Mark compliance item as done
export function markComplianceItemDone(
  id: string,
  doneDate: string,
  evidenceDocumentId?: string,
  evidenceDocumentName?: string,
  notes?: string,
  performedBy?: string
): ComplianceItem {
  const item = mockComplianceItems.find((i) => i.id === id);
  if (!item) {
    throw new Error('Compliance item not found');
  }

  const nextDue = calculateNextDueDate(doneDate, item.frequencyValue, item.frequencyUnit);
  const ragStatus = calculateComplianceRAG(nextDue);

  return updateComplianceItem(id, {
    lastDoneDate: doneDate,
    nextDueDate: nextDue,
    ragStatus,
    evidenceDocumentId,
    evidenceDocumentName,
    notes: notes || item.notes,
    performedBy: performedBy || item.performedBy,
  });
}

// Delete a compliance item
export function deleteComplianceItem(id: string): void {
  const index = mockComplianceItems.findIndex((item) => item.id === id);
  if (index !== -1) {
    mockComplianceItems.splice(index, 1);
  }
}

/**
 * Check if asset should be auto-archived based on lastOnSiteAt date
 * Auto-archives if lastOnSiteAt is more than 60 days ago
 */
export function shouldAutoArchive(asset: Asset): boolean {
  if (!asset.lastOnSiteAt) return false;
  if (asset.operationalStatus === 'Archived') return false; // Already archived
  
  const today = new Date();
  const lastSeen = new Date(asset.lastOnSiteAt);
  const daysSince = Math.floor((today.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSince >= 60;
}

/**
 * Get effective operational status (applies auto-archive logic)
 */
export function getEffectiveOperationalStatus(asset: Asset): Asset['operationalStatus'] {
  if (shouldAutoArchive(asset)) {
    return 'Archived';
  }
  return asset.operationalStatus;
}

// Mock sites
export const mockSites = [
  { id: '1', name: 'Site A' },
  { id: '2', name: 'Site B' },
  { id: '3', name: 'Site C' },
];

// Mock responsible teams
export const mockResponsibleTeams = [
  'Plant Team',
  'Heavy Plant',
  'Warehouse',
  'Electrical',
  'Workshop',
  'Maintenance',
  'Fleet',
];

// ============================================================================
// ASSET RELATIONSHIPS (Parent → Child Dependencies)
// ============================================================================

import type { AssetRelationship, RelationshipType, OperationalStatus } from './types';

// Mock relationships store
let mockRelationships: AssetRelationship[] = [
  {
    id: 'rel-001',
    parentAssetId: 'AST-000001',
    childAssetId: 'AST-000002',
    relationshipType: 'DEPENDENCY',
    notes: 'MEWP depends on excavator for transport',
    createdAt: '2025-12-01T10:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'rel-002',
    parentAssetId: 'AST-000001',
    childAssetId: 'AST-000009',
    relationshipType: 'DEPENDENCY',
    notes: 'Secondary excavator depends on primary',
    createdAt: '2025-12-01T10:00:00Z',
    createdBy: 'user-1',
  },
];

let relationshipCounter = mockRelationships.length;

// Get all children for a parent asset
export function getChildAssets(parentAssetId: string): Asset[] {
  const childIds = mockRelationships
    .filter((rel) => rel.parentAssetId === parentAssetId)
    .map((rel) => rel.childAssetId);
  return childIds.map((id) => getAssetById(id)).filter(Boolean) as Asset[];
}

// Get all parents for a child asset
export function getParentAssets(childAssetId: string): Asset[] {
  const parentIds = mockRelationships
    .filter((rel) => rel.childAssetId === childAssetId)
    .map((rel) => rel.parentAssetId);
  return parentIds.map((id) => getAssetById(id)).filter(Boolean) as Asset[];
}

// Get all relationships for an asset (as parent or child)
export function getAssetRelationships(assetId: string): AssetRelationship[] {
  return mockRelationships.filter(
    (rel) => rel.parentAssetId === assetId || rel.childAssetId === assetId
  );
}

// Check if a relationship would create a cycle
export function wouldCreateCycle(
  parentAssetId: string,
  childAssetId: string
): boolean {
  // Prevent self-reference
  if (parentAssetId === childAssetId) {
    return true;
  }

  // Check if child is already a parent of the proposed parent (direct cycle)
  const directCycle = mockRelationships.some(
    (rel) => rel.parentAssetId === childAssetId && rel.childAssetId === parentAssetId
  );
  if (directCycle) {
    return true;
  }

  // Check for transitive cycles: if child has any descendants that include parent
  const checkDescendants = (assetId: string, visited: Set<string>): boolean => {
    if (visited.has(assetId)) {
      return false; // Already checked this branch
    }
    visited.add(assetId);

    const children = mockRelationships
      .filter((rel) => rel.parentAssetId === assetId)
      .map((rel) => rel.childAssetId);

    for (const childId of children) {
      if (childId === parentAssetId) {
        return true; // Found cycle
      }
      if (checkDescendants(childId, visited)) {
        return true;
      }
    }
    return false;
  };

  return checkDescendants(childAssetId, new Set());
}

// Create a new relationship
export function createAssetRelationship(
  parentAssetId: string,
  childAssetId: string,
  relationshipType: RelationshipType = 'DEPENDENCY',
  notes?: string,
  createdBy?: string
): AssetRelationship {
  // Validate assets exist
  const parent = getAssetById(parentAssetId);
  const child = getAssetById(childAssetId);
  if (!parent || !child) {
    throw new Error('Parent or child asset not found');
  }

  // Check for cycles
  if (wouldCreateCycle(parentAssetId, childAssetId)) {
    throw new Error('This relationship would create a cycle');
  }

  // Check if relationship already exists
  const exists = mockRelationships.some(
    (rel) =>
      rel.parentAssetId === parentAssetId && rel.childAssetId === childAssetId
  );
  if (exists) {
    throw new Error('Relationship already exists');
  }

  const relationship: AssetRelationship = {
    id: `rel-${String(relationshipCounter + 1).padStart(6, '0')}`,
    parentAssetId,
    childAssetId,
    relationshipType,
    notes,
    createdAt: new Date().toISOString(),
    createdBy,
  };

  mockRelationships.push(relationship);
  relationshipCounter++;
  return relationship;
}

// Delete a relationship
export function deleteAssetRelationship(relationshipId: string): void {
  const index = mockRelationships.findIndex((rel) => rel.id === relationshipId);
  if (index !== -1) {
    mockRelationships.splice(index, 1);
  }
}

// Delete relationship by parent and child IDs
export function deleteAssetRelationshipByIds(
  parentAssetId: string,
  childAssetId: string
): void {
  const index = mockRelationships.findIndex(
    (rel) =>
      rel.parentAssetId === parentAssetId && rel.childAssetId === childAssetId
  );
  if (index !== -1) {
    mockRelationships.splice(index, 1);
  }
}

// Update asset status with dependency handling
export interface UpdateStatusOptions {
  updateChildren?: boolean;
  skipConfirmation?: boolean;
}

export interface StatusUpdateResult {
  updated: Asset[];
  skipped: Asset[];
  auditLog: Array<{
    assetId: string;
    oldStatus: OperationalStatus;
    newStatus: OperationalStatus;
    timestamp: string;
    reason: string;
  }>;
}

export function updateAssetStatusWithDependencies(
  assetId: string,
  newStatus: OperationalStatus,
  options: UpdateStatusOptions = {}
): StatusUpdateResult {
  const asset = getAssetById(assetId);
  if (!asset) {
    throw new Error('Asset not found');
  }

  const result: StatusUpdateResult = {
    updated: [],
    skipped: [],
    auditLog: [],
  };

  const oldStatus = asset.operationalStatus;

  // Update the asset itself
  updateAsset(assetId, { operationalStatus: newStatus });
  result.updated.push({ ...asset, operationalStatus: newStatus });
  result.auditLog.push({
    assetId,
    oldStatus,
    newStatus,
    timestamp: new Date().toISOString(),
    reason: 'Direct status update',
  });

  // If updating to Out of Service/Quarantined and has children, update children if requested
  const statusesThatAffectChildren: OperationalStatus[] = ['OutOfUse', 'Quarantined'];
  if (
    statusesThatAffectChildren.includes(newStatus) &&
    options.updateChildren
  ) {
    const children = getChildAssets(assetId);
    for (const child of children) {
      if (child.operationalStatus !== newStatus) {
        const childOldStatus = child.operationalStatus;
        updateAsset(child.id, { operationalStatus: newStatus });
        result.updated.push({ ...child, operationalStatus: newStatus });
        result.auditLog.push({
          assetId: child.id,
          oldStatus: childOldStatus,
          newStatus,
          timestamp: new Date().toISOString(),
          reason: `Cascaded from parent ${assetId}`,
        });
      } else {
        result.skipped.push(child);
      }
    }
  }

  return result;
}
