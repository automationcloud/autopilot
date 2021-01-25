import { Script } from '@automationcloud/engine';
import { Bundle } from './bundle';

export interface Automation {
    metadata: AutomationMetadata;
    script: Script;
    bundles: Bundle[];
}

export interface AutomationMetadata {
    version: string;
    serviceId: string | null;
    serviceName: string;
    draft: boolean;
    domainId: string;
    bundleIndex: number;
}

export const DEFAULT_AUTOMATION_METADATA: AutomationMetadata = {
    version: '0.0.0',
    serviceId: null,
    serviceName: 'New Automation',
    domainId: 'Generic',
    draft: true,
    bundleIndex: 0,
};
