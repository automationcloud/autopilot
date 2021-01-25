import { ScriptInput } from '@automationcloud/engine';

export interface Bundle {
    name: string;
    excluded?: boolean;
    inputs: ScriptInput[];
}
