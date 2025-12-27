import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { generateAssetCode } from '../assetCode';

const prisma = new PrismaClient();

describe('Asset Code Generation', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.asset.deleteMany({});
    await prisma.assetCounter.deleteMany({});
    await prisma.assetType.deleteMany({});
  });

  it('should generate sequential codes for the same prefix', async () => {
    // Create asset type
    const assetType = await prisma.assetType.create({
      data: {
        name: 'Test Type',
        prefix: 'TEST',
      },
    });

    await prisma.assetCounter.create({
      data: {
        assetTypeId: assetType.id,
        counter: 0,
      },
    });

    // Generate codes
    const code1 = await generateAssetCode('TEST');
    const code2 = await generateAssetCode('TEST');
    const code3 = await generateAssetCode('TEST');

    expect(code1).toBe('TEST-000001');
    expect(code2).toBe('TEST-000002');
    expect(code3).toBe('TEST-000003');
  });

  it('should generate different codes for different prefixes', async () => {
    const type1 = await prisma.assetType.create({
      data: {
        name: 'Type 1',
        prefix: 'T1',
      },
    });

    const type2 = await prisma.assetType.create({
      data: {
        name: 'Type 2',
        prefix: 'T2',
      },
    });

    await prisma.assetCounter.create({
      data: {
        assetTypeId: type1.id,
        counter: 0,
      },
    });

    await prisma.assetCounter.create({
      data: {
        assetTypeId: type2.id,
        counter: 0,
      },
    });

    const code1 = await generateAssetCode('T1');
    const code2 = await generateAssetCode('T2');
    const code3 = await generateAssetCode('T1');

    expect(code1).toBe('T1-000001');
    expect(code2).toBe('T2-000001');
    expect(code3).toBe('T1-000002');
  });
});


