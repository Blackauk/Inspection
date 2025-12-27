import { PrismaClient } from '@prisma/client';

// Note: In production, pass prisma instance as parameter
// For now, using singleton for simplicity
const prisma = new PrismaClient();

/**
 * Generates the next sequential asset code for a given prefix.
 * Uses a transaction with row-level locking to ensure thread-safety.
 */
export async function generateAssetCode(prefix: string): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // Find or create the counter for this asset type
    const assetType = await tx.assetType.findUnique({
      where: { prefix },
      include: { assetCounter: true },
    });

    if (!assetType) {
      throw new Error(`AssetType with prefix ${prefix} not found`);
    }

    // Lock the counter row for update
    let counter = await tx.assetCounter.findUnique({
      where: { assetTypeId: assetType.id },
    });

    if (!counter) {
      counter = await tx.assetCounter.create({
        data: {
          assetTypeId: assetType.id,
          counter: 0,
        },
      });
    }

    // Increment and update
    const newCounter = counter.counter + 1;
    await tx.assetCounter.update({
      where: { id: counter.id },
      data: { counter: newCounter },
    });

    // Format: PREFIX-000001
    const paddedNumber = String(newCounter).padStart(6, '0');
    return `${prefix}-${paddedNumber}`;
  });
}
