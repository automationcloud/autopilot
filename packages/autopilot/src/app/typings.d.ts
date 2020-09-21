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
