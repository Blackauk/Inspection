import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Demo Company',
    },
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      companyId: company.id,
    },
  });

  // Create sites
  const site1 = await prisma.site.create({
    data: {
      name: 'Site A',
      projectId: project.id,
    },
  });

  const site2 = await prisma.site.create({
    data: {
      name: 'Site B',
      projectId: project.id,
    },
  });

  // Create zones
  const zone1 = await prisma.zone.create({
    data: {
      name: 'Zone 1',
      siteId: site1.id,
    },
  });

  // Create users
  const adminPassword = await hashPassword('admin123');
  const supervisorPassword = await hashPassword('supervisor123');
  const fitterPassword = await hashPassword('fitter123');
  const viewerPassword = await hashPassword('viewer123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'Admin',
      companyId: company.id,
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@demo.com',
      password: supervisorPassword,
      firstName: 'Supervisor',
      lastName: 'User',
      role: 'Supervisor',
      companyId: company.id,
      siteAssignments: {
        create: {
          siteId: site1.id,
        },
      },
    },
  });

  const fitter = await prisma.user.create({
    data: {
      email: 'fitter@demo.com',
      password: fitterPassword,
      firstName: 'Fitter',
      lastName: 'User',
      role: 'Fitter',
      companyId: company.id,
      siteAssignments: {
        create: {
          siteId: site1.id,
        },
      },
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@demo.com',
      password: viewerPassword,
      firstName: 'Viewer',
      lastName: 'User',
      role: 'Viewer',
      companyId: company.id,
      siteAssignments: {
        create: {
          siteId: site1.id,
        },
      },
    },
  });

  // Create asset types
  const tbmType = await prisma.assetType.create({
    data: {
      name: 'Tunnel Boring Machine',
      prefix: 'TBM',
    },
  });

  const excavatorType = await prisma.assetType.create({
    data: {
      name: 'Excavator',
      prefix: 'EX',
    },
  });

  const mixerType = await prisma.assetType.create({
    data: {
      name: 'Mixer',
      prefix: 'MW',
    },
  });

  // Create asset counters
  await prisma.assetCounter.create({
    data: {
      assetTypeId: tbmType.id,
      counter: 0,
    },
  });

  await prisma.assetCounter.create({
    data: {
      assetTypeId: excavatorType.id,
      counter: 0,
    },
  });

  await prisma.assetCounter.create({
    data: {
      assetTypeId: mixerType.id,
      counter: 0,
    },
  });

  // Create assets
  const tbm = await prisma.asset.create({
    data: {
      code: 'TBM-000001',
      name: 'TBM Alpha',
      assetTypeId: tbmType.id,
      siteId: site1.id,
      zoneId: zone1.id,
      category: 'Plant',
      ownership: 'Owned',
      status: 'InUse',
      description: 'Main tunnel boring machine',
    },
  });

  const excavator = await prisma.asset.create({
    data: {
      code: 'EX-000001',
      name: 'Excavator 1',
      assetTypeId: excavatorType.id,
      siteId: site1.id,
      zoneId: zone1.id,
      category: 'Equipment',
      ownership: 'Owned',
      status: 'InUse',
      description: 'Heavy duty excavator',
    },
  });

  // Create child asset (subsystem)
  const subsystem = await prisma.asset.create({
    data: {
      code: 'TBM-000002',
      name: 'Cutting Head Assembly',
      assetTypeId: tbmType.id,
      siteId: site1.id,
      zoneId: zone1.id,
      category: 'Equipment',
      ownership: 'Owned',
      status: 'InUse',
      parentAssetId: tbm.id,
      description: 'Cutting head subsystem',
    },
  });

  // Create check template
  const checkTemplate = await prisma.checkTemplate.create({
    data: {
      name: 'Daily TBM Inspection',
      description: 'Daily inspection checklist for TBM',
      questions: {
        create: [
          {
            question: 'Is the cutting head in good condition?',
            type: 'YesNo',
            required: true,
            order: 1,
          },
          {
            question: 'Hydraulic pressure (PSI)',
            type: 'Number',
            unit: 'PSI',
            minValue: 2000,
            maxValue: 3000,
            required: true,
            order: 2,
          },
          {
            question: 'Any visible leaks?',
            type: 'YesNo',
            required: true,
            order: 3,
          },
          {
            question: 'Additional notes',
            type: 'Text',
            required: false,
            order: 4,
          },
        ],
      },
    },
  });

  // Create schedule
  const schedule = await prisma.schedule.create({
    data: {
      assetId: tbm.id,
      siteId: site1.id,
      checkTemplateId: checkTemplate.id,
      name: 'Daily TBM Check',
      scheduleType: 'TimeBased',
      intervalDays: 1,
      isActive: true,
    },
  });

  // Generate some occurrences
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + i);
    await prisma.scheduleOccurrence.create({
      data: {
        scheduleId: schedule.id,
        dueDate,
        isCompleted: i === 0, // First one is completed
      },
    });
  }

  // Create a work order
  const workOrder = await prisma.workOrder.create({
    data: {
      number: `WO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-000001`,
      type: 'Breakdown',
      status: 'Open',
      title: 'TBM Hydraulic Leak',
      description: 'Hydraulic fluid leak detected on main line',
      priority: 'High',
      assetId: tbm.id,
      siteId: site1.id,
      createdById: fitter.id,
    },
  });

  console.log('Seed completed!');
  console.log('Users created:');
  console.log('  Admin: admin@demo.com / admin123');
  console.log('  Supervisor: supervisor@demo.com / supervisor123');
  console.log('  Fitter: fitter@demo.com / fitter123');
  console.log('  Viewer: viewer@demo.com / viewer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


