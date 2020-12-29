import { Script } from '@automationcloud/engine';
import { Bundle } from './bundle';

export interface Automation {
    metadata: AutomationMedatada;
    script: Script;
    bundles: Bundle[];
}

export type AutomationLocation = 'file' | 'ac';

export interface AutomationMedatada {
    version: string;
    location: AutomationLocation;
    filePath: string | null;
    serviceId: string | null;
    draft: boolean;
    domainId: string;
    bundleIndex: number;
}

export const DEFAULT_AUTOMATION_METADATA: AutomationMedatada = {
    version: '1.0.0',
    location: 'file',
    filePath: null,
    serviceId: null,
    domainId: 'Generic',
    draft: true,
    bundleIndex: 0,
};
