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
    serviceName: string | null;
    draft: boolean;
    domainId: string;
    bundleIndex: number;
}

export const DEFAULT_AUTOMATION_METADATA: AutomationMetadata = {
    version: '1.0.0',
    serviceId: null,
    serviceName: null,
    domainId: 'Generic',
    draft: true,
    bundleIndex: 0,
};
