import { Script } from '@automationcloud/engine';
import { Bundle } from './bundle';

export interface Automation {
    metadata: AutomationMedatada;
    script: Script;
    bundles: Bundle[];
}

export interface AutomationMedatada {
    version: string;
    serviceId: string | null;
    draft: boolean;
    domainId: string;
    bundleIndex: number;
}

export const DEFAULT_AUTOMATION_METADATA: AutomationMedatada = {
    version: '1.0.0',
    serviceId: null,
    domainId: 'Generic',
    draft: true,
    bundleIndex: 0,
};
