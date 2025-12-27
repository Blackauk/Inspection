import { PageHeader } from '../../../components/common/PageHeader';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';

export function HelpPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Help / Guides" subtitle="Documentation and user guides" />
      
      <div className="max-w-4xl mx-auto space-y-4">
        {/* What is Compliance? */}
        <CollapsibleCard
          title="What is Compliance?"
          defaultExpanded={false}
          storageKey="help-compliance"
        >
          <div className="space-y-4 text-gray-700">
            <div>
              <p className="mb-3">
                Compliance tracks statutory, safety, and legally required inspections and controls for an asset. 
                It focuses on whether the asset is legally and safely allowed to be used.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What Compliance Typically Covers</h3>
              <p className="mb-2">Compliance typically includes:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>LOLER</strong> (Lifting Operations and Lifting Equipment Regulations)</li>
                <li><strong>PUWER</strong> (Provision and Use of Work Equipment Regulations)</li>
                <li>Fire suppression systems (if fitted)</li>
                <li>Any other mandatory or safety-critical inspections defined by the business (e.g. pressure systems, calibration, emissions)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How Compliance Works in the System</h3>
              <p className="mb-2">Each compliance item has:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>A <strong>type</strong> (e.g. LOLER, PUWER, Fire Suppression)</li>
                <li>A <strong>frequency</strong> (e.g. 6-monthly, annual)</li>
                <li><strong>Last completed date</strong></li>
                <li><strong>Next due date</strong></li>
                <li>A <strong>RAG status</strong> (Green / Amber / Red)</li>
              </ul>
              <p className="mt-3">
                Compliance status is calculated automatically based on dates and frequency. Evidence (certificates, reports, photos) can be attached. 
                Compliance is asset-level and long-term, not day-to-day task based.
              </p>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">How Compliance Differs from Other Features</h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-900">Compliance</p>
                  <p className="text-sm text-gray-600">"Is this asset legally and safely compliant right now?"</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">PM Schedules</p>
                  <p className="text-sm text-gray-600">Planned maintenance tasks</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Checks</p>
                  <p className="text-sm text-gray-600">Routine operational checks (daily / weekly)</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Work Orders</p>
                  <p className="text-sm text-gray-600">Reactive or planned repair jobs</p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleCard>
      </div>
    </div>
  );
}
