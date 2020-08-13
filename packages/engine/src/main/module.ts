import { Extension } from './extension';

/**
 * Metaprogramming interface for exposing library-related info on Action and Pipe prototypes.
 * @internal
 */
export interface Module {
    $type: string;
    $help: string;
    $metadata: ModuleMetadata;
    $description?: string;
    $icon?: string;
    $deprecated?: string;
    $hidden?: boolean;
    $extension?: Extension;
}

/**
 * @param module
 * @internal
 */
export function parseModuleMetadata(module: Module): ModuleMetadata {
    const $type = module.$type || '';
    const i = module.$type.indexOf('.');
    const ns = i > -1 ? $type.substring(0, i) : 'Custom';
    const method = i > -1 ? $type.substring(i + 1) : $type;
    return { ns, method };
}

/**
 * @internal
 */
export interface ModuleMetadata {
    ns: string;
    method: string;
}
