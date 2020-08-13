/* eslint-disable import/no-default-export */

declare module '*.json' {
    // eslint-disable-next-line init-declarations
    const value: any;
    export default value;
}

declare module '*.vue' {
    import Vue from 'vue';
    export default Vue;
}

declare module 'promise-smart-throttle' {
    function throttle<T>(fn: (...args: any[]) => Promise<T>, delay?: number): (...args: any[]) => Promise<T>;
    export default throttle;
}

declare module '@ubio/protocol' {
    export interface ProtocolProviderOptions {
        ttl: number;
        autoRefresh: boolean;
        url: string;
    }

    export class ProtocolProvider {
        latest: Protocol | null;
        constructor(options: ProtocolProviderOptions);
        fetchLatest(): Promise<Protocol>;
        forceRefreshLatest(): Promise<void>;
    }

    export class Protocol {
        getDomains(): Domain[];
        getDomain(id: string): Domain | null;
        resolveTypeRef(ref: string): TypeDef | null;
    }

    export class Domain {
        protocol: Protocol;
        id: string;
        getInputs(): InputDef[];
        getOutputs(): OutputDef[];
        validateOutput(key: string, data: any): { valid: boolean; errors?: any[] };
    }

    export class TypeDef {
        type: string;
        spec: any;
    }

    export class InputDef {
        key: string;
        getTypeDef(): TypeDef;
    }

    export class OutputDef {
        key: string;
        getTypeDef(): TypeDef;
    }
}
