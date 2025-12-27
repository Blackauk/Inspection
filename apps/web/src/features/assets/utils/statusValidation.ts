import type { OperationalStatus, LifecycleStatus } from '../types';

export interface StatusValidationResult {
  isValid: boolean;
  message?: string;
  autoCorrect?: {
    operationalStatus?: OperationalStatus;
    lifecycleStatus?: LifecycleStatus;
  };
}

/**
 * Validate status combinations and provide auto-correction suggestions
 */
export function validateStatusCombination(
  operationalStatus: OperationalStatus,
  lifecycleStatus: LifecycleStatus
): StatusValidationResult {
  // Rule 1: If Lifecycle = Expected, Operational cannot be InUse
  if (lifecycleStatus === 'Expected') {
    if (operationalStatus === 'InUse') {
      return {
        isValid: false,
        message: 'An asset that hasn\'t arrived yet cannot be "In Use".',
        autoCorrect: {
          operationalStatus: 'Archived',
        },
      };
    }
    // Default to Archived for Expected assets
    if (operationalStatus !== 'Archived') {
      return {
        isValid: true,
        message: 'This asset is not on site yet. Operational status will be set to "Archived".',
        autoCorrect: {
          operationalStatus: 'Archived',
        },
      };
    }
  }

  // Rule 2: If Lifecycle = Decommissioned or Disposed, Operational must be Archived
  if (lifecycleStatus === 'Decommissioned' || lifecycleStatus === 'Disposed') {
    if (operationalStatus !== 'Archived') {
      return {
        isValid: false,
        message: `An asset that is ${lifecycleStatus.toLowerCase()} must have operational status "Archived".`,
        autoCorrect: {
          operationalStatus: 'Archived',
        },
      };
    }
  }

  // Rule 3: If Operational = InUse, Lifecycle must be Active
  if (operationalStatus === 'InUse') {
    if (lifecycleStatus !== 'Active') {
      return {
        isValid: false,
        message: 'An asset that is "In Use" must have lifecycle status "Active".',
        autoCorrect: {
          lifecycleStatus: 'Active',
        },
      };
    }
  }

  // Rule 4: If Operational = Under Repair or OutOfUse, Lifecycle cannot be Disposed
  if ((operationalStatus === 'OutOfUse' || operationalStatus === 'Quarantined') && lifecycleStatus === 'Disposed') {
    return {
      isValid: false,
      message: 'An asset that is disposed cannot be marked as "Out of Service" or "Quarantined".',
      autoCorrect: {
        operationalStatus: 'Archived',
      },
    };
  }

  return { isValid: true };
}

/**
 * Get helper text for status combinations
 */
export function getStatusHelperText(
  operationalStatus: OperationalStatus,
  lifecycleStatus: LifecycleStatus
): string | null {
  if (lifecycleStatus === 'Expected') {
    return 'This asset is not on site yet. It will be archived until it arrives.';
  }
  if (lifecycleStatus === 'Disposed' || lifecycleStatus === 'Decommissioned') {
    return 'This asset has been removed from the fleet. Operational status must be "Archived".';
  }
  if (operationalStatus === 'InUse' && lifecycleStatus !== 'Active') {
    return 'An asset in use must have lifecycle status "Active".';
  }
  return null;
}
